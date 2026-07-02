import { prisma } from "@/lib/db";

export default async function DashboardHome() {
  const [totalContacts, totalMessages, sentToday, campaigns] = await Promise.all([
    prisma.contact.count(),
    prisma.message.count(),
    prisma.message.count({
      where: {
        direction: "OUTBOUND",
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Contactos", value: totalContacts },
    { label: "Mensajes totales", value: totalMessages },
    { label: "Enviados hoy", value: sentToday },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Resumen</h1>
      <p className="mt-1 text-sm text-ink-500">Estado general de tu mensajería de WhatsApp.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{s.label}</p>
            <p className="mt-2 text-3xl font-bold text-ink-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5">
        <h2 className="text-sm font-semibold text-ink-700">Últimas campañas de envío masivo</h2>
        {campaigns.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">Aún no has enviado ninguna campaña.</p>
        ) : (
          <table className="mt-4 w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs uppercase text-ink-400">
                <th className="pb-2 font-semibold">Campaña</th>
                <th className="pb-2 font-semibold">Plantilla</th>
                <th className="pb-2 font-semibold">Enviados</th>
                <th className="pb-2 font-semibold">Fallidos</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id} className="border-b border-ink-50 last:border-0">
                  <td className="py-2.5 font-medium text-ink-800">{c.name}</td>
                  <td className="py-2.5 text-ink-500">{c.templateName}</td>
                  <td className="py-2.5 text-brand-700">{c.sentCount}</td>
                  <td className="py-2.5 text-red-500">{c.failedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
