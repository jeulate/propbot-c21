"use client";

import { useState } from "react";
import type { MetaMensual } from "@/types/domain";

const MESES = [
  { valor: 1, label: "Enero" },
  { valor: 2, label: "Febrero" },
  { valor: 3, label: "Marzo" },
  { valor: 4, label: "Abril" },
  { valor: 5, label: "Mayo" },
  { valor: 6, label: "Junio" },
  { valor: 7, label: "Julio" },
  { valor: 8, label: "Agosto" },
  { valor: 9, label: "Septiembre" },
  { valor: 10, label: "Octubre" },
  { valor: 11, label: "Noviembre" },
  { valor: 12, label: "Diciembre" },
];

function formatoBs(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

function nombreMes(mes: number): string {
  return MESES.find((item) => item.valor === mes)?.label ?? String(mes);
}

export function GestionMetas({
  metasIniciales,
}: {
  metasIniciales: MetaMensual[];
}) {
  const fecha = new Date();
  const [metas, setMetas] = useState(metasIniciales);
  const [anio, setAnio] = useState(String(fecha.getFullYear()));
  const [mes, setMes] = useState(String(fecha.getMonth() + 1));
  const [montoObjetivo, setMontoObjetivo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);

  async function guardarMeta(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setMensajeOk(null);
    setCargando(true);

    try {
      const res = await fetch("/api/metas-mensuales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          anio: Number(anio),
          mes: Number(mes),
          montoObjetivo: Number(montoObjetivo),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la meta mensual.");
        return;
      }

      setMetas((prev) => [
        data.meta,
        ...prev.filter((item) => item.id !== data.meta.id),
      ]);

      setMontoObjetivo("");
      setMensajeOk("Meta mensual guardada correctamente.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
          Metas mensuales
        </h2>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Define la meta mensual de comisiones de oficina para medir el avance
          del dashboard.
        </p>
      </div>

      <form
        onSubmit={guardarMeta}
        className="grid grid-cols-1 gap-4 md:grid-cols-4"
      >
        <div>
          <label className="text-sm font-medium text-carbon-700 dark:text-gold-100/80">
            Año
          </label>
          <input
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            required
            inputMode="numeric"
            className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 placeholder:text-carbon-400 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-carbon-700 dark:text-gold-100/80">
            Mes
          </label>
          <select
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
          >
            {MESES.map((item) => (
              <option key={item.valor} value={item.valor}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-carbon-700 dark:text-gold-100/80">
            Meta de comisiones
          </label>
          <input
            value={montoObjetivo}
            onChange={(e) => setMontoObjetivo(e.target.value)}
            required
            inputMode="decimal"
            placeholder="Ej. 310000"
            className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 placeholder:text-carbon-400 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50 dark:placeholder:text-gold-100/30"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="focus-ring self-end rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-60"
        >
          {cargando ? "Guardando..." : "Guardar meta"}
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}

      {mensajeOk && (
        <p className="mt-4 rounded-md border border-signal-ok/40 bg-signal-ok/10 px-3 py-2 text-sm text-signal-ok">
          {mensajeOk}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-xl border border-gold-200 dark:border-carbon-700">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gold-200 text-xs uppercase tracking-wide text-carbon-500 dark:border-carbon-700 dark:text-gold-100/40">
              <th className="px-4 py-3">Periodo</th>
              <th className="px-4 py-3">Meta</th>
              <th className="px-4 py-3">Actualizado</th>
            </tr>
          </thead>

          <tbody>
            {metas.map((meta) => (
              <tr
                key={meta.id}
                className="border-b border-gold-100 text-carbon-700 last:border-b-0 dark:border-carbon-700/50 dark:text-gold-100/80"
              >
                <td className="px-4 py-3">
                  {nombreMes(meta.mes)} {meta.anio}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatoBs(meta.montoObjetivo)}
                </td>
                <td className="px-4 py-3 text-xs text-carbon-500 dark:text-gold-100/40">
                  {new Date(meta.actualizadoEn).toLocaleString("es-BO")}
                </td>
              </tr>
            ))}

            {metas.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="py-10 text-center text-carbon-500 dark:text-gold-100/40"
                >
                  Aún no hay metas mensuales registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}