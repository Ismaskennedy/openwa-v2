import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/messages -> lista los últimos mensajes agrupables por teléfono
// GET /api/messages?phone=521555... -> conversación completa de un número
export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone");

  if (phone) {
    const messages = await prisma.message.findMany({
      where: { phone },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    return NextResponse.json({ messages });
  }

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { contact: true },
  });

  return NextResponse.json({ messages });
}
