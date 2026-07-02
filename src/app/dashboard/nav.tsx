"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Resumen", icon: "◱", adminOnly: false },
  { href: "/dashboard/mensajes", label: "Mensajes", icon: "◇", adminOnly: false },
  { href: "/dashboard/enviar-masivo", label: "Envío masivo", icon: "▲", adminOnly: false },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: "●", adminOnly: true },
];

export default function DashboardNav({ name, role }: { name: string; role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col justify-between bg-ink-900 p-5 text-white">
      <div>
        <div className="mb-8 flex items-center gap-2 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 font-bold">
            W
          </div>
          <span className="text-sm font-bold">WA Panel</span>
        </div>

        <nav className="space-y-1">
          {links
            .filter((l) => !l.adminOnly || role === "ADMIN")
            .map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-brand-600 text-white" : "text-ink-300 hover:bg-ink-800 hover:text-white"
                  }`}
                >
                  <span className="text-brand-300">{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
        </nav>
      </div>

      <div className="border-t border-ink-700 pt-4">
        <p className="truncate px-1 text-sm font-semibold">{name}</p>
        <p className="px-1 text-xs text-ink-400">{role === "ADMIN" ? "Administrador" : "Agente"}</p>
        <button
          onClick={handleLogout}
          className="mt-3 w-full rounded-xl border border-ink-700 px-3 py-2 text-left text-sm text-ink-300 transition hover:bg-ink-800 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
