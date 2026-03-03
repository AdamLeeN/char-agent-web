import { getApiBase, getModelPath, API_KEY } from './config';
import { addToLongTermMemory, getRelevantMemory } from './memory';
import { ROLE_CONFIG } from './roles';

export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// 去除思考标签内容
function removeThinkingContent(text: string): string {
  let result = text;
  result = result.replace(/<think>/gi, '');
  result = result.replace(/<\/think>/gi, '');
  result = result.replace(/<\|thought\|>/gi, '');
  result = result.replace(/<\|/gi, '');
  return result.trim();
}

// 评估重要性并总结（使用4B模型）
async function evaluateAndSummarize(
  messages: Message[], 
  roleId: string
): Promise<void> {
  if (messages.length < 2) return;
  
  const apiBase = getApiBase('4B'); // 使用4B模型
  const modelPath = getModelPath('4B');
  
  const prompt = `请分析以下对话，提取重要信息并判断重要性。

要求：
1. 提取重要信息点（用户的名字、爱好、职业、重要事件等）
2. 给每个信息点重要性打分（0-10分）
3. 只输出重要的信息（重要性>=7）

格式：
[信息1]|重要性分数
[信息2]|重要性分数
...

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
    
    // 解析结果并保存
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
  
  // 获取相关记忆
  const memoryContext = getRelevantMemory(roleId);
  
  const systemPrompt = `你是${roleId}。
背景: ${config.background}
性格: ${config.personality}

${memoryContext ? memoryContext + '\n' : ''}请用角色的语气和风格回答用户的问题。

重要：不要输出思考过程，直接给出简洁的回答。`;

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
    
    // 自动评估并保存重要信息（使用4B模型）
    const allMessages = [...messages, { role: 'user', content: messages.findLast(m => m.role === 'user')?.content || '' }];
    await evaluateAndSummarize(allMessages, roleId);
    
    return reply;
  } catch (e) {
    console.error(e);
    return '请求失败: ' + String(e);
  }
}

// 手动总结按钮（备用）
export async function summarizeAndSave(
  messages: Message[], 
  model: string = '0.6B',
  roleId: string = '程序员'
): Promise<void> {
  await evaluateAndSummarize(messages, roleId);
}
