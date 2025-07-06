'use client';

import { verifyAgentAction } from './actions';

export default function VerifyAgentButton({ agentId }: { agentId: string }) {
  const handleVerification = async () => {
    const result = await verifyAgentAction(agentId);
    if (result?.error) {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <button
      onClick={handleVerification}
      className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200"
    >
      Verify Agent
    </button>
  );
}
