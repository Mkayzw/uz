'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { approvePayment } from './actions';
import { useEffect } from 'react';

// This type must match the return value of the `approvePayment` action
type State = { 
  error?: string; 
  success: boolean; 
}; 

const initialState: State = {
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 disabled:opacity-50"
    >
      {pending ? 'Approving...' : 'Approve'}
    </button>
  );
}

export default function ApprovalForm({ payment_id, agent_id }: { payment_id: string, agent_id: string }) {
  const [state, formAction] = useFormState(approvePayment, initialState);

  // This component will return null after successful submission, 
  // relying on revalidatePath in the action to remove the row from the table.
  if (state.success) {
    return null;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="payment_id" value={payment_id} />
      <input type="hidden" name="agent_id" value={agent_id} />
      <SubmitButton />
      {state.error && <p className="text-red-500 text-xs mt-1">{state.error}</p>}
    </form>
  );
}
