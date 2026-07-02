import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "wa_session";

function secretKey() {
  return new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-cambia-esto");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // El login y el webhook siempre son públicos
  if (pathname.startsWith("/login") || pathname.startsWith("/api/webhook") || pathname.startsWith("/api/auth/login")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(req);
  }

  try {
    const { payload } = await jwtVerify(token, secretKey());

    // Solo ADMIN puede entrar a /dashboard/usuarios y a /api/users
    if ((pathname.startsWith("/dashboard/usuarios") || pathname.startsWith("/api/users")) && payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  } catch {
    return redirectToLogin(req);
  }
}

function redirectToLogin(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/contacts/:path*", "/api/messages/:path*", "/api/users/:path*"],
};
