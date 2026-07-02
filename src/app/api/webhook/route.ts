import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseWebhookPayload } from "@/lib/whatsapp";

/**
 * GET: Meta llama este endpoint UNA VEZ cuando configuras el webhook en
 * Meta for Developers > WhatsApp > Configuration > Webhook.
 * Debe responder el "hub.challenge" tal cual si el "hub.verify_token"
 * coincide con WHATSAPP_VERIFY_TOKEN.
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Verificación fallida", { status: 403 });
}

/**
 * POST: Meta envía aquí en tiempo real:
 *  - mensajes entrantes de los usuarios (value.messages)
 *  - actualizaciones de estado de mensajes salientes (value.statuses)
 * Debemos responder 200 rápido (Meta reintenta si no respondemos a tiempo).
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { messages, statuses } = parseWebhookPayload(payload);

    for (const msg of messages) {
      // Busca o crea el contacto automáticamente
      const contact = await prisma.contact.upsert({
        where: { phone: msg.from },
        update: {},
        create: { phone: msg.from },
      });

      await prisma.message.create({
        data: {
          waMessageId: msg.waMessageId,
          contactId: contact.id,
          phone: msg.from,
          direction: "INBOUND",
          type: msg.type,
          body: msg.text || null,
          status: "RECEIVED",
        },
      });
    }

    for (const status of statuses) {
      // Actualiza el estado del mensaje saliente correspondiente, si existe
      await prisma.message.updateMany({
        where: { waMessageId: status.waMessageId },
        data: {
          status: mapStatus(status.status),
          errorMessage: status.errorMessage || null,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error procesando webhook:", err);
    // Igual respondemos 200 para que Meta no reintente en bucle por errores internos
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

function mapStatus(status: string): "SENT" | "DELIVERED" | "READ" | "FAILED" | "PENDING" {
  switch (status) {
    case "sent":
      return "SENT";
    case "delivered":
      return "DELIVERED";
    case "read":
      return "READ";
    case "failed":
      return "FAILED";
    default:
      return "PENDING";
  }
}
