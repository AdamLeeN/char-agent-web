import { getApiBase, getModelPath, API_KEY } from './config';
import { addToLongTermMemory, getRelevantMemory, evaluateImportance } from './memory';
import { ROLE_CONFIG } from './roles';

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 去除思考标签内容
function removeThinkingContent(text: string): string {
  // 去除各种思考标签
  let result = text;
  result = result.replace(/<think>/gi, '');
  result = result.replace(/<\/think>/gi, '');
  result = result.replace(/<\|thought\|>/gi, '');
  result = result.replace(/<\|/gi, '');
  return result.trim();
}

export async function chat(
  messages: Message[], 
  model: string = '0.6B',
  roleId: string = '程序员'
): Promise<string> {
  const apiBase = getApiBase(model);
  const modelPath = getModelPath(model);
  
  const config = ROLE_CONFIG[roleId] || ROLE_CONFIG['程序员'];
  
  // 获取相关记忆
  const memoryContext = getRelevantMemory(roleId);
  
  const systemPrompt = `你是${roleId}。
背景: ${config.background}
性格: ${config.personality}

${memoryContext ? memoryContext + '\n' : ''}请用角色的语气和风格回答用户的问题。

重要：不要输出思考过程，直接给出回答。`;

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
    
    // 去除思考内容
    reply = removeThinkingContent(reply);
    
    // 获取用户最后的消息
    const lastUserMsg = messages.findLast(m => m.role === 'user');
    if (lastUserMsg) {
      // 评估重要性并保存到长期记忆
      const importance = evaluateImportance(lastUserMsg.content);
      if (importance >= 6) {
        addToLongTermMemory(roleId, `用户说: ${lastUserMsg.content}`, importance);
      }
    }
    
    return reply;
  } catch (e) {
    console.error(e);
    return '请求失败: ' + String(e);
  }
}

// 总结对话并保存重要内容
export async function summarizeAndSave(
  messages: Message[], 
  model: string = '0.6B',
  roleId: string = '程序员'
): Promise<void> {
  if (messages.length < 2) return;
  
  const apiBase = getApiBase(model);
  const modelPath = getModelPath(model);
  
  const prompt = `请总结以下对话，提取重要的信息点（如用户的名字、爱好、重要事件等）。每个信息点用一句话描述。

对话：
${messages.map(m => `${m.role === 'user' ? '用户' : roleId}: ${m.content}`).join('\n')}

请直接输出总结，不需要额外说明。`;

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
        max_tokens: 200,
        temperature: 0.5
      })
    });
    
    const data = await res.json();
    let summary = data.choices?.[0]?.message?.content || '';
    
    // 去除思考内容
    summary = removeThinkingContent(summary);
    
    if (summary) {
      addToLongTermMemory(roleId, summary, 8); // 高重要性
    }
  } catch (e) {
    console.error('Summary failed:', e);
  }
}
