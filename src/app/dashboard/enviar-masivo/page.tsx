"use client";

import { useEffect, useState } from "react";

type Template = { name: string; status: string; language: string; category: string };

export default function EnvioMasivoPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [languageCode, setLanguageCode] = useState("es_MX");
  const [numbersRaw, setNumbersRaw] = useState("");
  const [variablesRaw, setVariablesRaw] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((data) => {
        setTemplates(data.templates || []);
        setLoadingTemplates(false);
      })
      .catch(() => setLoadingTemplates(false));
  }, []);

  const phones = numbersRaw
    .split(/[\n,]/)
    .map((p) => p.trim().replace(/\D/g, ""))
    .filter(Boolean);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!templateName) {
      setError("Selecciona una plantilla aprobada");
      return;
    }
    if (phones.length === 0) {
      setError("Agrega al menos un número de teléfono");
      return;
    }

    setSending(true);
    const bodyVariables = variablesRaw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    const res = await fetch("/api/messages/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phones,
        templateName,
        languageCode,
        bodyVariables,
        campaignName: campaignName || undefined,
      }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error || "Ocurrió un error al enviar la campaña");
      return;
    }

    setResult(data);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      // Toma cada línea o cada celda separada por coma como un número
      setNumbersRaw((prev) => (prev ? prev + "\n" + text : text));
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Envío masivo</h1>
      <p className="mt-1 text-sm text-ink-500">
        Envía una plantilla aprobada por Meta a una lista de contactos. Las plantillas son obligatorias para iniciar conversaciones fuera de la ventana de 24h.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card space-y-4 p-5">
          <div>
            <label className="label">Nombre de campaña (opcional)</label>
            <input
              className="input"
              placeholder="Promo julio 2026"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Plantilla aprobada</label>
            {loadingTemplates ? (
              <p className="text-sm text-ink-400">Cargando plantillas desde Meta...</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-amber-600">
                No se encontraron plantillas. Verifica tu WHATSAPP_BUSINESS_ACCOUNT_ID y token, o crea una plantilla en Meta Business Manager.
              </p>
            ) : (
              <select
                className="input"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              >
                <option value="">Selecciona una plantilla</option>
                {templates
                  .filter((t) => t.status === "APPROVED")
                  .map((t) => (
                    <option key={t.name + t.language} value={t.name}>
                      {t.name} ({t.language})
                    </option>
                  ))}
              </select>
            )}
          </div>

          <div>
            <label className="label">Código de idioma</label>
            <input
              className="input"
              placeholder="es_MX"
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Variables del cuerpo (separadas por coma)</label>
            <input
              className="input"
              placeholder="Juan, 15% de descuento"
              value={variablesRaw}
              onChange={(e) => setVariablesRaw(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-400">
              Reemplazan {"{{1}}"}, {"{{2}}"}... en ese orden, iguales para todos los contactos del lote.
            </p>
          </div>
        </div>

        <div className="card space-y-4 p-5">
          <div>
            <label className="label">Números de teléfono</label>
            <textarea
              className="input h-40 resize-none font-mono text-xs"
              placeholder={"5215512345678\n5215587654321\n..."}
              value={numbersRaw}
              onChange={(e) => setNumbersRaw(e.target.value)}
            />
            <p className="mt-1 text-xs text-ink-400">
              Uno por línea o separados por coma, formato internacional sin "+". Detectados: {phones.length}
            </p>
          </div>

          <div>
            <label className="label">O sube un archivo CSV/TXT</label>
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} className="text-sm" />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={sending} className="btn-primary w-full">
            {sending ? `Enviando a ${phones.length} contactos...` : `Enviar a ${phones.length} contactos`}
          </button>
        </div>
      </form>

      {result && (
        <div className="card mt-6 p-5">
          <h2 className="text-sm font-semibold text-ink-700">Resultado de la campaña</h2>
          <div className="mt-3 flex gap-6 text-sm">
            <p className="text-brand-700">✔ Enviados: {result.sentCount}</p>
            <p className="text-red-500">✖ Fallidos: {result.failedCount}</p>
          </div>
          {result.results?.some((r: any) => !r.ok) && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-ink-500">Ver errores</summary>
              <ul className="mt-2 space-y-1 text-xs text-ink-500">
                {result.results
                  .filter((r: any) => !r.ok)
                  .map((r: any, i: number) => (
                    <li key={i}>
                      {r.phone}: {r.error}
                    </li>
                  ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
