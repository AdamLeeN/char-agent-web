// API 配置
// Cloudflare Tunnel 地址 (FastAPI 后端)
export const API_HOST = 'https://controls-knife-larry-technologies.trycloudflare.com';

export function getApiBase(model: string): string {
  return API_HOST;
}

export function getModelPath(model: string): string {
  if (model === '0.6B') return '/home/ubuntu/char_dataset/model/Qwen/Qwen3-0.6B';
  if (model === '1.7B') return '/home/ubuntu/char_dataset/model/Qwen/Qwen3-1.7B';
  return '/home/ubuntu/char_dataset/model/Qwen/Qwen3-4B';
}

export const API_KEY = 'any-value';
