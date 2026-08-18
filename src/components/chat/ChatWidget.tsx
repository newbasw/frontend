'use client';

import { useEffect, useRef, useState } from 'react';
import { clientApi, ApiRequestError } from '@/lib/api';
import { useAuth } from '../auth/AuthProvider';
import { BasWorldMark } from '../ui/BasWorldMark';
import { Close, Spinner } from '../icons';
import { ChatLauncher } from './ChatLauncher';

/**
 * Buyer chat.
 *
 * Replaces the email-only enquiry flow: a buyer writes, the admin sees it in
 * the dashboard and replies, and the reply appears here. Guests can use it
 * without registering — the server issues them a token cookie so the thread
 * survives a reload.
 *
 * Polls while open. A socket would be tidier, but polling every few seconds is
 * honest about what this is and needs no extra infrastructure.
 */

interface Message {
  id: string;
  sender: 'buyer' | 'admin' | 'system';
  body: string;
  created_at: string;
}

interface Props {
  vehicleId?: string | null;
  vehicleTitle?: string | null;
  vehicleReference?: string | null;
  /** Render inline rather than as a floating bubble. */
  inline?: boolean;
}

export function ChatWidget({ vehicleId = null, vehicleTitle, vehicleReference, inline = false }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(inline);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [starting, setStarting] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // WhatsApp is optional configuration; hide the button when it is absent.
  useEffect(() => {
    const params = new URLSearchParams();
    if (vehicleTitle) params.set('title', vehicleTitle);
    if (vehicleReference) params.set('reference', vehicleReference);
    clientApi<{ url: string }>(`/api/chat/whatsapp/link?${params}`)
      .then((res) => setWhatsapp(res.url))
      .catch(() => setWhatsapp(null));
  }, [vehicleTitle, vehicleReference]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  // Poll for replies while the panel is open.
  useEffect(() => {
    if (!open || !conversationId) return;
    const timer = setInterval(() => {
      clientApi<{ messages: Message[] }>(`/api/chat/${conversationId}`)
        .then((res) => setMessages(res.messages))
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [open, conversationId]);

  async function start() {
    setStarting(true);
    setError(null);
    try {
      const res = await clientApi<{ conversation: { id: string }; messages: Message[] }>(
        '/api/chat/open',
        {
          method: 'POST',
          body: JSON.stringify({
            vehicleId,
            name: name || user?.first_name || undefined,
            email: email || user?.email || undefined,
            subject: vehicleTitle ?? undefined,
          }),
        },
      );
      setConversationId(res.conversation.id);
      setMessages(res.messages);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not start the chat.');
    } finally {
      setStarting(false);
    }
  }

  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !conversationId) return;

    setSending(true);
    setError(null);
    // Show it immediately; the poll reconciles.
    const optimistic: Message = {
      id: `local-${Date.now()}`,
      sender: 'buyer',
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');

    try {
      await clientApi(`/api/chat/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(body);
      setError(err instanceof ApiRequestError ? err.message : 'Message not sent.');
    } finally {
      setSending(false);
    }
  }

  const needsDetails = !user && !conversationId;

  const panel = (
    <div
      data-testid="chat-panel"
      className={
        inline
          ? 'flex h-[420px] flex-col rounded-minimal border border-grey-300 bg-white'
          : 'flex h-[460px] w-[340px] flex-col overflow-hidden rounded-minimal border border-grey-300 bg-white shadow-menu'
      }
    >
      <header className="flex shrink-0 items-center justify-between gap-2 bg-ink px-4 py-3 text-white">
        <span className="flex items-center gap-2 text-md font-semibold">
          <BasWorldMark size={16} />
          Any questions?
        </span>
        {!inline && (
          <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="p-1">
            <Close size={16} />
          </button>
        )}
      </header>

      {vehicleTitle && (
        <p className="shrink-0 truncate border-b border-grey-300 px-4 py-2 text-xs text-grey-800">
          About: {vehicleTitle}
        </p>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {!conversationId && (
          <p className="text-base text-grey-800">
            Send us a message and a BAS World advisor will reply here. No email needed.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'buyer' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-minimal px-3 py-2 text-base ${
                m.sender === 'buyer' ? 'bg-ink text-white' : 'bg-grey-100 text-ink'
              }`}
            >
              {m.sender === 'admin' && (
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                  <BasWorldMark size={11} /> BAS World
                </p>
              )}
              {m.body}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-grey-300 p-3">
        {needsDetails ? (
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="bw-input"
              aria-label="Your name"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              type="email"
              className="bw-input"
              aria-label="Email"
            />
            <button
              type="button"
              onClick={start}
              disabled={starting}
              data-testid="chat-start"
              className="bw-btn-black w-full"
            >
              {starting ? <Spinner size={16} /> : 'Start chat'}
            </button>
          </div>
        ) : !conversationId ? (
          <button
            type="button"
            onClick={start}
            disabled={starting}
            data-testid="chat-start"
            className="bw-btn-black w-full"
          >
            {starting ? <Spinner size={16} /> : 'Start chat'}
          </button>
        ) : (
          <form onSubmit={send} className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message…"
              aria-label="Message"
              data-testid="chat-input"
              className="bw-input flex-1"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              data-testid="chat-send"
              className="bw-btn-black shrink-0 px-4"
            >
              {sending ? <Spinner size={14} /> : 'Send'}
            </button>
          </form>
        )}

        {error && <p className="bw-field-error">{error}</p>}

        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            data-testid="chat-whatsapp"
            className="mt-2 flex items-center justify-center gap-2 rounded-minimal border border-[#25D366] py-2 text-base font-semibold text-[#128C7E] hover:bg-[#25D366]/10"
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.86 9.86 0 0 0 4.79 1.22c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.43 12.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49 2.98 1.29 2.98.86 3.52.81.54-.05 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z" />
            </svg>
            Continue on WhatsApp
          </a>
        )}
      </div>
    </div>
  );

  if (inline) return panel;

  /*
   * Floating mode.
   *
   * The launcher carries its own position because the reader can drag it. The
   * open panel is anchored to the same corner it was opened from, so the
   * conversation appears where they were already looking rather than jumping
   * back to a fixed corner.
   */
  if (!open) return <ChatLauncher onOpen={() => setOpen(true)} />;

  return (
    <div className="fixed bottom-5 right-5 z-[70] max-w-[calc(100vw-2rem)]">
      {panel}
    </div>
  );
}
