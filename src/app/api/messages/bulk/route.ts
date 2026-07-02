import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendTemplateMessage } from "@/lib/whatsapp";

type BulkRequestBody = {
  phones: string[]; // lista de números en formato internacional sin '+'
  templateName: string;
  languageCode?: string;
  // Variables {{1}}, {{2}}... del body de la plantilla, iguales para todos los contactos
  bodyVariables?: string[];
  campaignName?: string;
};

// Límite de mensajes por request para no exceder el timeout de la función serverless.
// Para listas más grandes, divide el envío en varias llamadas desde el frontend.
const MAX_PER_REQUEST = 250;

export async function POST(req: NextRequest) {
  const body: BulkRequestBody = await req.json();
  const { phones, templateName, languageCode = "es_MX", bodyVariables = [], campaignName } = body;

  if (!phones?.length || !templateName) {
    return NextResponse.json(
      { error: "Se requiere al menos un teléfono y el nombre de la plantilla" },
      { status: 400 }
    );
  }

  if (phones.length > MAX_PER_REQUEST) {
    return NextResponse.json(
      {
        error: `Máximo ${MAX_PER_REQUEST} números por envío. Divide tu lista en lotes más pequeños.`,
      },
      { status: 400 }
    );
  }

  const components =
    bodyVariables.length > 0
      ? [
          {
            type: "body",
            parameters: bodyVariables.map((text) => ({ type: "text", text })),
          },
        ]
      : [];

  const campaign = await prisma.campaign.create({
    data: {
      name: campaignName || `Envío ${new Date().toISOString()}`,
      templateName,
      totalContacts: phones.length,
    },
  });

  let sentCount = 0;
  let failedCount = 0;
  const results: { phone: string; ok: boolean; error?: string }[] = [];

  // Envío secuencial con una pequeña pausa para respetar los límites de la API.
  for (const rawPhone of phones) {
    const phone = rawPhone.trim().replace(/\D/g, "");
    if (!phone) continue;

    const contact = await prisma.contact.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });

    const result = await sendTemplateMessage(phone, templateName, languageCode, components);

    await prisma.message.create({
      data: {
        waMessageId: result.waMessageId,
        contactId: contact.id,
        phone,
        direction: "OUTBOUND",
        type: "template",
        templateName,
        body: bodyVariables.join(" | ") || null,
        status: result.ok ? "SENT" : "FAILED",
        errorMessage: result.error,
        campaignId: campaign.id,
      },
    });

    if (result.ok) sentCount++;
    else failedCount++;

    results.push({ phone, ok: result.ok, error: result.error });

    // Pequeña pausa entre envíos para evitar throttling de la API de Meta
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { sentCount, failedCount },
  });

  return NextResponse.json({ campaignId: campaign.id, sentCount, failedCount, results });
}
