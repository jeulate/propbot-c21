"use client";

import { useState } from "react";
import type { AsesorAutorizado } from "@/types/domain";

export function GestionAsesores({ asesoresIniciales }: { asesoresIniciales: AsesorAutorizado[] }) {
  const [asesores, setAsesores] = useState(asesoresIniciales);
  const [telegramId, setTelegramId] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function agregarAsesor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/asesores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, nombre }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo agregar el asesor.");
        return;
      }
      setAsesores((prev) => [data.asesor, ...prev]);
      setTelegramId("");
      setNombre("");
    } finally {
      setCargando(false);
    }
  }

  async function alternarEstado(asesor: AsesorAutorizado) {
    const res = await fetch(`/api/asesores/${asesor.telegramId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !asesor.activo }),
    });
    if (res.ok) {
      setAsesores((prev) =>
        prev.map((a) => (a.telegramId === asesor.telegramId ? { ...a, activo: !a.activo } : a))
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={agregarAsesor}
        className="shadow-panel flex flex-col gap-4 rounded-xl border border-carbon-700 bg-carbon-800 p-6 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="text-sm font-medium text-gold-100/80">ID de Telegram</label>
          <input
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            required
            placeholder="ej. 123456789"
            className="focus-ring mt-1.5 w-full rounded-md border border-carbon-600 bg-carbon-900 px-3.5 py-2.5 text-gold-50 placeholder:text-gold-100/30"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-gold-100/80">Nombre del asesor</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="ej. Juan Pérez"
            className="focus-ring mt-1.5 w-full rounded-md border border-carbon-600 bg-carbon-900 px-3.5 py-2.5 text-gold-50 placeholder:text-gold-100/30"
          />
        </div>
        <button
          type="submit"
          disabled={cargando}
          className="focus-ring rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-60"
        >
          {cargando ? "Agregando..." : "Agregar asesor"}
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}

      <p className="text-xs text-gold-100/40">
        💡 Para obtener el ID de Telegram de un asesor, pídele que le escriba a{" "}
        <span className="font-mono">@userinfobot</span> en Telegram — le devolverá su ID numérico.
      </p>

      <div className="shadow-panel overflow-x-auto rounded-xl border border-carbon-700 bg-carbon-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-carbon-700 text-xs uppercase tracking-wide text-gold-100/40">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">ID de Telegram</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {asesores.map((a) => (
              <tr key={a.telegramId} className="border-b border-carbon-700/50 text-gold-100/80">
                <td className="px-4 py-3">{a.nombre}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.telegramId}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      a.activo ? "bg-signal-ok/15 text-signal-ok" : "bg-signal-danger/15 text-signal-danger"
                    }`}
                  >
                    {a.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => alternarEstado(a)}
                    className="focus-ring text-sm text-gold-500 hover:text-gold-300"
                  >
                    {a.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {asesores.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gold-100/40">
                  Ningún asesor registrado todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
