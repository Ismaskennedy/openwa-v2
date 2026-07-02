import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WA Panel — Mensajería WhatsApp Business",
  description: "Panel de envío y recepción de mensajes vía WhatsApp Cloud API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-ink-50 text-ink-900 antialiased">{children}</body>
    </html>
  );
}
