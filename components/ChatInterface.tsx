import React, { useState, useRef, useEffect } from 'react';
import { Send, ShoppingBag, ExternalLink, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onVisualize: (prompt: string) => void;
  loading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, onVisualize, loading }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleVisualizeClick = () => {
    if (!input.trim() || loading) return;
    onVisualize(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-bold">مشاور هوشمند بینایی</h3>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10">
            <p>سوالی بپرسید یا تغییری در عینک درخواست کنید.</p>
            <p className="text-sm mt-2">مثال: "لینک خرید عینک‌های گرد مشکی را پیدا کن"</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-none'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.text}
            </div>
            
            {/* Shopping Links */}
            {msg.links && msg.links.length > 0 && (
              <div className="mt-2 space-y-1 w-full max-w-[85%]">
                {msg.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-white border border-indigo-100 hover:border-indigo-300 p-2 rounded-lg shadow-sm transition-all flex items-center justify-between text-xs text-indigo-600 hover:bg-indigo-50"
                  >
                    <span className="truncate max-w-[200px] font-medium">{link.title}</span>
                    <ExternalLink size={14} />
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
            <div className="flex items-start">
                <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                    <div className="flex gap-1">
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                </div>
            </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="پیام خود را بنویسید..."
            className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none text-right"
            dir="rtl"
          />
          
          {/* Action Buttons */}
          <div className="flex gap-1">
            <button
                type="button"
                onClick={handleVisualizeClick}
                disabled={loading || !input.trim()}
                title="تولید طرح جدید"
                className="p-3 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors disabled:opacity-50"
            >
                <Sparkles size={20} />
            </button>
            
            <button
                type="submit"
                disabled={loading || !input.trim()}
                title="ارسال پیام"
                className="p-3 bg-primary text-white rounded-xl hover:bg-secondary transition-colors disabled:opacity-50 shadow-md shadow-primary/30"
            >
                <Send size={20} className={loading ? 'opacity-0' : 'rtl:-scale-x-100'} />
            </button>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 mt-2 text-center flex justify-between px-2">
             <span>دکمه بنفش: اعمال تغییرات روی عکس</span>
             <span>دکمه آبی: چت متنی و دریافت لینک</span>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;