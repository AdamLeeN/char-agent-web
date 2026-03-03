import { getApiBase, getModelPath, API_KEY } from './config';
import { getMemoryContext, addMemory } from './memory';
import { ROLE_CONFIG } from './roles';

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(
  messages: Message[], 
  model: string = '0.6B',
  roleId: string = '程序员'
): Promise<string> {
  const apiBase = getApiBase(model);
  const modelPath = getModelPath(model);
  
  // 获取角色配置
  const config = ROLE_CONFIG[roleId] || ROLE_CONFIG['程序员'];
  
  // 获取记忆
  const memoryContext = getMemoryContext(roleId);
  
  const systemPrompt = `你是${roleId}。
背景: ${config.background}
性格: ${config.personality}

${memoryContext}

请用角色的语气和风格回答用户的问题。`;

  const body = {
    model: modelPath,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content }))
    ],
    max_tokens: 200,
    temperature: 0.7
  };
  
  try {
    const res = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || '无响应';
    
    // 添加到记忆
    const lastUserMsg = messages.findLast(m => m.role === 'user');
    if (lastUserMsg) {
      addMemory(roleId, 'user', lastUserMsg.content);
      addMemory(roleId, 'assistant', reply);
    }
    
    return reply;
  } catch (e) {
    console.error(e);
    return '请求失败: ' + String(e);
  }
}
