'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { clientApi } from '@/lib/api';
import { Spinner } from '../icons';

/**
 * Admin inbox: threads on the left, the conversation on the right, reply box
 * underneath. Opening a thread marks the buyer's messages read, which is what
 * clears the badge on the dashboard.
 */

interface Conversation {
  id: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  last_message_at: string;
  unread_for_admin: number;
  vehicle: { slug: string; title: string; condition: string; reference: string } | null;
}

interface Message {
  id: string;
  sender: 'buyer' | 'admin' | 'system';
  body: string;
  created_at: string;
}

export function AdminChat() {
  const [threads, setThreads] = useState<Conversation[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadThreads = () =>
    clientApi<{ items: Conversation[] }>('/api/admin/conversations')
      .then((res) => {
        setThreads(res.items);
        setActiveId((current) => current ?? res.items[0]?.id ?? null);
      })
      .catch(() => setThreads([]));

  useEffect(() => {
    loadThreads();
    const timer = setInterval(loadThreads, 12_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const load = () =>
      clientApi<{ messages: Message[] }>(`/api/admin/conversations/${activeId}`)
        .then((res) => setMessages(res.messages))
        .catch(() => setMessages([]));
    load();
    const timer = setInterval(load, 6000);
    return () => clearInterval(timer);
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = reply.trim();
    if (!body || !activeId) return;

    setSending(true);
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, sender: 'admin', body, created_at: new Date().toISOString() },
    ]);
    setReply('');
    try {
      await clientApi(`/api/admin/conversations/${activeId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      loadThreads();
    } catch {
      setReply(body);
    } finally {
      setSending(false);
    }
  }

  if (threads === null) return <div className="h-96 animate-pulse rounded-minimal bg-grey-100" />;
  if (threads.length === 0) {
    return (
      <p className="rounded-minimal border border-dashed border-grey-400 p-8 text-center text-base text-grey-800">
        No conversations yet.
      </p>
    );
  }

  const active = threads.find((t) => t.id === activeId) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <ul
        data-testid="admin-threads"
        className="max-h-[560px] divide-y divide-grey-300 overflow-y-auto rounded-minimal border border-grey-300"
      >
        {threads.map((thread) => (
          <li key={thread.id}>
            <button
              type="button"
              onClick={() => setActiveId(thread.id)}
              className={`w-full px-4 py-3 text-left hover:bg-grey-100 ${
                thread.id === activeId ? 'bg-grey-100' : ''
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-md font-semibold">
                  {thread.guest_name || thread.guest_email || 'Buyer'}
                </span>
                {thread.unread_for_admin > 0 && (
                  <span className="shrink-0 rounded-full bg-sale px-2 py-0.5 text-xs text-white">
                    {thread.unread_for_admin}
                  </span>
                )}
              </span>
              <span className="mt-0.5 block truncate text-base text-grey-800">
                {thread.vehicle?.title ?? 'General enquiry'}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex h-[560px] flex-col rounded-minimal border border-grey-300">
        {active && (
          <header className="shrink-0 border-b border-grey-300 px-4 py-3">
            <p className="text-md font-semibold">
              {active.guest_name || active.guest_email || 'Buyer'}
            </p>
            <p className="text-base text-grey-800">
              {active.guest_email}
              {active.guest_phone ? ` · ${active.guest_phone}` : ''}
              {active.vehicle && (
                <>
                  {' · '}
                  <Link
                    href={`/vehicles/${active.vehicle.condition === 'new' ? 'new' : 'used'}/${active.vehicle.slug}`}
                    className="cds-link"
                  >
                    {active.vehicle.title} ({active.vehicle.reference})
                  </Link>
                </>
              )}
            </p>
          </header>
        )}

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-minimal px-3 py-2 text-base ${
                  m.sender === 'admin' ? 'bg-ink text-white' : 'bg-grey-100 text-ink'
                }`}
              >
                {m.body}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={send} className="flex shrink-0 gap-2 border-t border-grey-300 p-3">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply…"
            aria-label="Reply"
            data-testid="admin-reply-input"
            className="bw-input flex-1"
          />
          <button
            type="submit"
            disabled={sending || !reply.trim()}
            data-testid="admin-reply-send"
            className="bw-btn-black shrink-0 px-5"
          >
            {sending ? <Spinner size={14} /> : 'Reply'}
          </button>
        </form>
      </div>
    </div>
  );
}
