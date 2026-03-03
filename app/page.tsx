'use client';

import { useState, useEffect } from 'react';
import { chat, Message } from '../lib/agents';
import { ROLES } from '../lib/roles';
import { loadFromLocalStorage, getAllMemory, clearMemory, addMemory } from '../lib/memory';

export default function Home() {
  const [model, setModel] = useState('0.6B');
  const [role, setRole] = useState('程序员');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  
  // 加载记忆
  useEffect(() => {
    loadFromLocalStorage(role);
  }, []);
  
  // 切换角色时新建session
  const handleRoleChange = (newRole: string) => {
    if (newRole !== role) {
      // 保存当前对话到 localStorage
      saveSession(role, messages);
      // 清除新角色的记忆并加载
      loadFromLocalStorage(newRole);
      // 清空当前对话
      setMessages([]);
      setRole(newRole);
    }
  };
  
  // 保存对话到 localStorage
  const saveSession = (roleId: string, msgs: Message[]) => {
    try {
      localStorage.setItem(`session_${roleId}`, JSON.stringify(msgs));
    } catch (e) {
      console.error('Failed to save session:', e);
    }
  };
  
  // 加载对话
  const loadSession = (roleId: string) => {
    try {
      const stored = localStorage.getItem(`session_${roleId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load session:', e);
    }
    return [];
  };
  
  // 清除对话
  const clearSession = () => {
    setMessages([]);
    clearMemory(role);
    localStorage.removeItem(`session_${role}`);
    localStorage.removeItem(`memory_${role}`);
  };

  const send = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    
    try {
      const reply = await chat([...messages, userMsg], model, role);
      const assistantMsg: Message = { id: (Date.now()+1).toString(), role: 'assistant', content: reply };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
    }
    
    setLoading(false);
  };

  const models = [
    { value: '0.6B', label: '⚡ 0.6B' },
    { value: '1.7B', label: '💪 1.7B' },
    { value: '4B', label: '🧠 4B' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <header style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#333' }}>🎭 角色对话系统</h1>
          <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>基于 Qwen3 • 5种角色 • 记忆模块 • Session存储</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '20px' }}>
          {/* 左侧：模型和角色 */}
          <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>🤖 选择模型</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {models.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setModel(m.value)}
                      style={{
                        padding: '8px 14px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: model === m.value ? '#667eea' : '#eee',
                        color: model === m.value ? 'white' : '#333',
                        fontSize: '14px'
                      }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>👤 选择角色</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleRoleChange(r.id)}
                      style={{
                        padding: '8px 14px',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: role === r.id ? '#667eea' : '#eee',
                        color: role === r.id ? 'white' : '#333',
                        fontSize: '14px'
                      }}
                    >
                      {r.icon} {r.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* 右侧：操作按钮 */}
          <div style={{ background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => setShowMemory(!showMemory)}
              style={{ padding: '10px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              {showMemory ? '📖 隐藏记忆' : '📖 查看记忆'}
            </button>
            <button
              onClick={clearSession}
              style={{ padding: '10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              🗑️ 清除对话
            </button>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', minHeight: '500px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ height: '420px', overflowY: 'auto', marginBottom: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '8px' }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', marginTop: '150px' }}>
                <p>选择角色和模型，开始对话吧</p>
                <p style={{ fontSize: '12px' }}>当前角色: {role} | 模型: {model}</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} style={{ 
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    display: 'inline-block',
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: msg.role === 'user' ? '#667eea' : '#eee',
                    color: msg.role === 'user' ? 'white' : '#333',
                    textAlign: 'left'
                  }}>
                    <strong style={{ fontSize: '12px' }}>{msg.role === 'user' ? '你' : role}</strong>
                    <p style={{ margin: '5px 0 0', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {loading && <p style={{ color: '#999' }}>⏳ 思考中...</p>}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={`以 ${role} 的身份提问...`}
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
            />
            <button
              onClick={send}
              disabled={loading}
              style={{ padding: '12px 24px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
            >
              发送
            </button>
          </div>
        </div>
        
        {/* 记忆模块显示 */}
        {showMemory && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginTop: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>📖 当前记忆 ({role})</h3>
            {getAllMemory(role).length === 0 ? (
              <p style={{ color: '#999' }}>暂无记忆</p>
            ) : (
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {getAllMemory(role).map((m, i) => (
                  <div key={i} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    <strong>{m.role}:</strong> {m.content}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
