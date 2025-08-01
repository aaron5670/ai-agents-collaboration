export interface Agent {
  id: string;
  name: string;
  description: string;
  expertise: string;
  personality: string;
  systemPrompt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  agentId?: string;
  agentName?: string;
  timestamp: string;
  phase?: 'planning' | 'execution' | 'integration';
}

export interface Collaboration {
  id: string;
  name: string;
  description: string;
  selectedAgents: string[]; // Agent IDs
  messages: Message[];
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
  finalResult?: string;
}

export interface AgentConversation {
  agentId: string;
  agentName: string;
  messages: Message[];
}

export interface CreateAgentRequest {
  prompt: string;
}

export interface CreateCollaborationRequest {
  name: string;
  description: string;
  selectedAgents: string[];
}

export interface SendMessageRequest {
  collaborationId: string;
  message: string;
}