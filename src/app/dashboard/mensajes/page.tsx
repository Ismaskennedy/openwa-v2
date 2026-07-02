"use client";

import { useEffect, useState, useCallback } from "react";

type Message = {
  id: string;
  phone: string;
  direction: "INBOUND" | "OUTBOUND";
  body: string | null;
  type: string;
  status: string;
  createdAt: string;
  contact?: { name: string | null; phone: string } | null;
};

export default function MensajesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadInbox = useCallback(async () => {
    const res = await fetch("/api/messages");
    const data = await res.json();
    setMessages(data.messages || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 8000); // refresco automático
    return () => clearInterval(interval);
  }, [loadInbox]);

  const loadConversation = useCallback(async (phone: string) => {
    const res = await fetch(`/api/messages?phone=${phone}`);
    const data = await res.json();
    setConversation(data.messages || []);
  }, []);

  useEffect(() => {
    if (selectedPhone) {
      loadConversation(selectedPhone);
      const interval = setInterval(() => loadConversation(selectedPhone), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedPhone, loadConversation]);

  // Agrupa por número, quedándose con el mensaje más reciente de cada uno
  const conversationsByPhone = Object.values(
    messages.reduce((acc: Record<string, Message>, m) => {
      if (!acc[m.phone] || new Date(m.createdAt) > new Date(acc[m.phone].createdAt)) {
        acc[m.phone] = m;
      }
      return acc;
    }, {})
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPhone || !reply.trim()) return;
    setSending(true);
    await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: selectedPhone, body: reply }),
    });
    setReply("");
    setSending(false);
    loadConversation(selectedPhone);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Mensajes</h1>
      <p className="mt-1 text-sm text-ink-500">
        Conversaciones recibidas vía webhook. Nota: solo puedes responder con texto libre dentro de las 24h desde el último mensaje del contacto.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        {/* Lista de conversaciones */}
        <div className="card max-h-[70vh] overflow-y-auto p-2">
          {loading && <p className="p-4 text-sm text-ink-400">Cargando...</p>}
          {!loading && conversationsByPhone.length === 0 && (
            <p className="p-4 text-sm text-ink-400">Sin conversaciones todavía.</p>
          )}
          {conversationsByPhone.map((m) => (
            <button
              key={m.phone}
              onClick={() => setSelectedPhone(m.phone)}
              className={`w-full rounded-xl px-3 py-2.5 text-left transition ${
                selectedPhone === m.phone ? "bg-brand-50" : "hover:bg-ink-50"
              }`}
            >
              <p className="text-sm font-semibold text-ink-800">{m.contact?.name || m.phone}</p>
              <p className="truncate text-xs text-ink-400">{m.body || `[${m.type}]`}</p>
            </button>
          ))}
        </div>

        {/* Conversación seleccionada */}
        <div className="card flex max-h-[70vh] flex-col p-4">
          {!selectedPhone ? (
            <p className="m-auto text-sm text-ink-400">Selecciona una conversación</p>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {conversation.map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      m.direction === "OUTBOUND"
                        ? "ml-auto bg-brand-600 text-white"
                        : "bg-ink-100 text-ink-800"
                    }`}
                  >
                    {m.body || `[${m.type}]`}
                    <p className={`mt-1 text-[10px] ${m.direction === "OUTBOUND" ? "text-brand-100" : "text-ink-400"}`}>
                      {new Date(m.createdAt).toLocaleString()} · {m.status.toLowerCase()}
                    </p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleReply} className="mt-3 flex gap-2 border-t border-ink-100 pt-3">
                <input
                  className="input"
                  placeholder="Escribe una respuesta..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
                <button type="submit" disabled={sending} className="btn-primary shrink-0">
                  Enviar
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
