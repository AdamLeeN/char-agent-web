// 长期记忆存储
const longTermMemory: Record<string, { content: string; importance: number; timestamp: number }[]> = {};

// 获取长期记忆
export function getLongTermMemory(agentId: string): { content: string; importance: number; timestamp: number }[] {
  if (!longTermMemory[agentId]) {
    longTermMemory[agentId] = [];
  }
  return longTermMemory[agentId];
}

// 添加到长期记忆（带重要性评分）
export function addToLongTermMemory(agentId: string, content: string, importance: number) {
  if (!longTermMemory[agentId]) {
    longTermMemory[agentId] = [];
  }
  longTermMemory[agentId].push({
    content,
    importance,
    timestamp: Date.now()
  });
  
  // 最多保留20条长期记忆
  if (longTermMemory[agentId].length > 20) {
    // 按重要性排序，保留最重要的
    longTermMemory[agentId].sort((a, b) => b.importance - a.importance);
    longTermMemory[agentId] = longTermMemory[agentId].slice(0, 20);
  }
  
  // 保存到 localStorage
  saveToLocalStorage(agentId);
}

// 从 localStorage 加载
export function loadFromLocalStorage(agentId: string) {
  try {
    const stored = localStorage.getItem(`memory_${agentId}`);
    if (stored) {
      longTermMemory[agentId] = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load memory:', e);
  }
}

// 保存到 localStorage
function saveToLocalStorage(agentId: string) {
  try {
    localStorage.setItem(`memory_${agentId}`, JSON.stringify(longTermMemory[agentId]));
  } catch (e) {
    console.error('Failed to save memory:', e);
  }
}

// 清除记忆
export function clearLongTermMemory(agentId: string) {
  longTermMemory[agentId] = [];
  localStorage.removeItem(`memory_${agentId}`);
}

// 获取所有记忆（用于显示）
export function getAllMemory(agentId: string) {
  return getLongTermMemory(agentId);
}

// 获取用于对话上下文的记忆（高重要性的）
export function getRelevantMemory(agentId: string): string {
  const memories = getLongTermMemory(agentId);
  // 只返回重要性 >= 7 的记忆
  const relevant = memories.filter(m => m.importance >= 7);
  if (relevant.length === 0) return '';
  
  return `重要记忆:\n${relevant.map(m => `- ${m.content}`).join('\n')}`;
}

// 评估内容重要性 (0-10)
export function evaluateImportance(content: string): number {
  const importantKeywords = ['名字', '生日', '爱好', '职业', '梦想', '恐惧', '秘密', '重要', '记住'];
  const unimportantKeywords = ['好的', '明白', '谢谢', '是的', '嗯', '啊', '随便'];
  
  let score = 5; // 默认中等
  
  for (const kw of importantKeywords) {
    if (content.includes(kw)) score += 2;
  }
  for (const kw of unimportantKeywords) {
    if (content.includes(kw)) score -= 1;
  }
  
  return Math.max(0, Math.min(10, score));
}
