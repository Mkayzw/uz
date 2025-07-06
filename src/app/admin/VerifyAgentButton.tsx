'use client';

import { verifyAgentAction } from './actions';

export default function VerifyAgentButton({ agentId }: { agentId: string }) {
  const handleVerification = async () => {
    if (confirm('Are you sure you want to verify this agent? This action cannot be undone.')) {
      const result = await verifyAgentAction(agentId);
      if (result.error) {
        alert('Verification failed: ' + result.error);
      } else {
        // This will trigger a page refresh to show the updated status
        window.location.reload(); 
      }
    }
  };

  return (
    <button
      onClick={handleVerification}
      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors duration-200"
    >
      Verify Payment
    </button>
  );
}
