"use client";

import { useMemo, useState } from "react";
import type { AsesorAutorizado, CaptacionMensual } from "@/types/domain";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function GestionCaptacionesMensuales({
  asesores,
  captacionesIniciales,
}: {
  asesores: AsesorAutorizado[];
  captacionesIniciales: CaptacionMensual[];
}) {
  const fecha = new Date();
  const [anio, setAnio] = useState(String(fecha.getFullYear()));
  const [mes, setMes] = useState(String(fecha.getMonth() + 1));
  const [captaciones, setCaptaciones] = useState(captacionesIniciales);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [cargando, setCargando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const asesoresActivos = asesores.filter((a) => a.activo);

  const captacionesPeriodo = useMemo(() => {
    return captaciones.filter(
      (c) => c.anio === Number(anio) && c.mes === Number(mes)
    );
  }, [captaciones, anio, mes]);

  function obtenerValorActual(asesorId: string): string {
    if (valores[asesorId] !== undefined) return valores[asesorId];

    const existente = captacionesPeriodo.find(
      (c) => c.asesorTelegramId === asesorId
    );

    return existente ? String(existente.cantidad) : "0";
  }

  async function guardarTodo() {
    setCargando(true);
    setError(null);
    setMensajeOk(null);

    try {
      const resultados: CaptacionMensual[] = [];

      for (const asesor of asesoresActivos) {
        const cantidad = Number(obtenerValorActual(asesor.telegramId));

        const res = await fetch("/api/captaciones-mensuales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            anio: Number(anio),
            mes: Number(mes),
            asesorTelegramId: asesor.telegramId,
            asesorNombre: asesor.nombre,
            cantidad: Number.isFinite(cantidad) ? cantidad : 0,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "No se pudo guardar una captación.");
        }

        resultados.push(data.captacion);
      }

      setCaptaciones((prev) => {
        const idsActualizados = new Set(resultados.map((r) => r.id));
        return [
          ...resultados,
          ...prev.filter((item) => !idsActualizados.has(item.id)),
        ];
      });

      setValores({});
      setMensajeOk("Captaciones mensuales guardadas correctamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
          Captaciones mensuales
        </h2>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Alimenta manualmente el Top Captaciones por asesor y mes.
        </p>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-carbon-700 dark:text-gold-100/80">
            Año
          </label>
          <input
            value={anio}
            onChange={(e) => {
              setAnio(e.target.value);
              setValores({});
            }}
            inputMode="numeric"
            className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-carbon-700 dark:text-gold-100/80">
            Mes
          </label>
          <select
            value={mes}
            onChange={(e) => {
              setMes(e.target.value);
              setValores({});
            }}
            className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
          >
            {MESES.map((nombre, index) => (
              <option key={nombre} value={index + 1}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={guardarTodo}
          disabled={cargando}
          className="focus-ring self-end rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-60"
        >
          {cargando ? "Guardando..." : "Guardar captaciones"}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}

      {mensajeOk && (
        <p className="mb-4 rounded-md border border-signal-ok/40 bg-signal-ok/10 px-3 py-2 text-sm text-signal-ok">
          {mensajeOk}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-gold-200 dark:border-carbon-700">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gold-200 text-xs uppercase tracking-wide text-carbon-500 dark:border-carbon-700 dark:text-gold-100/40">
              <th className="px-4 py-3">Asesor</th>
              <th className="px-4 py-3">Captaciones</th>
            </tr>
          </thead>
          <tbody>
            {asesoresActivos.map((asesor) => (
              <tr
                key={asesor.telegramId}
                className="border-b border-gold-100 text-carbon-700 last:border-b-0 dark:border-carbon-700/50 dark:text-gold-100/80"
              >
                <td className="px-4 py-3 font-medium">{asesor.nombre}</td>
                <td className="px-4 py-3">
                  <input
                    value={obtenerValorActual(asesor.telegramId)}
                    onChange={(e) =>
                      setValores((prev) => ({
                        ...prev,
                        [asesor.telegramId]: e.target.value,
                      }))
                    }
                    inputMode="numeric"
                    className="focus-ring w-28 rounded-md border border-gold-300 bg-gold-50 px-3 py-2 text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
                  />
                </td>
              </tr>
            ))}

            {asesoresActivos.length === 0 && (
              <tr>
                <td
                  colSpan={2}
                  className="py-10 text-center text-carbon-500 dark:text-gold-100/40"
                >
                  No hay asesores activos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}