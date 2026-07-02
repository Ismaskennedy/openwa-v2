"use client";

import { useEffect, useState, useCallback } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "AGENTE";
  active: boolean;
  createdAt: string;
};

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "AGENTE">("AGENTE");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error || "No se pudo crear el usuario");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole("AGENTE");
    loadUsers();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Usuarios</h1>
      <p className="mt-1 text-sm text-ink-500">Administra quién puede acceder al panel y con qué rol.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <form onSubmit={handleSubmit} className="card h-fit space-y-4 p-5">
          <h2 className="text-sm font-semibold text-ink-700">Nuevo usuario</h2>
          <div>
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Correo</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="label">Rol</label>
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as any)}>
              <option value="AGENTE">Agente</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? "Creando..." : "Crear usuario"}
          </button>
        </form>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-ink-700">Todos los usuarios</h2>
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase text-ink-400">
                <th className="pb-2 font-semibold">Nombre</th>
                <th className="pb-2 font-semibold">Correo</th>
                <th className="pb-2 font-semibold">Rol</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ink-50 last:border-0">
                  <td className="py-2.5 font-medium text-ink-800">{u.name}</td>
                  <td className="py-2.5 text-ink-500">{u.email}</td>
                  <td className="py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        u.role === "ADMIN" ? "bg-brand-100 text-brand-800" : "bg-ink-100 text-ink-600"
                      }`}
                    >
                      {u.role === "ADMIN" ? "Administrador" : "Agente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
