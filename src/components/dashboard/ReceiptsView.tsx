'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Application } from '@/types/dashboard'
import ReceiptCard from './ReceiptCard'
import { useToast } from '@/components/ToastManager'

export default function ReceiptsView() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const { addToast } = useToast()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function fetchApplications() {
      setLoading(true)
      try {
        const { data: user } = await supabase.auth.getUser()
        
        if (!user?.user?.id) {
          setLoading(false)
          return
        }

        // Fetch user profile to determine role
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.user.id)
          .single()

        if (profileError) throw profileError
        const userRole = profileData?.role

        let query = supabase
          .from('applications')
          .select(`
            id,
            created_at,
            updated_at,
            transaction_code,
            payment_verified,
            tenant:tenant_id (
              full_name,
              ecocash_number,
              registration_number,
              national_id,
              gender
            ),
            bed:bed_id (
              bed_number,
              room:room_id (
                name,
                room_type,
                price_per_bed,
                property:property_id (
                  id,
                  title,
                  address,
                  city,
                  property_type,
                  view_count,
                  created_at,
                  owner_id
                )
              )
            )
          `)
          .eq('payment_verified', true)
          .order('updated_at', { ascending: false })

        // For tenants, only show their own applications
        if (userRole === 'tenant') {
          query = query.eq('tenant_id', user.user.id)
        } 
        // For agents, show applications for properties they own
        else if (userRole === 'agent') {
          // Use a database view or function to fetch applications for properties owned by the agent
          // This assumes a view or function named 'agent_applications' exists in the database
          const { data: agentApplications, error: agentApplicationsError } = await supabase
            .from('agent_applications')
            .select(`
              id,
              created_at,
              updated_at,
              transaction_code,
              payment_verified,
              tenant_full_name,
              tenant_ecocash_number,
              tenant_registration_number,
              tenant_national_id,
              tenant_gender,
              bed_number,
              room_name,
              room_type,
              price_per_bed,
              property_id,
              property_title,
              property_address,
              property_city,
              property_type,
              property_view_count,
              property_created_at,
              property_owner_id
            `)
            .eq('owner_id', user.user.id)
            .eq('payment_verified', true)
            .order('updated_at', { ascending: false })

          if (agentApplicationsError) throw agentApplicationsError
          setApplications(agentApplications || [])
          setLoading(false)
          return
        }

        console.log('About to execute query for user role:', userRole)
        const { data, error } = await query
        
        console.log('Query result:', { data, error, dataLength: data?.length })
        
        if (error) {
          console.error('Supabase query error:', error)
          throw error
        }
        
        // Debug logging to see raw data structure
        if (data && data.length > 0) {
          console.log('Raw Supabase data:', JSON.stringify(data[0], null, 2))
        } else {
          console.log('No data returned from query')
        }
        
        // Transform the data and fetch all owner information in a single query to avoid N+1 problem
        // 1. Collect all unique owner_ids from the properties
        const ownerIdsSet = new Set<string>();
        data.forEach((app: any) => {
          const property = app.bed?.room?.property;
          if (property && property.owner_id) {
            ownerIdsSet.add(property.owner_id);
          }
        });
        const ownerIds = Array.from(ownerIdsSet);

        // 2. Fetch all owners in a single query
        let ownersMap: Record<string, { full_name: string; phone_number: string }> = {};
        if (ownerIds.length > 0) {
          const { data: ownersData, error: ownersError } = await supabase
            .from('profiles')
            .select('id, full_name, phone_number')
            .in('id', ownerIds);
          if (ownersError) {
            console.log('Error fetching owners:', ownersError);
          } else if (ownersData) {
            ownersMap = ownersData.reduce((acc: typeof ownersMap, owner: any) => {
              acc[owner.id] = { full_name: owner.full_name, phone_number: owner.phone_number };
              return acc;
            }, {});
          }
        }

        // 3. Format applications, attaching owner data from the map
        const formattedApplications = data.map((app: any) => {
          const property = app.bed?.room?.property;
          let propertyWithOwner = property;
          if (property) {
            const owner = property.owner_id ? ownersMap[property.owner_id] : undefined;
            propertyWithOwner = {
              ...property,
              ...(owner ? { owner } : {}),
              location: property.address,
            };
          }
          return {
            ...app,
            property: propertyWithOwner,
          };
        }) as Application[];
        
        // Debug logging to verify data structure
        if (formattedApplications.length > 0) {
          console.log('Sample application data after owner fetch:', {
            tenant: formattedApplications[0].tenant,
            property_owner: formattedApplications[0].property?.owner,
            property_title: formattedApplications[0].property?.title
          })
        }
        
        setApplications(formattedApplications)
      } catch (error) {
        console.error('Error fetching applications:', error)
        addToast({
          title: 'Error',
          message: 'Failed to load your receipts',
          type: 'error',
          duration: 5000
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchApplications()
  }, [supabase, addToast])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Receipts</h2>
      </div>
      
      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : applications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map(application => (
            <ReceiptCard 
              key={application.id} 
              application={application} 
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="mb-4">
            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No receipts found</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            No payment receipts are currently available. Receipts will appear here once payments are verified.
          </p>
        </div>
      )}
    </div>
  )
}
