'use client';

import { useState } from 'react';
import { createAgent } from '@/lib/actions/agent-actions';

export function CreateAgentForm() {
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit(formData: FormData) {
    setIsCreating(true);
    setMessage(null);

    try {
      const result = await createAgent(formData);

      if (result.success) {
        setMessage({ type: 'success', text: `Agent "${result.agent?.name}" created successfully!` });
        // Reset form
        const form = document.getElementById('create-agent-form') as HTMLFormElement;
        form?.reset();
      } else {
        setMessage({ type: 'error', text: result.error || 'An error occurred' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unknown error occurred' });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <form id="create-agent-form" action={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Describe your desired AI agent
        </label>
        <textarea
          id="prompt"
          name="prompt"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-none"
          placeholder="For example: 'Create an agent that is an expert in writing blog posts about technology and has a friendly and informative writing style.'"
          required
          disabled={isCreating}
        />
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
          {message.text}
        </div>
      )}

      <button
        type="submit"
        disabled={isCreating}
        className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isCreating ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Agent...
          </span>
        ) : (
          'Create Agent'
        )}
      </button>
    </form>
  );
}
