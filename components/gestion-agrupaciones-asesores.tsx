"use client";

import { useMemo, useState } from "react";
import type {
  AgrupacionAsesor,
  AsesorAutorizado,
  TipoAgrupacionAsesor,
} from "@/types/domain";

const CONFIGURACION: Record<
  TipoAgrupacionAsesor,
  {
    titulo: string;
    singular: string;
    responsable: string;
    limite: number;
    sugerencias: string[];
  }
> = {
  EQUIPO_TRIPLE_21: {
    titulo: "Equipos Triple 21",
    singular: "Equipo Triple 21",
    responsable: "Capitán",
    limite: 5,
    sugerencias: [
      "Unlimited",
      "Golden Legend",
      "VIP Realtors",
      "Titanes",
      "New Home",
    ],
  },
  TEAM: {
    titulo: "Teams",
    singular: "Team",
    responsable: "Team Leader",
    limite: 4,
    sugerencias: [
      "Team Evolution",
      "Team Sinergy",
      "Team Oikos",
      "Team Solutions",
    ],
  },
};

export function GestionAgrupacionesAsesores({
  agrupacionesIniciales,
  asesoresIniciales,
}: {
  agrupacionesIniciales: AgrupacionAsesor[];
  asesoresIniciales: AsesorAutorizado[];
}) {
  const [agrupaciones, setAgrupaciones] = useState(agrupacionesIniciales);
  const [asesores, setAsesores] = useState(asesoresIniciales);
  const [nombres, setNombres] = useState<Record<TipoAgrupacionAsesor, string>>({
    TEAM: "",
    EQUIPO_TRIPLE_21: "",
  });
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const asesoresActivos = useMemo(
    () =>
      asesores
        .filter((asesor) => asesor.activo)
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    [asesores],
  );

  async function crear(tipo: TipoAgrupacionAsesor) {
    setError(null);
    setMensaje(null);
    setProcesando(`crear-${tipo}`);
    try {
      const res = await fetch("/api/agrupaciones-asesores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, nombre: nombres[tipo] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo crear.");
      setAgrupaciones((prev) => [...prev, data.agrupacion]);
      setNombres((prev) => ({ ...prev, [tipo]: "" }));
      setMensaje(`${CONFIGURACION[tipo].singular} registrado correctamente.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear.");
    } finally {
      setProcesando(null);
    }
  }

  async function actualizar(
    agrupacion: AgrupacionAsesor,
    cambios: {
      nombre?: string;
      activo?: boolean;
      responsableTelegramId?: string | null;
    },
  ) {
    if (
      cambios.activo !== undefined &&
      !window.confirm(
        `¿Confirmas ${cambios.activo ? "activar" : "inactivar"} "${agrupacion.nombre}"? El historial se conservará.`,
      )
    ) {
      return;
    }
    setError(null);
    setMensaje(null);
    setProcesando(agrupacion.id);
    try {
      const res = await fetch(`/api/agrupaciones-asesores/${agrupacion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo actualizar.");
      setAgrupaciones((prev) =>
        prev.map((item) =>
          item.id === agrupacion.id ? data.agrupacion : item,
        ),
      );
      if (data.asesores) setAsesores(data.asesores);
      setMensaje("Configuración actualizada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      setProcesando(null);
    }
  }

  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div className="mb-6">
        <h2 className="font-display text-xl font-semibold text-carbon-900 dark:text-gold-50">
          Equipos y Teams
        </h2>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/60">
          Registra hasta 5 Equipos Triple 21 y 4 Teams. El capitán o Team Leader
          se elige entre los asesores activos.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-signal-danger/10 px-4 py-3 text-sm text-signal-danger">
          {error}
        </p>
      )}
      {mensaje && (
        <p className="mb-4 rounded-md bg-signal-ok/10 px-4 py-3 text-sm text-signal-ok">
          {mensaje}
        </p>
      )}

      <div className="grid gap-8 xl:grid-cols-2">
        {(["EQUIPO_TRIPLE_21", "TEAM"] as const).map((tipo) => {
          const config = CONFIGURACION[tipo];
          const items = agrupaciones.filter((item) => item.tipo === tipo);
          return (
            <div key={tipo}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-carbon-900 dark:text-gold-50">
                  {config.titulo}
                </h3>
                <span className="text-xs text-carbon-500 dark:text-gold-100/50">
                  {items.length}/{config.limite} registrados
                </span>
              </div>

              <div className="mb-4 flex gap-2">
                <input
                  value={nombres[tipo]}
                  onChange={(e) =>
                    setNombres((prev) => ({ ...prev, [tipo]: e.target.value }))
                  }
                  list={`sugerencias-${tipo}`}
                  placeholder={`Nombre del ${config.singular}`}
                  disabled={items.length >= config.limite}
                  className="focus-ring min-w-0 flex-1 rounded-md border border-gold-300 bg-gold-50 px-3 py-2 text-sm text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
                />
                <datalist id={`sugerencias-${tipo}`}>
                  {config.sugerencias.map((nombre) => (
                    <option key={nombre} value={nombre} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={() => crear(tipo)}
                  disabled={
                    !nombres[tipo].trim() ||
                    items.length >= config.limite ||
                    procesando !== null
                  }
                  className="focus-ring rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-carbon-950 disabled:opacity-50"
                >
                  Registrar
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-lg border border-gold-200 p-4 dark:border-carbon-700"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-carbon-900 dark:text-gold-50">
                          {item.nombre}
                        </p>
                        <p
                          className={`text-xs ${item.activo ? "text-signal-ok" : "text-carbon-500"}`}
                        >
                          {item.activo ? "Activo" : "Inactivo"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={procesando === item.id}
                        onClick={() =>
                          actualizar(item, { activo: !item.activo })
                        }
                        className="focus-ring rounded-md border border-gold-300 px-3 py-1.5 text-xs text-gold-700 dark:border-carbon-600 dark:text-gold-300"
                      >
                        {item.activo ? "Inactivar" : "Activar"}
                      </button>
                    </div>

                    <label className="mt-4 block text-xs font-medium text-carbon-600 dark:text-gold-100/70">
                      {config.responsable}
                    </label>
                    <select
                      value={item.responsableTelegramId ?? ""}
                      disabled={!item.activo || procesando === item.id}
                      onChange={(e) =>
                        actualizar(item, {
                          responsableTelegramId: e.target.value || null,
                        })
                      }
                      className="focus-ring mt-1 w-full rounded-md border border-gold-300 bg-gold-50 px-3 py-2 text-sm text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
                    >
                      <option value="">Sin asignar</option>
                      {asesoresActivos.map((asesor) => (
                        <option
                          key={asesor.telegramId}
                          value={asesor.telegramId}
                        >
                          {asesor.nombre}
                        </option>
                      ))}
                    </select>
                  </article>
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-gold-300 px-4 py-6 text-center text-sm text-carbon-500 dark:border-carbon-600 dark:text-gold-100/50">
                    Aún no hay registros. Puedes usar los nombres sugeridos o
                    escribir otros.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
