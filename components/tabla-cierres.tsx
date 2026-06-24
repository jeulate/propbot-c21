"use client";

import { useState } from "react";
import type { Cierre } from "@/types/domain";
import { Check, X, Download } from "lucide-react";

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
}: {
  cierresIniciales: Cierre[];
  puedeVerificar: boolean;
}) {
  const [cierres, setCierres] = useState(cierresIniciales);
  const [exportando, setExportando] = useState(false);

  async function cambiarEstado(id: string, estado: Cierre["estado"]) {
    const res = await fetch(`/api/cierres/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    if (res.ok) {
      setCierres((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));
    }
  }

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
      <div className="flex justify-end">
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
          <article key={c.id} className="shadow-panel rounded-xl border border-carbon-700 bg-carbon-800 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-gold-100/70">{c.id}</p>
                <p className="mt-1 text-sm font-medium text-gold-50">{c.direccionInmueble}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTILOS_ESTADO[c.estado]}`}>
                {ETIQUETAS_ESTADO[c.estado]}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gold-100/75">
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
                <button
                  onClick={() => cambiarEstado(c.id, "VERIFICADO")}
                  className="focus-ring flex items-center gap-1 rounded-md border border-signal-ok/40 px-2.5 py-1.5 text-xs text-signal-ok hover:bg-signal-ok/10"
                >
                  <Check size={14} /> Verificar
                </button>
                <button
                  onClick={() => cambiarEstado(c.id, "RECHAZADO")}
                  className="focus-ring flex items-center gap-1 rounded-md border border-signal-danger/40 px-2.5 py-1.5 text-xs text-signal-danger hover:bg-signal-danger/10"
                >
                  <X size={14} /> Rechazar
                </button>
              </div>
            )}
          </article>
        ))}
        {cierres.length === 0 && (
          <div className="rounded-xl border border-carbon-700 bg-carbon-800 px-4 py-8 text-center text-sm text-gold-100/40">
            No hay cierres registrados todavía.
          </div>
        )}
      </div>

      <div className="shadow-panel hidden overflow-x-auto rounded-xl border border-carbon-700 bg-carbon-800 md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-carbon-700 text-xs uppercase tracking-wide text-gold-100/40">
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
              <tr key={c.id} className="border-b border-carbon-700/50 text-gold-100/80">
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
                      <button
                        onClick={() => cambiarEstado(c.id, "VERIFICADO")}
                        title="Marcar como verificado"
                        className="focus-ring rounded-md p-1.5 text-signal-ok hover:bg-signal-ok/10"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => cambiarEstado(c.id, "RECHAZADO")}
                        title="Rechazar"
                        className="focus-ring rounded-md p-1.5 text-signal-danger hover:bg-signal-danger/10"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {cierres.length === 0 && (
              <tr>
                  <td colSpan={puedeVerificar ? 13 : 12} className="py-10 text-center text-gold-100/40">
                  No hay cierres registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
