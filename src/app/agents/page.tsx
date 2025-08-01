import Link from 'next/link';
import { getAgents } from '@/lib/actions/agent-actions';
import { CreateAgentForm } from '@/components/CreateAgentForm';
import { AgentCard } from '@/components/AgentCard';

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Manage AI Agents
            </h1>
            <p className="text-gray-600">
              Create and manage your specialized AI agents
            </p>
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Agent Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Create New Agent
              </h2>
              <CreateAgentForm />
            </div>
          </div>

          {/* Agents List */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                My Agents ({agents.length})
              </h2>

              {agents.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No agents yet
                  </h3>
                  <p className="text-gray-500">
                    Create your first AI agent by entering a description
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              )}
            </div>

            {agents.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Ready to collaborate?
                </h3>
                <p className="text-gray-600 mb-4">
                  Select multiple agents and let them work together on complex tasks.
                </p>
                <Link
                  href="/collaboration"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  Start Collaboration
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                  </svg>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
