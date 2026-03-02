// API 配置
export const MODEL_MAP: Record<string, string> = {
  '0.6B': 'qwen3_06b',
  '1.7B': 'qwen3_17b', 
  '4B': 'qwen3_4b'
};

export const API_HOST = 'https://amd-consecutive-zone-transcription.trycloudflare.com';

export function getApiBase(model: string): string {
  const key = MODEL_MAP[model] || 'qwen3_06b';
  return `${API_HOST}/${key}/v1`;
}

export function getModelPath(model: string): string {
  const key = MODEL_MAP[model] || 'qwen3_06b';
  if (key === 'qwen3_06b') return '/home/ubuntu/char_dataset/model/Qwen/Qwen3-0.6B';
  if (key === 'qwen3_17b') return '/home/ubuntu/char_dataset/model/Qwen/Qwen3-1.7B';
  return '/home/ubuntu/char_dataset/model/Qwen/Qwen3-4B';
}

export const API_KEY = 'any-value';
