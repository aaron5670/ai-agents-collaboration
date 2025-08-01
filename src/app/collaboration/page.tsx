import Link from 'next/link';
import { getAgents } from '@/lib/actions/agent-actions';
import { getCollaborations } from '@/lib/actions/collaboration-actions';
import { CreateCollaborationForm } from '@/components/CreateCollaborationForm';
import { CollaborationCard } from '@/components/CollaborationCard';

export default async function CollaborationPage() {
  const [agents, collaborations] = await Promise.all([
    getAgents(),
    getCollaborations()
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              AI Agent Collaboration
            </h1>
            <p className="text-gray-600">
              Let your agents work together on complex tasks
            </p>
          </div>
          <Link
            href="/"
            className="text-green-600 hover:text-green-800 font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Collaboration Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                New Collaboration
              </h2>

              {agents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    You haven't created any agents yet
                  </p>
                  <Link
                    href="/agents"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Create agents first →
                  </Link>
                </div>
              ) : (
                <CreateCollaborationForm agents={agents} />
              )}
            </div>
          </div>

          {/* Collaborations List */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Collaborations ({collaborations.length})
              </h2>

              {collaborations.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No collaborations yet
                  </h3>
                  <p className="text-gray-500">
                    Start your first AI agent collaboration
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {collaborations.map((collaboration) => (
                    <CollaborationCard
                      key={collaboration.id}
                      collaboration={collaboration}
                      agents={agents}
                    />
                  ))}
                </div>
              )}
            </div>

            {agents.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Tips for effective collaboration
                </h3>
                <ul className="text-gray-600 space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Select agents with complementary expertise
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Provide clear and specific instructions
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Let agents fully utilize their expertise
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    Save interesting collaborations for later
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
