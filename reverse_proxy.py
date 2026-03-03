#!/usr/bin/env python3
"""
反向代理服务器 - 支持CORS，带URL路径区分模型
"""

import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORTS = {
    'qwen3_06b': 8001,
    'qwen3_17b': 8000,
    'qwen3_4b': 8003,
}

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

class ProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
    
    def do_POST(self):
        path_parts = self.path.strip('/').split('/')
        model_key = path_parts[0] if path_parts and path_parts[0] in PORTS else 'qwen3_06b'
        remaining_path = '/' + '/'.join(path_parts[1:]) if len(path_parts) > 1 else '/v1/chat/completions'
        
        port = PORTS.get(model_key, PORTS['qwen3_06b'])
        
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else b''
        
        conn = http.client.HTTPConnection('127.0.0.1', port)
        
        # 转发请求
        conn.request('POST', remaining_path, body, self.headers)
        response = conn.getresponse()
        
        self.send_response(response.status)
        for header, value in response.getheaders():
            if header.lower() not in ('transfer-encoding',):
                self.send_header(header, value)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(response.read())
        conn.close()
    
    def do_GET(self):
        path_parts = self.path.strip('/').split('/')
        model_key = path_parts[0] if path_parts and path_parts[0] in PORTS else 'qwen3_06b'
        remaining_path = '/' + '/'.join(path_parts[1:]) if model_key in path_parts else self.path
        
        port = PORTS.get(model_key, PORTS['qwen3_06b'])
        
        conn = http.client.HTTPConnection('127.0.0.1', port)
        conn.request('GET', remaining_path, headers=self.headers)
        response = conn.getresponse()
        
        self.send_response(response.status)
        for header, value in response.getheaders():
            if header.lower() not in ('transfer-encoding',):
                self.send_header(header, value)
        for k, v in CORS_HEADERS.items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(response.read())
        conn.close()
    
    def log_message(self, format, *args):
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == '__main__':
    PORT = 8080
    server = ThreadingHTTPServer(('0.0.0.0', PORT), ProxyHandler)
    print(f"🚀 反向代理启动在端口 {PORT} (已支持CORS)")
    print(f"📡 模型: /qwen3_06b/* -> 8001, /qwen3_17b/* -> 8000, /qwen3_4b/* -> 8003")
    server.serve_forever()
