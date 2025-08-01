import OpenAI from 'openai';
import { Agent, Collaboration, Message } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { saveCollaboration } from '@/lib/fileSystem';
import { ChatCompletionMessageParam } from 'openai/resources/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function createAgentFromPrompt(prompt: string): Promise<Agent> {
  const systemPrompt = `You are an AI assistant that creates specialized AI agents. 
Given a description, you create an AI agent with the following properties:
- name: A short, descriptive name for the agent (max 50 characters)
- description: A comprehensive description of what the agent does (100-200 characters)  
- expertise: The specific area of expertise of the agent (50-100 characters)
- personality: The personality and communication style of the agent (100-150 characters)
- systemPrompt: A detailed system prompt that the agent will use (200-500 characters)

Respond only with valid JSON in the following format:
{
  "name": "Agent name",
  "description": "Comprehensive description",
  "expertise": "Area of expertise", 
  "personality": "Personality and style",
  "systemPrompt": "Detailed system prompt for the agent"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: 0.7,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to generate agent');
  }

  try {
    const agentData = JSON.parse(content);
    const now = new Date().toISOString();
    
    return {
      id: uuidv4(),
      name: agentData.name,
      description: agentData.description,
      expertise: agentData.expertise,
      personality: agentData.personality,
      systemPrompt: agentData.systemPrompt,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error('Failed to parse agent data:', error);
    console.error('Raw content:', content);
    throw new Error('Failed to parse agent data');
  }
}

export async function getAgentResponse(agent: Agent, message: string, context?: string): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: agent.systemPrompt },
  ];

  if (context) {
    messages.push({ 
      role: "system", 
      content: `Context from the current collaboration: ${context}` 
    });
  }

  messages.push({ role: "user", content: message });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || '';
}

export async function facilitateMultiAgentCollaboration(
  agents: Agent[], 
  userMessage: string, 
  previousMessages: string[] = []
): Promise<string[]> {
  // Step 1: Decompose the task and assign roles
  const taskBreakdown = await decomposeTaskAndAssignRoles(agents, userMessage);
  
  // Step 2: Execute collaboration with assigned roles
  const responses: string[] = [];
  
  // Context from previous messages
  const conversationContext = previousMessages.length > 0 
    ? `Previous messages in this collaboration:\n${previousMessages.join('\n\n')}`
    : '';

  // Phase 1: Initial responses with assigned roles
  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    const assignment = taskBreakdown.assignments[i];
    
    // Build context for this agent
    const otherAssignments = taskBreakdown.assignments
      .filter((_, idx) => idx !== i)
      .map((assign, idx) => `${agents.find(a => a.id === assign.agentId)?.name || `Agent ${idx + 1}`}: ${assign.task}`)
      .join('\n');
    
    const roleContext = `
Your role in this collaboration: ${assignment.role}
Your specific task: ${assignment.task}
Other agents and their tasks:
${otherAssignments}

Important: Focus only on your assigned task. Collaborate by clearly indicating how your contribution can be used by other agents.`;

    const fullContext = [conversationContext, roleContext].filter(Boolean).join('\n\n');
    
    const response = await getAgentResponse(agent, userMessage, fullContext);
    responses.push(response);
  }

  // Phase 2: Integration and refinement
  const integrationPrompt = `
Review the contributions from all agents below and provide an integrated response that:
1. Combines the best elements from each contribution
2. Removes any overlap
3. Forms a coherent and complete answer

Agent contributions:
${responses.map((response, i) => `${agents[i].name} (${taskBreakdown.assignments[i].role}): ${response}`).join('\n\n')}`;

  // Use the first agent for integration (or we could create a dedicated coordinator)
  const integratedResponse = await getAgentResponse(agents[0], integrationPrompt, conversationContext);
  
  // Return individual responses plus the integrated result
  return [...responses, integratedResponse];
}

// Enhanced streaming collaboration with true agent coordination
export async function streamingAgentCollaboration(
  agents: Agent[],
  userMessage: string,
  previousMessages: string[],
  collaboration: Collaboration,
  onUpdate: (update: CollaborationUpdate) => Promise<void>
): Promise<void> {
  const conversationContext = previousMessages.length > 0 
    ? `Previous messages in this collaboration:\n${previousMessages.join('\n\n')}`
    : '';

  // Find or designate coordinator agent
  let coordinator = agents.find(agent => 
    agent.name.toLowerCase().includes('coordinator') || 
    agent.expertise.toLowerCase().includes('coordination')
  );

  if (!coordinator) {
    coordinator = agents[0]; // Fallback to first agent
  }

  // Phase 1: Coordinator creates collaboration plan
  await onUpdate({
    type: 'phase',
    phase: 'planning',
    message: 'Agent Coordinator is planning the collaboration...',
    agentId: coordinator.id,
    agentName: coordinator.name
  });

  const planningPrompt = `
As Agent Coordinator, create a detailed collaboration plan for the following task:

Task: ${userMessage}

Available agents:
${agents.map((agent, i) => `${i + 1}. ${agent.name} - Expertise: ${agent.expertise}`).join('\n')}

Conversation context:
${conversationContext}

Create a plan that consists of:
1. An overview of the approach
2. Specific steps and which agent executes each step
3. How the agents should collaborate with each other
4. Expected final result

