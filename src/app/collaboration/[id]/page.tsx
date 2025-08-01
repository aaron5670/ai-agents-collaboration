import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCollaborationById } from '@/lib/actions/collaboration-actions';
import { getAgents } from '@/lib/actions/agent-actions';
import { ChatInterface } from '@/components/ChatInterface';

interface CollaborationChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function CollaborationChatPage({ params }: CollaborationChatPageProps) {
  const { id } = await params;
  const [collaboration, allAgents] = await Promise.all([
    getCollaborationById(id),
    getAgents()
  ]);

  if (!collaboration) {
    notFound();
  }

  // Filter agents that are part of this collaboration
  const selectedAgents = allAgents.filter(agent =>
    collaboration.selectedAgents.includes(agent.id)
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/collaboration"
                className="text-green-600 hover:text-green-800 font-medium"
              >
                ← Back to Collaborations
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {collaboration.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {collaboration.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(collaboration.status)}`}>
                {getStatusText(collaboration.status)}
              </span>
            </div>
          </div>

          {/* Agents Info */}
          <div className="mt-4 flex items-center space-x-4">
            <span className="text-sm text-gray-600">Participating agents:</span>
            <div className="flex space-x-2">
              {selectedAgents.map((agent) => (
                <span
                  key={agent.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                >
                  {agent.name}
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-500">
              • Started: {formatDate(collaboration.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 p-4">
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <ChatInterface
            collaboration={collaboration}
            agents={selectedAgents}
          />
        </div>
      </div>
    </div>
  );
}
