import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTextMessage } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const { phone, body } = await req.json();

  if (!phone || !body) {
    return NextResponse.json({ error: "Teléfono y mensaje son obligatorios" }, { status: 400 });
  }

  const contact = await prisma.contact.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  const result = await sendTextMessage(phone, body);

  const message = await prisma.message.create({
    data: {
      waMessageId: result.waMessageId,
      contactId: contact.id,
      phone,
      direction: "OUTBOUND",
      type: "text",
      body,
      status: result.ok ? "SENT" : "FAILED",
      errorMessage: result.error,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error, message }, { status: 400 });
  }

  return NextResponse.json({ message });
}