Present this as a clear plan that the other agents can follow.`;

  const plan = await getAgentResponse(coordinator, planningPrompt);
  
  const planMessage: Message = {
    id: uuidv4(),
    role: 'agent' as const,
    content: plan,
    agentId: coordinator.id,
    agentName: coordinator.name,
    timestamp: new Date().toISOString(),
    phase: 'planning'
  };

  collaboration.messages.push(planMessage);
  await saveCollaboration(collaboration);

  await onUpdate({
    type: 'message',
    message: planMessage
  });

  // Phase 2: Each agent executes their part
  await onUpdate({
    type: 'phase',
    phase: 'execution',
    message: 'Agents are executing their tasks...'
  });

  const executionResponses: Array<{agent: Agent, response: string}> = [];

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i];
    
    if (agent.id === coordinator.id) continue; // Skip coordinator for now

    await onUpdate({
      type: 'agent_working',
      agentId: agent.id,
      agentName: agent.name,
      message: `${agent.name} is working on their part...`
    });

    const executionContext = `
Collaboration plan from the Coordinator:
${plan}

Your role: Collaborate with the other agents according to the above plan. Focus on your expertise (${agent.expertise}).

Task: ${userMessage}

Conversation context:
${conversationContext}

Follow the plan and deliver your contribution that matches your expertise. Refer to the plan where relevant.`;

    const response = await getAgentResponse(agent, userMessage, executionContext);
    executionResponses.push({agent, response});

    const agentMessage: Message = {
      id: uuidv4(),
      role: 'agent' as const,
      content: response,
      agentId: agent.id,
      agentName: agent.name,
      timestamp: new Date().toISOString(),
      phase: 'execution'
    };

    collaboration.messages.push(agentMessage);
    await saveCollaboration(collaboration);

    await onUpdate({
      type: 'message',
      message: agentMessage
    });
  }

  // Phase 3: Coordinator reviews and integrates
  await onUpdate({
    type: 'phase',
    phase: 'integration',
    message: 'Agent Coordinator is integrating all contributions...',
    agentId: coordinator.id,
    agentName: coordinator.name
  });

  const integrationPrompt = `
As Agent Coordinator, review all agent contributions and integrate them into a coherent final result.

Original task: ${userMessage}

Your original plan:
${plan}

Agent contributions:
${executionResponses.map(({agent, response}) => 
  `${agent.name} (${agent.expertise}):\n${response}`
).join('\n\n---\n\n')}

Integrate these contributions into a cohesive, complete final result that:
1. Combines the best elements from each contribution
2. Has a clear structure
3. Fully answers the original task
4. Shows how the collaboration led to a better result

Also provide a brief evaluation of how the collaboration went.`;

  const finalResult = await getAgentResponse(coordinator, integrationPrompt, conversationContext);

  const finalMessage: Message = {
    id: uuidv4(),
    role: 'agent' as const,
    content: finalResult,
    agentId: coordinator.id,
    agentName: coordinator.name,
    timestamp: new Date().toISOString(),
    phase: 'integration'
  };

  collaboration.messages.push(finalMessage);
  collaboration.finalResult = finalResult;
  collaboration.updatedAt = new Date().toISOString();
  await saveCollaboration(collaboration);

  await onUpdate({
    type: 'message',
    message: finalMessage
  });

  await onUpdate({
    type: 'complete',
    message: 'Collaboration completed!'
  });
}

interface CollaborationUpdate {
  type: 'phase' | 'agent_working' | 'message' | 'complete';
  phase?: 'planning' | 'execution' | 'integration';
  message?: Message | string;
  agentId?: string;
  agentName?: string;
}

interface TaskAssignment {
  agentId: string;
  role: string;
  task: string;
}

interface TaskBreakdown {
  assignments: TaskAssignment[];
  strategy: string;
}

async function decomposeTaskAndAssignRoles(agents: Agent[], userMessage: string): Promise<TaskBreakdown> {
  const coordinatorPrompt = `You are a collaboration coordinator. Analyze the following task and assign specific roles and tasks to the available agents.

Task: ${userMessage}

Available agents:
${agents.map((agent, i) => `${i + 1}. ${agent.name} - Expertise: ${agent.expertise} - ${agent.description}`).join('\n')}

Provide a JSON response with the following structure:
{
  "strategy": "Brief description of the collaboration strategy",
  "assignments": [
    {
      "agentId": "agent-id",
      "role": "Specific role (e.g. 'Researcher', 'Writer', 'Reviewer')",
      "task": "Specific task this agent should perform"
    }
  ]
}

Focus on:
- Complementary roles that together produce a complete result
- Using each agent's expertise
- Avoiding task overlap
- Ensuring clear task distribution`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert in team coordination and task distribution. Return only valid JSON." },
      { role: "user", content: coordinatorPrompt }
    ],
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    // Fallback: assign generic roles
    return {
      strategy: "Basic task distribution",
      assignments: agents.map((agent, i) => ({
        agentId: agent.id,
        role: `Expert ${i + 1}`,
        task: `Provide your expert perspective from your ${agent.expertise} expertise`
      }))
    };
  }

  try {
    // Clean the content to remove markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const breakdown = JSON.parse(cleanContent);
    
    // Ensure we have assignments for all agents
    if (!breakdown.assignments || breakdown.assignments.length !== agents.length) {
      breakdown.assignments = agents.map((agent, i) => ({
        agentId: agent.id,
        role: breakdown.assignments?.[i]?.role || `Expert ${i + 1}`,
        task: breakdown.assignments?.[i]?.task || `Provide your expert perspective from your ${agent.expertise} expertise`
      }));
    }
    
    return breakdown;
  } catch (error) {
    console.error('Failed to parse task breakdown:', error, 'Content:', content);
    // Fallback
    return {
      strategy: "Basic task distribution",
      assignments: agents.map((agent, i) => ({
        agentId: agent.id,
        role: `Expert ${i + 1}`,
        task: `Provide your expert perspective from your ${agent.expertise} expertise`
      }))
    };
  }
}
