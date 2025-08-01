'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Agent } from '@/types';
import { createCollaborationFromJSON } from '@/lib/actions/collaboration-actions';

interface CreateCollaborationFormProps {
  agents: Agent[];
}

export function CreateCollaborationForm({ agents }: CreateCollaborationFormProps) {
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleAgentToggle = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (selectedAgents.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one agent' });
      setIsCreating(false);
      return;
    }

    try {
      const result = await createCollaborationFromJSON({
        name,
        description,
        selectedAgents
      });

      if (result.success && result.collaboration) {
        setMessage({ type: 'success', text: 'Collaboration created successfully!' });
        // Navigate to the collaboration chat
        setTimeout(() => {
          router.push(`/collaboration/${result.collaboration!.id}`);
        }, 1000);
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Name of the collaboration
        </label>
        <input
          type="text"
          id="name"
          name="name"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
          placeholder="For example: Blog Post Project"
          required
          disabled={isCreating}
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 resize-none"
          placeholder="Describe what you want the agents to do together..."
          required
          disabled={isCreating}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Agents ({selectedAgents.length} of {agents.length})
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
          {agents.map((agent) => (
            <label
              key={agent.id}
              className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors ${selectedAgents.includes(agent.id)
                ? 'bg-green-50 border border-green-200'
                : 'hover:bg-gray-50 border border-transparent'
                }`}
            >
              <input
                type="checkbox"
                checked={selectedAgents.includes(agent.id)}
                onChange={() => handleAgentToggle(agent.id)}
                className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                disabled={isCreating}
              />
              <div className="ml-3 flex-1">
                <div className="font-medium text-sm text-gray-900">
                  {agent.name}
                </div>
                <div className="text-xs text-green-600 font-medium">
                  {agent.expertise}
                </div>
                <div className="text-xs text-gray-500 line-clamp-2">
                  {agent.description}
                </div>
              </div>
            </label>
          ))}
        </div>
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
        disabled={isCreating || selectedAgents.length === 0}
        className="w-full bg-green-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isCreating ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Starting Collaboration...
          </span>
        ) : (
          'Start Collaboration'
        )}
      </button>
    </form>
  );
}
