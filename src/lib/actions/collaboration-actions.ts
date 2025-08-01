'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { 
  saveCollaboration, 
  getCollaboration, 
  getAllCollaborations, 
  getAgent 
} from '@/lib/fileSystem';
import { facilitateMultiAgentCollaboration } from '@/lib/aiService';
import { 
  Collaboration, 
  CreateCollaborationRequest, 
  SendMessageRequest, 
  Message 
} from '@/types';

export async function createCollaboration(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const selectedAgentsString = formData.get('selectedAgents') as string;
    
    if (!name || !description || !selectedAgentsString) {
      throw new Error('Name, description, and selected agents are required');
    }

    const selectedAgents = JSON.parse(selectedAgentsString);
    
    if (!Array.isArray(selectedAgents) || selectedAgents.length === 0) {
      throw new Error('At least one agent must be selected');
    }

    const now = new Date().toISOString();
    const collaboration: Collaboration = {
      id: uuidv4(),
      name,
      description,
      selectedAgents,
      messages: [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await saveCollaboration(collaboration);
    
    revalidatePath('/collaboration');
    return { success: true, collaboration };
  } catch (error) {
    console.error('Error creating collaboration:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create collaboration' 
    };
  }
}

export async function createCollaborationFromJSON(data: CreateCollaborationRequest) {
  try {
    if (!data.name || !data.description || !data.selectedAgents?.length) {
      throw new Error('Name, description, and selected agents are required');
    }

    const now = new Date().toISOString();
    const collaboration: Collaboration = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      selectedAgents: data.selectedAgents,
      messages: [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await saveCollaboration(collaboration);
    
    revalidatePath('/collaboration');
    return { success: true, collaboration };
  } catch (error) {
    console.error('Error creating collaboration:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create collaboration' 
    };
  }
}

// Add streaming collaboration endpoint
export async function startStreamingCollaboration(collaborationId: string, message: string) {
  const collaboration = await getCollaboration(collaborationId);
  if (!collaboration) {
    throw new Error('Collaboration not found');
  }

  // Add user message
  const userMessage: Message = {
    id: uuidv4(),
    role: 'user',
    content: message,
    timestamp: new Date().toISOString(),
  };

  collaboration.messages.push(userMessage);
  await saveCollaboration(collaboration);

  return { success: true, collaboration };
}

export async function sendMessage(formData: FormData) {
  try {
    const collaborationId = formData.get('collaborationId') as string;
    const message = formData.get('message') as string;
    
    if (!collaborationId || !message) {
      throw new Error('Collaboration ID and message are required');
    }

    const collaboration = await getCollaboration(collaborationId);
    if (!collaboration) {
      throw new Error('Collaboration not found');
    }

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    collaboration.messages.push(userMessage);

    // Get agents
    const agents = await Promise.all(
      collaboration.selectedAgents.map(id => getAgent(id))
    );
    const validAgents = agents.filter(agent => agent !== null);

    if (validAgents.length === 0) {
      throw new Error('No valid agents found for this collaboration');
    }

    // Get previous messages for context
    const previousMessages = collaboration.messages
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : msg.agentName || 'Agent'}: ${msg.content}`);

    // Facilitate multi-agent collaboration
    const agentResponses = await facilitateMultiAgentCollaboration(
      validAgents,
      message,
      previousMessages
    );

    // Add agent responses
    for (let i = 0; i < agentResponses.length; i++) {
      const agent = validAgents[i];
      const response = agentResponses[i];
      
      const agentMessage: Message = {
        id: uuidv4(),
        role: 'agent',
        content: response,
        agentId: agent.id,
        agentName: agent.name,
        timestamp: new Date().toISOString(),
      };
      
      collaboration.messages.push(agentMessage);
    }

    // Determine if we should generate a final result
    if (collaboration.messages.length >= 6) { // After a few exchanges
      const finalResult = await generateFinalResult(collaboration);
      collaboration.finalResult = finalResult;
      collaboration.status = 'completed';
    }

    collaboration.updatedAt = new Date().toISOString();
    await saveCollaboration(collaboration);
    
    revalidatePath(`/collaboration/${collaborationId}`);
    return { success: true, collaboration };
  } catch (error) {
    console.error('Error sending message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    };
  }
}

export async function sendMessageJSON(data: SendMessageRequest) {
  try {
    const collaboration = await getCollaboration(data.collaborationId);
    if (!collaboration) {
      throw new Error('Collaboration not found');
    }

    // Same logic as sendMessage but with JSON data
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: data.message,
      timestamp: new Date().toISOString(),
    };

    collaboration.messages.push(userMessage);

    const agents = await Promise.all(
      collaboration.selectedAgents.map(id => getAgent(id))
    );
    const validAgents = agents.filter(agent => agent !== null);

    if (validAgents.length === 0) {
      throw new Error('No valid agents found for this collaboration');
    }

    const previousMessages = collaboration.messages
      .slice(-10)
      .map(msg => `${msg.role === 'user' ? 'User' : msg.agentName || 'Agent'}: ${msg.content}`);

    const agentResponses = await facilitateMultiAgentCollaboration(
      validAgents,
      data.message,
      previousMessages
    );

    // Ensure we have the same number of responses as agents
    const minLength = Math.min(agentResponses.length, validAgents.length);
    
    for (let i = 0; i < minLength; i++) {
      const agent = validAgents[i];
      const response = agentResponses[i];
      
      if (agent && response) {
        const agentMessage: Message = {
          id: uuidv4(),
          role: 'agent',
          content: response,
          agentId: agent.id,
          agentName: agent.name,
          timestamp: new Date().toISOString(),
        };
        
        collaboration.messages.push(agentMessage);
      }
    }

    if (collaboration.messages.length >= 6) {
      const finalResult = await generateFinalResult(collaboration);
      collaboration.finalResult = finalResult;
      collaboration.status = 'completed';
    }

    collaboration.updatedAt = new Date().toISOString();
    await saveCollaboration(collaboration);
    
    revalidatePath(`/collaboration/${data.collaborationId}`);
    return { success: true, collaboration };
  } catch (error) {
    console.error('Error sending message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    };
  }
}

export async function getCollaborations(): Promise<Collaboration[]> {
  try {
    return await getAllCollaborations();
  } catch (error) {
    console.error('Error getting collaborations:', error);
    return [];
  }
}

export async function getCollaborationById(id: string): Promise<Collaboration | null> {
  try {
    return await getCollaboration(id);
  } catch (error) {
    console.error('Error getting collaboration:', error);
    return null;
  }
}

async function generateFinalResult(collaboration: Collaboration): Promise<string> {
  // Simple implementation - can be expanded later
  const agentMessages = collaboration.messages
    .filter(msg => msg.role === 'agent')
    .map(msg => `${msg.agentName}: ${msg.content}`)
    .join('\n\n');
  
  return `Summary of the collaboration:\n\n${agentMessages}\n\n--- End of Collaboration ---`;
}
