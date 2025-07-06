'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export default function PaymentPage() {
  const [transactionCode, setTransactionCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to submit a payment.')
      setLoading(false)
      return
    }

    if (!transactionCode.trim()) {
      setError('Please enter a valid transaction code.')
      setLoading(false)
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('agent_payments')
        .insert({ 
          agent_id: user.id, 
          transaction_code: transactionCode.trim() 
        })

      if (insertError) {
        throw insertError
      }

      setSuccess(true)
      setTransactionCode('')
    } catch (err: any) {
      console.error('Error submitting payment:', err)
      setError('Failed to submit payment. Please try again. If the problem persists, contact support.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">Agent Account Activation</h2>
        
        {success ? (
          <div className="text-center">
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Submission Successful!</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Your transaction code has been submitted for verification. Please allow up to 24 hours for your account to be activated.</p>
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
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                To activate your agent account, please send the subscription fee of <strong>$10.00</strong> via EcoCash to the following number:
              </p>
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
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center mb-4">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
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
