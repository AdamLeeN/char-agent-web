// 简单的记忆模块
const memoryStore: Record<string, { role: string; content: string; timestamp: number }[]> = {};

export function getMemory(agentId: string): { role: string; content: string; timestamp: number }[] {
  if (!memoryStore[agentId]) {
    memoryStore[agentId] = [];
  }
  return memoryStore[agentId];
}

export function addMemory(agentId: string, role: string, content: string) {
  if (!memoryStore[agentId]) {
    memoryStore[agentId] = [];
  }
  memoryStore[agentId].push({ role, content, timestamp: Date.now() });
  
  // 只保留最近10条记忆
  if (memoryStore[agentId].length > 10) {
    memoryStore[agentId] = memoryStore[agentId].slice(-10);
  }
}

export function clearMemory(agentId: string) {
  memoryStore[agentId] = [];
}

export function getMemoryContext(agentId: string): string {
  const memories = getMemory(agentId);
  if (memories.length === 0) return '';
  
  return `相关记忆:\n${memories.map(m => `- ${m.content}`).join('\n')}`;
}
