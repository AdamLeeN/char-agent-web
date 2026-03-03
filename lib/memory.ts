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
  
  // 保存到 localStorage
  saveToLocalStorage(agentId);
}

export function clearMemory(agentId: string) {
  memoryStore[agentId] = [];
  localStorage.removeItem(`memory_${agentId}`);
}

export function getMemoryContext(agentId: string): string {
  const memories = getMemory(agentId);
  if (memories.length === 0) return '';
  
  return `相关记忆:\n${memories.map(m => `- ${m.content}`).join('\n')}`;
}

// 保存到 localStorage
function saveToLocalStorage(agentId: string) {
  try {
    localStorage.setItem(`memory_${agentId}`, JSON.stringify(memoryStore[agentId]));
  } catch (e) {
    console.error('Failed to save memory:', e);
  }
}

// 从 localStorage 加载
export function loadFromLocalStorage(agentId: string) {
  try {
    const stored = localStorage.getItem(`memory_${agentId}`);
    if (stored) {
      memoryStore[agentId] = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load memory:', e);
  }
}

// 获取所有记忆（用于显示）
export function getAllMemory(agentId: string) {
  return getMemory(agentId);
}
