import Link from 'next/link';
import { Collaboration, Agent } from '@/types';

interface CollaborationCardProps {
  collaboration: Collaboration;
  agents: Agent[];
}

export function CollaborationCard({ collaboration, agents }: CollaborationCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSelectedAgents = () => {
    return agents.filter(agent => collaboration.selectedAgents.includes(agent.id));
  };

  const selectedAgents = getSelectedAgents();
  const messageCount = collaboration.messages.filter(msg => msg.role !== 'system').length;
  const userMessages = collaboration.messages.filter(msg => msg.role === 'user').length;
  const agentMessages = collaboration.messages.filter(msg => msg.role === 'agent').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'paused':
        return 'Paused';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {collaboration.name}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            {collaboration.description}
          </p>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(collaboration.status)}`}>
              {getStatusText(collaboration.status)}
            </span>
            <span>{messageCount} messages</span>
            <span>Started: {formatDate(collaboration.createdAt)}</span>
          </div>
        </div>

        <Link
          href={`/collaboration/${collaboration.id}`}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          Open Chat
        </Link>
      </div>

      <div className="border-t pt-4">
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Participating Agents ({selectedAgents.length}):
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedAgents.map((agent) => (
              <span
                key={agent.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
              >
                {agent.name}
              </span>
            ))}
          </div>
        </div>

        {messageCount > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Activity:</h4>
            <div className="flex space-x-4 text-xs text-gray-500">
              <span>{userMessages} user message(s)</span>
              <span>{agentMessages} agent response(s)</span>
            </div>
          </div>
        )}

        {collaboration.finalResult && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Final result available</h4>
            <p className="text-xs text-gray-500">
              The agents have completed their collaboration
            </p>
          </div>
        )}

        {collaboration.messages.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-1">
              Last activity:
            </h4>
            <p className="text-xs text-gray-600">
              {formatDate(collaboration.updatedAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
