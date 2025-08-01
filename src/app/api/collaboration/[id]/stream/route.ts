import { NextRequest } from 'next/server';
import { getCollaboration, saveCollaboration, getAgent } from '@/lib/fileSystem';
import { streamingAgentCollaboration } from '@/lib/aiService';
import { v4 as uuidv4 } from 'uuid';
import { Message } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { message } = await request.json();

    if (!message) {
      return new Response('Message is required', { status: 400 });
    }

    const collaboration = await getCollaboration(id);
    if (!collaboration) {
      return new Response('Collaboration not found', { status: 404 });
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

    // Get agents
    const agents = await Promise.all(
      collaboration.selectedAgents.map(id => getAgent(id))
    );
    const validAgents = agents.filter(agent => agent !== null);

    if (validAgents.length === 0) {
      return new Response('No valid agents found', { status: 400 });
    }

    // Get previous messages for context
    const previousMessages = collaboration.messages
      .slice(-10)
      .map(msg => `${msg.role === 'user' ? 'Gebruiker' : msg.agentName || 'Agent'}: ${msg.content}`);

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamingAgentCollaboration(
            validAgents,
            message,
            previousMessages,
            collaboration,
            async (update) => {
              const data = JSON.stringify(update) + '\n';
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            }
          );
          
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}