import { getApiBase, getModelPath, API_KEY } from './config';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export async function chat(messages: Message[], model: string = '0.6B'): Promise<string> {
  const apiBase = getApiBase(model);
  const modelPath = getModelPath(model);
  
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');
  
  const body: any = {
    model: modelPath,
    messages: chatMessages,
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
    return data.choices?.[0]?.message?.content || '无响应';
  } catch (e) {
    console.error(e);
    return '请求失败';
  }
}
