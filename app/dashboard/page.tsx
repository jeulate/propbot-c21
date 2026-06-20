import { obtenerMetricas } from "@/lib/repositories/cierres";
import { TarjetaMetrica } from "@/components/tarjeta-metrica";
import { GraficoCierresPorAsesor } from "@/components/grafico-cierres-asesor";
import Link from "next/link";

function formatoUSD(valor: number): string {
  return new Intl.NumberFormat("es-BO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(valor);
}

export default async function DashboardPage() {
  const metricas = await obtenerMetricas();

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-gold-50">Resumen general</h1>
        <p className="mt-1 text-sm text-gold-100/50">
          Estado actual de los cierres registrados vía el bot de Telegram.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TarjetaMetrica etiqueta="Total de cierres" valor={String(metricas.totalCierres)} />
        <TarjetaMetrica
          etiqueta="Monto total transado"
          valor={formatoUSD(metricas.totalTransacciones)}
        />
        <TarjetaMetrica etiqueta="Comisiones generadas" valor={formatoUSD(metricas.totalComisiones)} />
        <TarjetaMetrica
          etiqueta="Pendientes de revisión"
          valor={String(metricas.pendientesRevision)}
          tono={metricas.pendientesRevision > 0 ? "warn" : "ok"}
          subtexto={metricas.pendientesRevision > 0 ? "Requieren verificación" : "Todo verificado"}
        />
      </section>

      <section className="shadow-panel rounded-xl border border-carbon-700 bg-carbon-800 p-6">
        <h2 className="font-display text-lg font-medium text-gold-50">Cierres por asesor</h2>
        <div className="mt-4">
          <GraficoCierresPorAsesor
            datos={metricas.porAsesor.map((a) => ({ nombre: a.nombre, cierres: a.cierres }))}
          />
        </div>
      </section>

      <section className="shadow-panel rounded-xl border border-carbon-700 bg-carbon-800 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-gold-50">Últimos cierres registrados</h2>
          <Link href="/dashboard/cierres" className="focus-ring text-sm text-gold-500 hover:text-gold-300">
            Ver todos →
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-carbon-700 text-xs uppercase tracking-wide text-gold-100/40">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Dirección</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Comisión</th>
                <th className="py-2 pr-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {metricas.ultimosCierres.map((c) => (
                <tr key={c.id} className="border-b border-carbon-700/50 text-gold-100/80">
                  <td className="py-2.5 pr-4 font-mono text-xs">{c.id}</td>
                  <td className="py-2.5 pr-4">{c.fechaCierre}</td>
                  <td className="py-2.5 pr-4">{c.direccionInmueble}</td>
                  <td className="py-2.5 pr-4">{c.tipoTransaccion}</td>
                  <td className="py-2.5 pr-4">{formatoUSD(c.montoComision)}</td>
                  <td className="py-2.5 pr-4">
                    <EstadoBadge estado={c.estado} />
                  </td>
                </tr>
              ))}
              {metricas.ultimosCierres.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gold-100/40">
                    Aún no se ha registrado ningún cierre.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    PENDIENTE_REVISION: "bg-signal-warn/15 text-signal-warn",
    VERIFICADO: "bg-signal-ok/15 text-signal-ok",
    RECHAZADO: "bg-signal-danger/15 text-signal-danger",
  };
  const etiquetas: Record<string, string> = {
    PENDIENTE_REVISION: "Pendiente",
    VERIFICADO: "Verificado",
    RECHAZADO: "Rechazado",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado]}`}>
      {etiquetas[estado]}
    </span>
  );
}
