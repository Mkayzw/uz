import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ApprovalForm from './ApprovalForm';
import VerifyAgentButton from './VerifyAgentButton';
import { SupabaseClient } from '@supabase/supabase-js';

// Define the type for our agent profiles
type AgentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_verified_agent: boolean;
};

type PaymentSubmission = {
  payment_id: string;
  transaction_code: string;
  created_at: string;
  agent_id: string;
  full_name: string | null;
  email: string | null;
};

type Submission = {
  id: string;
  transaction_code: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
  }[] | null;
};

// This function checks if the current user is an admin
async function checkAdminRole(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  // In a real app, you would check a custom claim or a 'roles' table.
  // For this implementation, we check a specific field in the user's profile.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) return false;
  
  return profile.role === 'admin';
}

export default async function AdminDashboard() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const isAdmin = await checkAdminRole(supabase);

  // If the user is not an admin, redirect them to the home page.
  if (!isAdmin) {
    redirect('/');
  }

  // If the user IS an admin, fetch all unverified payment submissions.
  const { data: submissions, error } = await supabase
    .from('agent_payments')
    .select(`
      id,
      transaction_code,
      created_at,
      profiles (
        id,
        full_name,
        email
      )
    `)
    .eq('verified', false);

  if (error) {
    return <div className="p-8 text-red-500">Error fetching payment submissions: {error.message}</div>;
  }

  const paymentSubmissions: PaymentSubmission[] = submissions?.map((s: Submission) => ({
    payment_id: s.id,
    transaction_code: s.transaction_code,
    created_at: s.created_at,
    agent_id: s.profiles?.[0]?.id ?? '',
    full_name: s.profiles?.[0]?.full_name ?? null,
    email: s.profiles?.[0]?.email ?? null,
  })) || [];

  // Fetch all agent profiles
  const { data: agents, error: agentsError } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_verified_agent')
        .eq('role', 'agent');
    






    

    
    












    







    
    

  if (agentsError) {
    return <div className="p-8 text-red-500">Error fetching agents: {agentsError.message}</div>;
  }

  const agentProfiles: AgentProfile[] = agents || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Admin Dashboard
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Pending Payment Verifications
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Transaction Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Submitted At
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paymentSubmissions.length > 0 ? (
                paymentSubmissions.map((submission) => (
                  <tr key={submission.payment_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {submission.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {submission.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {submission.transaction_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {new Date(submission.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <ApprovalForm payment_id={submission.payment_id} agent_id={submission.agent_id} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No pending payments to verify.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-8 mb-4">
          Agent Management
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Verification Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {agentProfiles.length > 0 ? (
                agentProfiles.map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {agent.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {agent.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {agent.is_verified_agent ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Not Verified
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!agent.is_verified_agent && (
                        <VerifyAgentButton agentId={agent.id} />
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No agents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
