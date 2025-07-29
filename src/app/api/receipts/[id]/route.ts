import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import puppeteer from 'puppeteer'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const { id } = await params
  const applicationId = id

  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  // First get the application
  const { data: application, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (appError || !application) {
    console.error('Error fetching application:', appError)
    return NextResponse.json({ error: 'Receipt not found or you do not have permission to view it.' }, { status: 404 })
  }

  // Check if payment is verified before allowing receipt access
  if (!application.payment_verified) {
    return NextResponse.json({ error: 'Receipt not available. Payment must be verified first.' }, { status: 403 })
  }

  // Get bed details
  const { data: bed, error: bedError } = await supabase
    .from('beds')
    .select('*, room:rooms!inner(*, property:properties!inner(*))')
    .eq('id', application.bed_id)
    .single()

  if (bedError || !bed) {
    console.error('Error fetching bed details:', bedError)
    return NextResponse.json({ error: 'Receipt data not found.' }, { status: 404 })
  }

  // Get tenant details
  const { data: tenant, error: tenantError } = await supabase
    .from('profiles')
    .select('full_name, registration_number, national_id, id, gender')
    .eq('id', application.tenant_id)
    .single()

  if (tenantError || !tenant) {
    console.error('Error fetching tenant details:', tenantError)
    return NextResponse.json({ error: 'Receipt data not found.' }, { status: 404 })
  }

  // Get agent details
  const { data: agent, error: agentError } = await supabase
    .from('profiles')
    .select('full_name, ecocash_number')
    .eq('id', bed.room.property.owner_id)
    .single()

  if (agentError || !agent) {
    console.error('Error fetching agent details:', agentError)
    return NextResponse.json({ error: 'Receipt data not found.' }, { status: 404 })
  }

  // Authorization check: User must be either the tenant or the agent who owns the property
  const isOwner = application.tenant_id === user.id
  const isAgent = bed.room.property.owner_id === user.id

  if (!isOwner && !isAgent) {
    return NextResponse.json({ error: 'You do not have permission to access this receipt.' }, { status: 403 })
  }

  const property = bed.room.property
  const room = bed.room
  const { created_at, transaction_code } = application

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 12px; }
      .container { padding: 20px; }
      h1 { text-align: center; color: #333; font-size: 18px; margin-bottom: 20px; }
      .header { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px; }
      .details, .summary { margin-top: 15px; }
      .details h2, .summary h2 { font-size: 14px; margin-bottom: 10px; color: #333; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
      th { background-color: #f7f7f7; font-weight: bold; }
      .total { font-weight: bold; }
      p { margin: 5px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Payment Receipt</h1>
      <div class="header">
        <div>
          <p><strong>Receipt Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Receipt ID:</strong> ${application.id}</p>
        </div>
        <div>
          <p><strong>UniStay</strong></p>
          <p>Harare, Zimbabwe</p>
        </div>
      </div>
      
      <div class="details">
        <h2>Tenant Details</h2>
        <p><strong>Name:</strong> ${tenant.full_name}</p>
        <p><strong>Gender:</strong> ${tenant.gender ? tenant.gender.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'N/A'}</p>
        <p><strong>Student ID:</strong> ${tenant.registration_number}</p>
        <p><strong>National ID:</strong> ${tenant.national_id}</p>
      </div>

      <div class="summary">
        <h2>Booking Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Details</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Property</td>
              <td>${property.title}</td>
              <td>$${room.price_per_bed.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Room</td>
              <td>${room.name}</td>
              <td></td>
            </tr>
            <tr>
              <td>Bed</td>
              <td>${bed.bed_number}</td>
              <td></td>
            </tr>
            <tr>
              <td colspan="2" class="total">Total Paid</td>
              <td class="total">$${room.price_per_bed.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="details">
        <h2>Payment Information</h2>
        <p><strong>Transaction Code:</strong> ${transaction_code}</p>
        <p><strong>Payment Date:</strong> ${new Date(created_at).toLocaleDateString()}</p>
        <p><strong>Paid to:</strong> ${agent.full_name}</p>
        <p><strong>Agent EcoCash:</strong> ${agent.ecocash_number}</p>
      </div>
    </div>
  </body>
  </html>
  `

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      width: '148mm',  
      height: '210mm', 
      printBackground: true,
      margin: {
        top: '8mm',
        right: '8mm',
        bottom: '8mm',
        left: '8mm'
      }
    })
    
    await browser.close()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${application.id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}