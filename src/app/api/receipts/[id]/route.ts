import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import pdf from 'html-pdf-node'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const applicationId = params.id

  const { data: application, error } = await supabase
    .from('applications')
    .select(
      `
      *,
      property:pads!inner(*, agent:profiles!pads_created_by_fkey(full_name, ecocash_number)),
      tenant:profiles!inner(full_name, registration_number, national_id, id),
      bed:beds!inner(*, room:rooms!inner(name, price))
      `
    )
    .eq('id', applicationId)
    .single()

  if (error || !application) {
    console.error('Error fetching application:', error)
    return NextResponse.json({ error: 'Receipt not found or you do not have permission to view it.' }, { status: 404 })
  }

  const { property, tenant, bed, created_at, transaction_code } = application
  const { agent } = property
  const { room } = bed

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; }
      .container { border: 1px solid #ddd; padding: 40px; }
      h1 { text-align: center; color: #333; }
      .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
      .details, .summary { margin-top: 20px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 12px; border: 1px solid #ddd; text-align: left; }
      th { background-color: #f7f7f7; }
      .total { font-weight: bold; }
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
              <td>$${room.price.toFixed(2)}</td>
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
              <td class="total">$${room.price.toFixed(2)}</td>
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
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      pdf.generatePdf({ content: htmlContent }, { format: 'A4' }, (err, buffer) => {
        if (err) {
          reject(err)
        } else {
          resolve(buffer)
        }
      })
    })

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