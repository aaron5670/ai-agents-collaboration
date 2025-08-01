'use client';

import { useState, useRef, useEffect } from 'react';
import { Collaboration, Agent, Message } from '@/types';

interface ChatInterfaceProps {
  collaboration: Collaboration;
  agents: Agent[];
}

export function ChatInterface({ collaboration: initialCollaboration, agents }: ChatInterfaceProps) {
  const [collaboration, setCollaboration] = useState(initialCollaboration);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  const [agentThinking, setAgentThinking] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('');
  const [workingAgent, setWorkingAgent] = useState<string>('');
  const [streamingMessages, setStreamingMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [collaboration.messages, pendingMessage, agentThinking]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageToSend = newMessage.trim();
    setPendingMessage(messageToSend);
    setNewMessage('');
    setIsSending(true);
    setAgentThinking(true);
    setStreamingMessages([]);
    setCurrentPhase('');
    setWorkingAgent('');

    try {
      // Use streaming API
      const response = await fetch(`/api/collaboration/${collaboration.id}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      let updatedCollaboration = { ...collaboration };
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setAgentThinking(false);
              setCurrentPhase('');
              setWorkingAgent('');
              continue;
            }

            try {
              const update = JSON.parse(data);

              if (update.type === 'phase') {
                setCurrentPhase(update.phase || '');
                setWorkingAgent(update.agentName || '');
              } else if (update.type === 'agent_working') {
                setWorkingAgent(update.agentName || '');
              } else if (update.type === 'message') {
                const newMessage = update.message;
                updatedCollaboration.messages.push(newMessage);
                setStreamingMessages(prev => [...prev, newMessage]);
              } else if (update.type === 'complete') {
                setAgentThinking(false);
                setCurrentPhase('');
                setWorkingAgent('');
                // Refresh collaboration data
                window.location.reload();
              }
            } catch (parseError) {
              console.error('Error parsing update:', parseError);
            }
          }
        }
      }

      setCollaboration(updatedCollaboration);
      setPendingMessage('');

    } catch (error) {
      console.error('Error in streaming:', error);
      setPendingMessage('');
      setNewMessage(messageToSend);
      setAgentThinking(false);
      setCurrentPhase('');
      setWorkingAgent('');
    } finally {
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAgentInfo = (agentId?: string) => {
    if (!agentId) return null;
    return agents.find(agent => agent.id === agentId);
  };

  const isIntegratedResponse = (messageIndex: number) => {
    // The last agent message in a group is likely the integrated response
    const messages = collaboration.messages;
    const userMessages = messages.filter(m => m.role === 'user').length;
    const agentMessages = messages.filter(m => m.role === 'agent');

    // If this is the last agent message in the latest batch
    const lastUserMessageIndex = messages.map((m, i) => m.role === 'user' ? i : -1).filter(i => i !== -1).pop() || 0;
    const agentMessagesAfterLastUser = messages.slice(lastUserMessageIndex + 1).filter(m => m.role === 'agent');

    return agentMessagesAfterLastUser.length > 1 &&
      messageIndex === messages.length - 1 &&
      messages[messageIndex].role === 'agent';
  };

  const getAgentRoleIndicator = (message: Message, messageIndex: number) => {
    // Check if this message has a phase indicator
    if (message.phase === 'planning') {
      return { role: 'Planning Phase', icon: '📋', color: 'from-green-400 to-emerald-500' };
    }
    if (message.phase === 'execution') {
      return { role: 'Execution Phase', icon: '⚙️', color: 'from-blue-400 to-cyan-500' };
    }
    if (message.phase === 'integration') {
      return { role: 'Integration Phase', icon: '🔗', color: 'from-purple-400 to-indigo-500' };
    }

    const messages = collaboration.messages;
    const lastUserMessageIndex = messages.map((m, i) => m.role === 'user' ? i : -1).filter(i => i !== -1).pop() || 0;
    const agentMessagesAfterLastUser = messages.slice(lastUserMessageIndex + 1).filter(m => m.role === 'agent');
    const currentAgentIndex = agentMessagesAfterLastUser.findIndex(m => m.id === messages[messageIndex]?.id);

    if (isIntegratedResponse(messageIndex)) {
      return { role: 'Coordinator', icon: '🎯', color: 'from-purple-400 to-indigo-500' };
    }

    // Assign role indicators based on agent order
    const roleIndicators = [
      { role: 'Researcher', icon: '🔍', color: 'from-blue-400 to-cyan-500' },
      { role: 'Specialist', icon: '⚡', color: 'from-green-400 to-teal-500' },
      { role: 'Reviewer', icon: '✅', color: 'from-orange-400 to-red-500' }
    ];

    return roleIndicators[currentAgentIndex] || { role: 'Expert', icon: '🤖', color: 'from-gray-400 to-gray-500' };
  };

  const renderMessage = (message: Message, messageIndex: number) => {
    const agent = getAgentInfo(message.agentId);

    if (message.role === 'user') {
      return (
        <div key={message.id} className="flex justify-end mb-4">
          <div className="max-w-4xl w-full sm:w-auto">
            <div className="bg-blue-600 text-white rounded-lg px-4 py-3">
              <p className="text-sm">{message.content}</p>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              You • {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      );
    }

    if (message.role === 'agent') {
      const roleInfo = getAgentRoleIndicator(message, messageIndex);
      const isIntegrated = isIntegratedResponse(messageIndex);

      return (
        <div key={message.id} className="flex justify-start mb-4">
          <div className="max-w-5xl w-full">
            <div className="flex items-center mb-2">
              <div className={`w-8 h-8 bg-gradient-to-r ${roleInfo.color} rounded-full flex items-center justify-center text-white text-sm font-bold`}>
                {roleInfo.icon}
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900 flex items-center">
                  {message.agentName || 'Agent'}
                  {isIntegrated && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                      Integrated Result
                    </span>
                  )}
                  {!isIntegrated && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {roleInfo.role}
                    </span>
                  )}
                  {message.phase && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {message.phase}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {agent?.expertise || 'AI Agent'}
                </div>
              </div>
            </div>
            <div className={`rounded-lg px-4 py-3 ml-11 ${isIntegrated ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200' : 'bg-gray-100'}`}>
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1 ml-11">
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full min-h-[80vh]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {collaboration.messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Start the collaboration
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Ask a question or give an instruction to your agents. They will work together to help you.
            </p>
            <div className="mt-6 bg-blue-50 rounded-lg p-4 max-w-lg mx-auto">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Example prompts:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• "Write a blog post about sustainable technology"</li>
                <li>• "Create a marketing plan for a startup"</li>
                <li>• "Analyze the pros and cons of remote work"</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {collaboration.messages.map((message, index) => renderMessage(message, index))}

            {/* Pending User Message */}
            {pendingMessage && (
              <div className="flex justify-end mb-4">
                <div className="max-w-4xl w-full sm:w-auto">
                  <div className="bg-blue-600 text-white rounded-lg px-4 py-3">
                    <p className="text-sm">{pendingMessage}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    You • {formatTimestamp(new Date().toISOString())}
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Agent Working Indicator */}
            {agentThinking && (
              <div className="flex justify-start mb-4">
                <div className="max-w-4xl w-full">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-800">
                        Agent Collaboration in Progress...
                      </span>
                    </div>

                    {currentPhase && (
                      <div className="mb-3 p-2 bg-white/70 rounded">
                        <span className="text-sm font-medium text-gray-700">
                          Current Phase: {
                            currentPhase === 'planning' ? '📋 Planning & Coordination' :
                              currentPhase === 'execution' ? '⚙️ Execution & Implementation' :
                                currentPhase === 'integration' ? '🔗 Integration & Finalization' :
                                  'Working...'
                          }
                        </span>
                      </div>
                    )}

                    {workingAgent && (
                      <div className="mb-3 p-2 bg-blue-50 rounded">
                        <span className="text-sm text-blue-700">
                          🤖 {workingAgent} is working...
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className={`flex items-center space-x-2 bg-white/50 rounded px-2 py-1 ${currentPhase === 'planning' ? 'ring-2 ring-green-300' : ''}`}>
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-700">📋 Planning</span>
                      </div>
                      <div className={`flex items-center space-x-2 bg-white/50 rounded px-2 py-1 ${currentPhase === 'execution' ? 'ring-2 ring-blue-300' : ''}`}>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        <span className="text-blue-700">⚙️ Execution</span>
                      </div>
                      <div className={`flex items-center space-x-2 bg-white/50 rounded px-2 py-1 ${currentPhase === 'integration' ? 'ring-2 ring-purple-300' : ''}`}>
                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
                        <span className="text-purple-700">🔗 Integration</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Show streaming messages */}
            {streamingMessages.map((message, index) => renderMessage(message, collaboration.messages.length + index))}

            {/* Final Result */}
            {collaboration.finalResult && (
              <div className="border-t pt-6 mt-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Final Collaboration Result
                  </h3>
                  <div className="text-gray-700 whitespace-pre-wrap">
                    {collaboration.finalResult}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-6">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask a question or give an instruction to your agents..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 resize-none"
              rows={3}
              disabled={isSending || collaboration.status === 'completed'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <div className="text-xs text-gray-500 mt-1">
              Press Enter to send, Shift+Enter for a new line
            </div>
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || collaboration.status === 'completed'}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <svg className="w-5 h-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            )}
          </button>
        </form>

        {collaboration.status === 'completed' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              This collaboration is complete. The agents have delivered their final result.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
