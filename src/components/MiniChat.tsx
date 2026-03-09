'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  name: string;
  text: string;
  ts: number;
}

const COLORS = [
  'text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-purple-400',
  'text-pink-400', 'text-cyan-400', 'text-rose-400', 'text-teal-400',
];

function nameColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

export function MiniChat() {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  const [name, setName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('ts', { ascending: true })
      .limit(100);
    if (data) {
      setMessages((prev) => {
        if (!openRef.current && data.length > prev.length) {
          setUnread((u) => u + (data.length - prev.length));
        }
        return data as Message[];
      });
    }
  }, []);

  // Initial fetch + polling fallback
  useEffect(() => {
    fetchMessages();
    const iv = setInterval(fetchMessages, 3000);
    return () => clearInterval(iv);
  }, [fetchMessages]);

  // Realtime subscription (bonus: instant updates if enabled)
  useEffect(() => {
    const channel = supabase
      .channel('chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => { fetchMessages(); },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  // Auto-scroll
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(0);
    }
  }, [open, messages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || !name) return;
    setText('');
    await supabase.from('messages').insert({
      name: name.slice(0, 20),
      text: trimmed.slice(0, 500),
    });
    await fetchMessages();
  };

  const handleNameSubmit = () => {
    if (name.trim()) {
      setName(name.trim());
      setNameSet(true);
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-20 right-5 w-11 h-11 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg transition-colors z-50"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-36 right-5 w-80 h-96 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-200">{t('chatTitle')}</span>
            <span className="text-[10px] text-zinc-500">{messages.length} {t('chatMessages')}</span>
          </div>

          {!nameSet ? (
            /* Name input */
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
              <span className="text-sm text-zinc-400">{t('chatEnterName')}</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                maxLength={20}
                placeholder="anon"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 text-center"
                autoFocus
              />
              <button
                onClick={handleNameSubmit}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
              >
                {t('chatJoin')}
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin">
                {messages.length === 0 && (
                  <div className="text-center text-xs text-zinc-600 mt-10">{t('chatEmpty')}</div>
                )}
                {messages.map((m) => (
                  <div key={m.id} className="text-xs leading-relaxed">
                    <span className={`font-semibold ${nameColor(m.name)}`}>{m.name}</span>
                    <span className="text-zinc-500 mx-1">&middot;</span>
                    <span className="text-zinc-300 break-words">{m.text}</span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2 border-t border-zinc-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    maxLength={500}
                    placeholder={t('chatPlaceholder')}
                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
                    autoFocus
                  />
                  <button
                    onClick={send}
                    disabled={!text.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-xs rounded-lg transition-colors"
                  >
                    {t('chatSend')}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
