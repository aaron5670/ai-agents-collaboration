'use client';

import { useState } from 'react';
import { Agent } from '@/types';
import { removeAgentById } from '@/lib/actions/agent-actions';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await removeAgentById(agent.id);
    } catch (error) {
      console.error('Error deleting agent:', error);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {agent.name}
          </h3>
          <p className="text-sm text-blue-600 font-medium mb-2">
            {agent.expertise}
          </p>
          <p className="text-gray-600 text-sm">
            {agent.description}
          </p>
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isDeleting}
            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Delete Agent"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">Personality:</h4>
          <p className="text-sm text-gray-600">{agent.personality}</p>
        </div>

        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-1">System Prompt:</h4>
          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded line-clamp-3">
            {agent.systemPrompt}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Created: {formatDate(agent.createdAt)}</span>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
            Active
          </span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Delete Agent?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{agent.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
