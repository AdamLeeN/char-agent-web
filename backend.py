#!/usr/bin/env python3
"""
FastAPI 后端 - 统一处理 CORS 和模型路由
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import uvicorn
import os

app = FastAPI(title="Qwen3 API Proxy")

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 模型端口映射
MODEL_PORTS = {
    "0.6B": 8001,
    "1.7B": 8000,
    "4B": 8003,
}

MODEL_PATHS = {
    "0.6B": "/home/ubuntu/char_dataset/model/Qwen/Qwen3-0.6B",
    "1.7B": "/home/ubuntu/char_dataset/model/Qwen/Qwen3-1.7B",
    "4B": "/home/ubuntu/char_dataset/model/Qwen/Qwen3-4B",
}

API_KEY = "any-value"

class ChatRequest(BaseModel):
    model: str
    messages: List[dict]
    max_tokens: Optional[int] = 200
    temperature: Optional[float] = 0.7

@app.post("/v1/chat/completions")
async def chat_completions(req: ChatRequest, request: Request):
    # 解析模型名称
    model_name = req.model
    if "0.6B" in model_name:
        port = MODEL_PORTS["0.6B"]
        model_path = MODEL_PATHS["0.6B"]
    elif "1.7B" in model_name:
        port = MODEL_PORTS["1.7B"]
        model_path = MODEL_PATHS["1.7B"]
    elif "4B" in model_name:
        port = MODEL_PORTS["4B"]
        model_path = MODEL_PATHS["4B"]
    else:
        # 默认使用 0.6B
        port = MODEL_PORTS["0.6B"]
        model_path = MODEL_PATHS["0.6B"]
    
    # 转发请求到 vllm
    url = f"http://127.0.0.1:{port}/v1/chat/completions"
    
    body = {
        "model": model_path,
        "messages": req.messages,
        "max_tokens": req.max_tokens,
        "temperature": req.temperature
    }
    
    headers = dict(request.headers)
    headers["Authorization"] = f"Bearer {API_KEY}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=body, headers=headers, timeout=120.0)
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/v1/models")
async def list_models(request: Request):
    # 返回所有可用模型
    models = []
    for name, path in MODEL_PATHS.items():
        models.append({
            "id": path,
            "object": "model",
            "owned_by": "vllm",
            "root": path
        })
    return {"object": "list", "data": models}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
