import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ contacts });
}

export async function POST(req: NextRequest) {
  const { phone, name, tags } = await req.json();

  if (!phone) {
    return NextResponse.json({ error: "El teléfono es obligatorio" }, { status: 400 });
  }

  const contact = await prisma.contact.upsert({
    where: { phone },
    update: { name, tags },
    create: { phone, name, tags },
  });

  return NextResponse.json({ contact });
}
