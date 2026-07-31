"use client";

import { useEffect, useState } from "react";
import type {
  CategoriaAsesor,
  ConfiguracionComisionTeamCategoria,
} from "@/types/domain";

type FilaEditable = {
  categoriaId: string;
  nombre: string;
  activo: boolean;
  porcentajeOficina: string;
  porcentajeTeamLeader: string;
};

type GestionComisionesTeamProps = {
  categorias: CategoriaAsesor[];
  configuracionesIniciales: ConfiguracionComisionTeamCategoria[];
};

function convertirPorcentaje(valor: string): number {
  return Number(valor.trim().replace(",", "."));
}

export function GestionComisionesTeam({
  categorias,
  configuracionesIniciales,
}: GestionComisionesTeamProps) {
  const [filas, setFilas] = useState<FilaEditable[]>(() =>
    categorias.map((categoria) => {
      const configuracion = configuracionesIniciales.find(
        (item) => item.categoriaId === categoria.id,
      );

      return {
        categoriaId: categoria.id,
        nombre: categoria.nombre,
        activo: categoria.activo,
        porcentajeOficina: String(configuracion?.porcentajeOficina ?? 0),
        porcentajeTeamLeader: String(configuracion?.porcentajeTeamLeader ?? 0),
      };
    }),
  );

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);

  useEffect(() => {
    function sincronizar(event: Event) {
      const categoriasActualizadas = (event as CustomEvent<CategoriaAsesor[]>)
        .detail;

      setFilas((actuales) =>
        categoriasActualizadas.map((categoria) => {
          const existente = actuales.find(
            (fila) => fila.categoriaId === categoria.id,
          );
          const inicial = configuracionesIniciales.find(
            (item) => item.categoriaId === categoria.id,
          );

          return {
            categoriaId: categoria.id,
            nombre: categoria.nombre,
            activo: categoria.activo,
            porcentajeOficina:
              existente?.porcentajeOficina ??
              String(inicial?.porcentajeOficina ?? 0),
            porcentajeTeamLeader:
              existente?.porcentajeTeamLeader ??
              String(inicial?.porcentajeTeamLeader ?? 0),
          };
        }),
      );
    }

    window.addEventListener("categorias-asesor-actualizadas", sincronizar);
    return () =>
      window.removeEventListener("categorias-asesor-actualizadas", sincronizar);
  }, [configuracionesIniciales]);

  function actualizarFila(
    categoriaId: string,
    campo: "porcentajeOficina" | "porcentajeTeamLeader",
    valor: string,
  ) {
    setFilas((actuales) =>
      actuales.map((fila) =>
        fila.categoriaId === categoriaId ? { ...fila, [campo]: valor } : fila,
      ),
    );
  }

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);

    const comisionesTeamPorCategoria = filas.map((fila) => ({
      categoriaId: fila.categoriaId,
      porcentajeOficina: convertirPorcentaje(fila.porcentajeOficina),
      porcentajeTeamLeader: convertirPorcentaje(fila.porcentajeTeamLeader),
    }));

    const tieneValoresInvalidos = comisionesTeamPorCategoria.some(
      (item) =>
        !Number.isFinite(item.porcentajeOficina) ||
        !Number.isFinite(item.porcentajeTeamLeader) ||
        item.porcentajeOficina < 0 ||
        item.porcentajeTeamLeader < 0 ||
        item.porcentajeOficina > 100 ||
        item.porcentajeTeamLeader > 100 ||
        item.porcentajeOficina + item.porcentajeTeamLeader > 100,
    );

    if (tieneValoresInvalidos) {
      setError(
        "Revisa los porcentajes. Cada valor debe estar entre 0 y 100 y su suma no puede superar 100.",
      );
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comisionesTeamPorCategoria }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        setError(data.error ?? "No se pudo guardar la configuración de Team.");
        return;
      }

      const configuracionesGuardadas = data.configuracion
        .comisionesTeamPorCategoria as ConfiguracionComisionTeamCategoria[];

      setFilas((actuales) =>
        actuales.map((fila) => {
          const guardada = configuracionesGuardadas.find(
            (item) => item.categoriaId === fila.categoriaId,
          );

          return guardada
            ? {
                ...fila,
                porcentajeOficina: String(guardada.porcentajeOficina),
                porcentajeTeamLeader: String(guardada.porcentajeTeamLeader),
              }
            : fila;
        }),
      );

      setMensajeOk("Configuración de comisiones de Team guardada.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div>
        <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
          Comisiones para integrantes de Team
        </h2>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/60">
          Configura el porcentaje destinado a la oficina y al Team Leader según
          la categoría del asesor.
        </p>
      </div>

      <form onSubmit={guardar} className="mt-5">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-gold-200 dark:border-carbon-600">
                <th className="px-3 py-3 text-sm font-semibold text-carbon-700 dark:text-gold-100/80">
                  Categoría
                </th>
                <th className="px-3 py-3 text-sm font-semibold text-carbon-700 dark:text-gold-100/80">
                  Oficina (%)
                </th>
                <th className="px-3 py-3 text-sm font-semibold text-carbon-700 dark:text-gold-100/80">
                  Team Leader (%)
                </th>
                <th className="px-3 py-3 text-sm font-semibold text-carbon-700 dark:text-gold-100/80">
                  Total declarado
                </th>
              </tr>
            </thead>

            <tbody>
              {filas.map((fila) => {
                const oficina = convertirPorcentaje(fila.porcentajeOficina);
                const lider = convertirPorcentaje(fila.porcentajeTeamLeader);
                const total =
                  Number.isFinite(oficina) && Number.isFinite(lider)
                    ? oficina + lider
                    : 0;

                return (
                  <tr
                    key={fila.categoriaId}
                    className={`border-b border-gold-100 last:border-b-0 dark:border-carbon-700 ${
                      fila.activo ? "" : "opacity-55"
                    }`}
                  >
                    <td className="px-3 py-3 font-medium text-carbon-900 dark:text-gold-50">
                      {fila.nombre}
                      {!fila.activo && (
                        <span className="ml-2 rounded-full bg-carbon-200 px-2 py-0.5 text-xs text-carbon-700 dark:bg-carbon-700 dark:text-gold-100">
                          Inactiva
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        disabled={!fila.activo}
                        aria-label={`Comisión de oficina para ${fila.nombre}`}
                        value={fila.porcentajeOficina}
                        onChange={(e) =>
                          actualizarFila(
                            fila.categoriaId,
                            "porcentajeOficina",
                            e.target.value,
                          )
                        }
                        className="focus-ring w-full rounded-md border border-gold-300 bg-gold-50 px-3 py-2 text-carbon-900 disabled:cursor-not-allowed disabled:bg-carbon-100 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50 dark:disabled:bg-carbon-800"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        disabled={!fila.activo}
                        aria-label={`Comisión del Team Leader para ${fila.nombre}`}
                        value={fila.porcentajeTeamLeader}
                        onChange={(e) =>
                          actualizarFila(
                            fila.categoriaId,
                            "porcentajeTeamLeader",
                            e.target.value,
                          )
                        }
                        className="focus-ring w-full rounded-md border border-gold-300 bg-gold-50 px-3 py-2 text-carbon-900 disabled:cursor-not-allowed disabled:bg-carbon-100 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50 dark:disabled:bg-carbon-800"
                      />
                    </td>

                    <td className="px-3 py-3 font-semibold text-carbon-800 dark:text-gold-100">
                      {total.toLocaleString("es-BO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      %
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-carbon-600 dark:text-gold-100/70">
          Estos porcentajes solo se aplicarán a integrantes de Team que no sean
          Team Leaders. Los asesores sin Team conservarán el cálculo actual.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger"
          >
            {error}
          </p>
        )}

        {mensajeOk && (
          <p
            role="status"
            className="mt-4 rounded-md border border-signal-ok/40 bg-signal-ok/10 px-3 py-2 text-sm text-signal-ok"
          >
            {mensajeOk}
          </p>
        )}

        <button
          type="submit"
          disabled={guardando || filas.length === 0}
          className="focus-ring mt-5 rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar comisiones de Team"}
        </button>
      </form>
    </section>
  );
}
