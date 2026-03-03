import { getApiBase, getModelPath, API_KEY } from './config';
import { addToLongTermMemory, getRelevantMemory } from './memory';
import { ROLE_CONFIG } from './roles';

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function removeThinkingContent(text: string): string {
  let result = text;
  result = result.replace(/<think>/gi, '');
  result = result.replace(/<\/think>/gi, '');
  return result.trim();
}

async function evaluateAndSummarize(
  messages: Message[], 
  roleId: string
): Promise<void> {
  if (messages.length < 2) return;
  
  const apiBase = getApiBase('4B');
  const modelPath = getModelPath('4B');
  
  const prompt = `分析以下对话，提取重要信息并打分。

格式：
信息|分数

对话：
${messages.map(m => `${m.role === 'user' ? '用户' : roleId}: ${m.content}`).join('\n')}`;

  try {
    const res = await fetch(`${apiBase}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: modelPath,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.3
      })
    });
    
    const data = await res.json();
    let result = data.choices?.[0]?.message?.content || '';
    result = removeThinkingContent(result);
    
    const lines = result.split('\n');
    for (const line of lines) {
      const match = line.match(/^(.+)\|(\d+)$/);
      if (match) {
        const content = match[1].trim();
        const importance = parseInt(match[2]);
        if (importance >= 7 && content) {
          addToLongTermMemory(roleId, content, importance);
        }
      }
    }
  } catch (e) {
    console.error('Evaluate failed:', e);
  }
}

export async function chat(
  messages: Message[], 
  model: string = '0.6B',
  roleId: string = '程序员'
): Promise<string> {
  const apiBase = getApiBase(model);
  const modelPath = getModelPath(model);
  
  const config = ROLE_CONFIG[roleId] || ROLE_CONFIG['程序员'];
  const memoryContext = getRelevantMemory(roleId);
  
  const systemPrompt = `你是${roleId}。
背景: ${config.background}
性格: ${config.personality}

${memoryContext ? memoryContext + '\n' : ''}请用角色语气回答。不要输出思考过程。`;

  const body = {
    model: modelPath,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))
    ],
    max_tokens: 300,
    temperature: 0.7
  };
  
  try {
    const res = await fetch(`${apiBase}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    let reply = data.choices?.[0]?.message?.content || '无响应';
    reply = removeThinkingContent(reply);
    
    const userMsg = messages.findLast(m => m.role === 'user');
    if (userMsg) {
      const allMsgs: Message[] = [...messages, { id: 'temp', role: 'user', content: userMsg.content }];
      evaluateAndSummarize(allMsgs, roleId);
    }
    
    return reply;
  } catch (e) {
    console.error(e);
    return '请求失败: ' + String(e);
  }
}
