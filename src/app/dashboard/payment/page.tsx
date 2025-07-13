'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { User } from '@supabase/supabase-js'

interface Application {
  id: string;
  property_id: string;
  status: 'pending' | 'approved' | 'rejected';
  property: {
    title: string;
    price: number;
    agent_id: string;
  }
}

export default function PaymentPage() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = searchParams.get('application_id')

  const [user, setUser] = useState<User | null>(null)
  const [application, setApplication] = useState<Application | null>(null)
  const [transactionCode, setTransactionCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const initialize = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)

      if (applicationId) {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            id,
            property_id,
            status,
            property:pads(
              title,
              price,
              agent_id:created_by
            )
          `)
          .eq('id', applicationId)
          .eq('tenant_id', user.id)
          .single()

        if (error || !data) {
          setError('Failed to load application details.')
          console.error(error)
        } else if (data.status !== 'approved') {
          setError('This application has not been approved for payment.')
        } else {
          setApplication(data as Application)
        }
      }
      setLoading(false)
    }
    initialize()
  }, [supabase, applicationId, router])

  const paymentType = useMemo(() => applicationId ? 'rent' : 'agent_activation', [applicationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (!user || !transactionCode.trim()) {
      setError('Please enter a valid transaction code.')
      setLoading(false)
      return
    }

    try {
      let insertData: any = { transaction_code: transactionCode.trim() }
      let tableName = ''

      if (paymentType === 'rent' && application) {
        tableName = 'rent_payments'
        insertData = {
          ...insertData,
          application_id: application.id,
          tenant_id: user.id,
          agent_id: application.property.agent_id,
          amount: application.property.price,
        }
      } else if (paymentType === 'agent_activation') {
        tableName = 'agent_payments'
        insertData = { ...insertData, agent_id: user.id }
      } else {
        throw new Error('Invalid payment type.')
      }

      const { error: insertError } = await supabase.from(tableName).insert(insertData)
      if (insertError) throw insertError

      setSuccess(true)
      setTransactionCode('')
    } catch (err: unknown) {
      console.error('Error submitting payment:', err)
      setError('Failed to submit payment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const pageTitle = paymentType === 'rent' ? 'Complete Your Rent Payment' : 'Agent Account Activation'
  const instructions = paymentType === 'rent' ? (
    <>
      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
        Your application for <strong>{application?.property?.title}</strong> has been approved! To secure your place, please send the rent of <strong>${application?.property?.price.toLocaleString()}</strong> via EcoCash to the agent's number below.
      </p>
    </>
  ) : (
    <>
      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
        To activate your agent account, please send the subscription fee of <strong>$10.00</strong> via EcoCash to the following number:
      </p>
    </>
  )

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">{pageTitle}</h2>
        
        {success ? (
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Submission Successful!</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Your transaction code has been submitted for verification.</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h3 className="font-bold text-gray-900 dark:text-white">Payment Instructions</h3>
              {instructions}
              <p className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400 text-center my-3 py-2 bg-white dark:bg-gray-800 rounded">
                0770 000 000
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                After sending the money, enter the transaction code you receive from EcoCash in the field below.
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="transactionCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ecocash Transaction Code
              </label>
              <input
                id="transactionCode"
                type="text"
                value={transactionCode}
                onChange={(e) => setTransactionCode(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. MP2507.0612.H5G7K1"
                required
                disabled={!!error && !applicationId}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || (!!error && !applicationId)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
