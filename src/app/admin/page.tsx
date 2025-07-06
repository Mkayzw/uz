import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import VerifyAgentButton from './VerifyAgentButton';

// Define the type for our agent profiles
type AgentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_verified_agent: boolean;
};

// This function checks if the current user is an admin
async function checkAdminRole(supabase: any) {
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

  // If the user IS an admin, fetch all users with the 'agent' role.
  const { data: agents, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, is_verified_agent')
    .eq('role', 'agent');

  if (error) {
    return <div className="p-8 text-red-500">Error fetching agents: {error.message}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Admin Dashboard
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
          Agent Verification
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
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {agents?.map((agent: AgentProfile) => (
                <tr key={agent.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {agent.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {agent.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {agent.is_verified_agent ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!agent.is_verified_agent && (
                      <VerifyAgentButton agentId={agent.id} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
