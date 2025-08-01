'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createAgentFromPrompt } from '@/lib/aiService';
import { saveAgent, getAllAgents, getAgent, deleteAgent } from '@/lib/fileSystem';
import { Agent, CreateAgentRequest } from '@/types';

export async function createAgent(formData: FormData) {
  try {
    const prompt = formData.get('prompt') as string;
    
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const agent = await createAgentFromPrompt(prompt);
    await saveAgent(agent);
    
    revalidatePath('/agents');
    return { success: true, agent };
  } catch (error) {
    console.error('Error creating agent:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create agent' 
    };
  }
}

export async function createAgentFromJSON(data: CreateAgentRequest) {
  try {
    const agent = await createAgentFromPrompt(data.prompt);
    await saveAgent(agent);
    
    revalidatePath('/agents');
    return { success: true, agent };
  } catch (error) {
    console.error('Error creating agent:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create agent' 
    };
  }
}

export async function getAgents(): Promise<Agent[]> {
  try {
    return await getAllAgents();
  } catch (error) {
    console.error('Error getting agents:', error);
    return [];
  }
}

export async function getAgentById(id: string): Promise<Agent | null> {
  try {
    return await getAgent(id);
  } catch (error) {
    console.error('Error getting agent:', error);
    return null;
  }
}

export async function removeAgent(formData: FormData) {
  try {
    const id = formData.get('id') as string;
    
    if (!id) {
      throw new Error('Agent ID is required');
    }

    await deleteAgent(id);
    
    revalidatePath('/agents');
    return { success: true };
  } catch (error) {
    console.error('Error deleting agent:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete agent' 
    };
  }
}

export async function removeAgentById(id: string) {
  try {
    await deleteAgent(id);
    
    revalidatePath('/agents');
    return { success: true };
  } catch (error) {
    console.error('Error deleting agent:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete agent' 
    };
  }
}
