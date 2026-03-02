export interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chat(messages: Message[], model: string = '0.6B'): Promise<string> {
  const apiBase = getApiBase(model);
  const modelPath = getModelPath(model);
  
  const body = {
    model: modelPath,
    messages: messages.map(m => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content })),
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
