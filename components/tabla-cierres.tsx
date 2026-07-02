"use client";

import { useEffect, useState } from "react";
import type { Cierre } from "@/types/domain";
import { Download } from "lucide-react";
import Link from "next/link";

function formatoBs(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 }).format(valor)}`;
}

const ESTILOS_ESTADO: Record<string, string> = {
  PENDIENTE_REVISION: "bg-signal-warn/15 text-signal-warn",
  VERIFICADO: "bg-signal-ok/15 text-signal-ok",
  RECHAZADO: "bg-signal-danger/15 text-signal-danger",
};
const ETIQUETAS_ESTADO: Record<string, string> = {
  PENDIENTE_REVISION: "Pendiente",
  VERIFICADO: "Verificado",
  RECHAZADO: "Rechazado",
};

export function TablaCierres({
  cierresIniciales,
  puedeVerificar,
  paginaActual,
  perPage,
  total,
}: {
  cierresIniciales: Cierre[];
  puedeVerificar: boolean;
  paginaActual: number;
  perPage: number;
  total: number;
}) {
  const [cierres, setCierres] = useState(cierresIniciales);
  useEffect(() => {
    setCierres(cierresIniciales);
  }, [cierresIniciales]);
  const [exportando, setExportando] = useState(false);

  async function exportar() {
    setExportando(true);
    try {
      const res = await fetch("/api/cierres/exportar");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `control-cierres-c21-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-carbon-600 dark:text-gold-100/60">
          <span>Mostrar</span>
          <select
            value={perPage}
            onChange={(e) => {
              window.location.href = `/dashboard/cierres?page=1&perPage=${e.target.value}`;
            }}
            className="focus-ring rounded-md border border-gold-200 bg-white px-2.5 py-1.5 text-sm text-carbon-800 dark:border-carbon-700 dark:bg-carbon-900 dark:text-gold-50"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>por página</span>
        </div>
        <button
          onClick={exportar}
          disabled={exportando}
          className="focus-ring flex items-center gap-2 rounded-md bg-gold-500 px-3 py-2 text-xs font-medium text-carbon-950 transition-colors hover:bg-gold-300 disabled:opacity-60 sm:px-4 sm:text-sm"
        >
          <Download size={16} />
          {exportando ? "Generando..." : "Exportar a Excel"}
        </button>
      </div>

      <div className="space-y-3 md:hidden">
        {cierres.map((c) => (
          <article key={c.id} className="shadow-panel rounded-xl border border-gold-200 bg-white p-4 dark:border-carbon-700 dark:bg-carbon-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-carbon-500 dark:text-gold-100/70">{c.id}</p>
                <p className="mt-1 text-sm font-medium text-carbon-900 dark:text-gold-50">{c.direccionInmueble}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS_ESTADO[c.estado]}`}>
                {ETIQUETAS_ESTADO[c.estado]}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-carbon-700 dark:text-gold-100/75">
              <p>Fecha: {c.fechaCierre}</p>
              <p>Tipo: {c.tipoTransaccion}</p>
              <p>Monto: {formatoBs(c.montoTransaccion)}</p>
              <p>Comisión: {formatoBs(c.montoComision)}</p>
              <p>% categoria: {c.porcentajeCategoriaAplicado}%</p>
              <p>Pago real: {formatoBs(c.montoPagoRealAsesor)}</p>
              <p>Captador: {c.asesorCaptadorNombre}</p>
              <p>Colocador: {c.asesorColocadorNombre}</p>
              <p>Exclusiva: {c.exclusiva ? "Sí" : "No"}</p>
            </div>

            {puedeVerificar && (
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/dashboard/cierres/${c.id}`}
                  className="focus-ring mt-3 inline-flex rounded-md border border-gold-300 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-50 dark:border-carbon-600 dark:text-gold-300 dark:hover:bg-carbon-700"
                >
                  Ver detalle
                </Link>
              </div>
            )}
          </article>
        ))}
        {cierres.length === 0 && (
          <div className="rounded-xl border border-gold-200 bg-white px-4 py-8 text-center text-sm text-carbon-600 dark:border-carbon-700 dark:bg-carbon-800 dark:text-gold-100/50">
            No hay cierres registrados todavía.
          </div>
        )}
      </div>

      <div className="shadow-panel hidden overflow-x-auto rounded-xl border border-gold-200 bg-white md:block dark:border-carbon-700 dark:bg-carbon-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gold-200 text-xs uppercase tracking-wide text-carbon-500 dark:border-carbon-700 dark:text-gold-100/40">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Captador</th>
              <th className="px-4 py-3">Colocador</th>
              <th className="px-4 py-3">Dirección</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Monto</th>
              <th className="px-4 py-3">Comisión</th>
              <th className="px-4 py-3">% Categoría</th>
              <th className="px-4 py-3">Pago real</th>
              <th className="px-4 py-3">Exclusiva</th>
              <th className="px-4 py-3">Estado</th>
              {puedeVerificar && <th className="px-4 py-3">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {cierres.map((c) => (
              <tr key={c.id} className="border-b border-gold-100 text-carbon-700 hover:bg-gold-50 dark:border-carbon-700/50 dark:text-gold-100/80 dark:hover:bg-carbon-800/50">
                <td className="px-4 py-3 font-mono text-xs">{c.id}</td>
                <td className="px-4 py-3">{c.fechaCierre}</td>
                <td className="px-4 py-3">{c.asesorCaptadorNombre}</td>
                <td className="px-4 py-3">{c.asesorColocadorNombre}</td>
                <td className="px-4 py-3">{c.direccionInmueble}</td>
                <td className="px-4 py-3">{c.tipoTransaccion}</td>
                <td className="px-4 py-3">{formatoBs(c.montoTransaccion)}</td>
                <td className="px-4 py-3">{formatoBs(c.montoComision)}</td>
                <td className="px-4 py-3">{c.porcentajeCategoriaAplicado}%</td>
                <td className="px-4 py-3">{formatoBs(c.montoPagoRealAsesor)}</td>
                <td className="px-4 py-3">{c.exclusiva ? "Sí" : "No"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS_ESTADO[c.estado]}`}>
                    {ETIQUETAS_ESTADO[c.estado]}
                  </span>
                </td>
                {puedeVerificar && (
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <Link
                        href={`/dashboard/cierres/${c.id}`}
                        className="focus-ring rounded-md border border-gold-300 px-3 py-1.5 text-xs font-medium text-gold-700 hover:bg-gold-50 dark:border-carbon-600 dark:text-gold-300 dark:hover:bg-carbon-700"
                      >
                        Ver
                      </Link>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {cierres.length === 0 && (
              <tr>
                  <td colSpan={puedeVerificar ? 13 : 12} className="py-10 text-center text-carbon-600 dark:text-gold-100/50">
                  No hay cierres registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginacionCierres
        paginaActual={paginaActual}
        perPage={perPage}
        total={total}
      />
    </div>
    
  );
}

function PaginacionCierres({
  paginaActual,
  perPage,
  total,
}: {
  paginaActual: number;
  perPage: number;
  total: number;
}) {
  const totalPaginas = Math.max(1, Math.ceil(total / perPage));
  const desde = total === 0 ? 0 : (paginaActual - 1) * perPage + 1;
  const hasta = Math.min(paginaActual * perPage, total);

  const paginaAnterior = Math.max(1, paginaActual - 1);
  const paginaSiguiente = Math.min(totalPaginas, paginaActual + 1);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gold-200 bg-white px-4 py-3 text-sm dark:border-carbon-700 dark:bg-carbon-800 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-carbon-600 dark:text-gold-100/60">
        Mostrando <span className="font-medium">{desde}</span> a{" "}
        <span className="font-medium">{hasta}</span> de{" "}
        <span className="font-medium">{total}</span> cierres
      </p>

      <div className="flex items-center gap-2">
        <Link
          href={`/dashboard/cierres?page=${paginaAnterior}&perPage=${perPage}`}
          className={`focus-ring rounded-md border px-3 py-1.5 ${
            paginaActual <= 1
              ? "pointer-events-none border-gold-100 text-carbon-300 dark:border-carbon-700 dark:text-gold-100/20"
              : "border-gold-200 text-carbon-700 hover:bg-gold-50 dark:border-carbon-700 dark:text-gold-100 dark:hover:bg-carbon-700"
          }`}
        >
          Anterior
        </Link>

        <span className="rounded-md bg-gold-100 px-3 py-1.5 font-medium text-carbon-900 dark:bg-carbon-900 dark:text-gold-50">
          {paginaActual} / {totalPaginas}
        </span>

        <Link
          href={`/dashboard/cierres?page=${paginaSiguiente}&perPage=${perPage}`}
          className={`focus-ring rounded-md border px-3 py-1.5 ${
            paginaActual >= totalPaginas
              ? "pointer-events-none border-gold-100 text-carbon-300 dark:border-carbon-700 dark:text-gold-100/20"
              : "border-gold-200 text-carbon-700 hover:bg-gold-50 dark:border-carbon-700 dark:text-gold-100 dark:hover:bg-carbon-700"
          }`}
        >
          Siguiente
        </Link>
      </div>
    </div>
  );
}
