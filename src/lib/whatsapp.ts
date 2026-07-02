/**
 * Cliente mínimo para la WhatsApp Cloud API oficial de Meta.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v20.0";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const TOKEN = process.env.WHATSAPP_TOKEN;

function baseUrl() {
  if (!PHONE_NUMBER_ID) {
    throw new Error("Falta WHATSAPP_PHONE_NUMBER_ID en las variables de entorno");
  }
  return `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
}

function authHeaders() {
  if (!TOKEN) {
    throw new Error("Falta WHATSAPP_TOKEN en las variables de entorno");
  }
  return {
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
  };
}

export type SendResult = {
  ok: boolean;
  waMessageId?: string;
  error?: string;
  raw?: any;
};

/** Envía un mensaje de texto libre. Solo funciona dentro de la ventana de 24h de conversación. */
export async function sendTextMessage(to: string, body: string): Promise<SendResult> {
  try {
    const res = await fetch(baseUrl(), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.error?.message || "Error desconocido", raw: data };
    }
    return { ok: true, waMessageId: data?.messages?.[0]?.id, raw: data };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Envía un mensaje usando una plantilla aprobada por Meta.
 * Necesario para iniciar conversaciones fuera de la ventana de 24h (ej. envíos masivos).
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = "es_MX",
  components: any[] = []
): Promise<SendResult> {
  try {
    const res = await fetch(baseUrl(), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.error?.message || "Error desconocido", raw: data };
    }
    return { ok: true, waMessageId: data?.messages?.[0]?.id, raw: data };
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/** Lista las plantillas de mensajes aprobadas en el WABA (útil para el selector de envío masivo). */
export async function listTemplates() {
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  if (!wabaId) throw new Error("Falta WHATSAPP_BUSINESS_ACCOUNT_ID");
  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${wabaId}/message_templates?limit=100`,
    { headers: authHeaders(), cache: "no-store" }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "No se pudieron obtener las plantillas");
  return data.data as Array<{ name: string; status: string; language: string; category: string }>;
}

/** Estructura simplificada de un mensaje entrante extraído del payload del webhook. */
export type IncomingMessage = {
  from: string;
  waMessageId: string;
  type: string;
  text?: string;
  timestamp: string;
};

/** Estructura simplificada de una actualización de estado (sent/delivered/read/failed). */
export type StatusUpdate = {
  waMessageId: string;
  status: string;
  timestamp: string;
  errorMessage?: string;
};

/** Parsea el payload crudo que Meta envía al webhook (POST). */
export function parseWebhookPayload(payload: any): {
  messages: IncomingMessage[];
  statuses: StatusUpdate[];
} {
  const messages: IncomingMessage[] = [];
  const statuses: StatusUpdate[] = [];

  const entries = payload?.entry || [];
  for (const entry of entries) {
    const changes = entry?.changes || [];
    for (const change of changes) {
      const value = change?.value;
      if (!value) continue;

      for (const msg of value.messages || []) {
        messages.push({
          from: msg.from,
          waMessageId: msg.id,
          type: msg.type,
          text: msg.text?.body,
          timestamp: msg.timestamp,
        });
      }

      for (const status of value.statuses || []) {
        statuses.push({
          waMessageId: status.id,
          status: status.status,
          timestamp: status.timestamp,
          errorMessage: status.errors?.[0]?.title,
        });
      }
    }
  }

  return { messages, statuses };
}
