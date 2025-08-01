import { promises as fs } from 'fs';
import { join } from 'path';
import { Agent, Collaboration } from '@/types';

const DATA_DIR = join(process.cwd(), 'data');
const AGENTS_DIR = join(DATA_DIR, 'agents');
const COLLABORATIONS_DIR = join(DATA_DIR, 'collaborations');

export async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(AGENTS_DIR, { recursive: true });
    await fs.mkdir(COLLABORATIONS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Agent operations
export async function saveAgent(agent: Agent): Promise<void> {
  await ensureDirectories();
  const filePath = join(AGENTS_DIR, `${agent.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(agent, null, 2));
}

export async function getAgent(id: string): Promise<Agent | null> {
  try {
    const filePath = join(AGENTS_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function getAllAgents(): Promise<Agent[]> {
  try {
    await ensureDirectories();
    const files = await fs.readdir(AGENTS_DIR);
    const agents: Agent[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(join(AGENTS_DIR, file), 'utf-8');
        agents.push(JSON.parse(data));
      }
    }
    
    return agents.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    return [];
  }
}

export async function deleteAgent(id: string): Promise<void> {
  try {
    const filePath = join(AGENTS_DIR, `${id}.json`);
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting agent:', error);
  }
}

// Collaboration operations
export async function saveCollaboration(collaboration: Collaboration): Promise<void> {
  await ensureDirectories();
  const filePath = join(COLLABORATIONS_DIR, `${collaboration.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(collaboration, null, 2));
}

export async function getCollaboration(id: string): Promise<Collaboration | null> {
  try {
    const filePath = join(COLLABORATIONS_DIR, `${id}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function getAllCollaborations(): Promise<Collaboration[]> {
  try {
    await ensureDirectories();
    const files = await fs.readdir(COLLABORATIONS_DIR);
    const collaborations: Collaboration[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await fs.readFile(join(COLLABORATIONS_DIR, file), 'utf-8');
        collaborations.push(JSON.parse(data));
      }
    }
    
    return collaborations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    return [];
  }
}