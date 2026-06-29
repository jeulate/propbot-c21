import { obtenerMetricas } from "@/lib/repositories/cierres";
import { TarjetaMetaMensual } from "@/components/tarjeta-meta-mensual";
import { TarjetaMetrica, TarjetaMetricaSaas } from "@/components/tarjeta-metrica";
import { GraficoRanking } from "@/components/grafico-cierres-asesor";
import { GraficoLineaRegistros } from "@/components/grafico-linea-registros";
import type { PeriodoDashboard } from "@/lib/fechas";
import { formatearFechaHoraBolivia } from "@/lib/fechas";
import { SelectorRangoFechas } from "@/components/selector-rango-fechas";
import type { ReactNode } from "react";
import Link from "next/link";

function formatoBs(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 }).format(valor)}`;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { periodo?: string; desde?: string; hasta?: string };
}) {
   const periodo: PeriodoDashboard =
    searchParams?.periodo === "semana" ||
    searchParams?.periodo === "mes" ||
    searchParams?.periodo === "anio" ||
    searchParams?.periodo === "rango"
      ? searchParams.periodo
      : "mes";

  const metricas = await obtenerMetricas(periodo, {
    desde: searchParams?.desde,
    hasta: searchParams?.hasta,
  });
  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Resumen general
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Estado actual de los cierres registrados vía el bot de Telegram.
        </p>
        <p className="mt-1 text-xs text-carbon-500 dark:text-gold-100/40">
          Periodo: {metricas.rango.etiqueta}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SelectorPeriodo periodoActual={periodo} />
        <SelectorRangoFechas />
      </div>
    </header>

      <section className="shadow-panel rounded-xl border border-gold-200 bg-white dark:border-carbon-700 dark:bg-carbon-800">
        <div className="flex items-center justify-between border-b border-gold-200 px-5 py-4 dark:border-carbon-700">
          <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
            Estado Actual de KPI´s
          </h2>
          <p className="text-xs text-carbon-500 dark:text-gold-100/40">
            Comparado con el período anterior
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          <TarjetaMetricaSaas
            etiqueta="Total de cierres"
            valor={String(metricas.totalCierres)}
            variacion={metricas.comparativas.totalCierres.variacionPorcentual}
          />

          <TarjetaMetricaSaas
            etiqueta="Monto total en transacciones"
            valor={formatoBs(metricas.totalTransacciones)}
            variacion={metricas.comparativas.totalTransacciones.variacionPorcentual}
          />

          <TarjetaMetricaSaas
            etiqueta="Comisiones pagadas a oficina"
            valor={formatoBs(metricas.totalComisiones)}
            variacion={metricas.comparativas.totalComisiones.variacionPorcentual}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica
          etiqueta="Pago real a asesores"
          valor={formatoBs(metricas.totalPagosReales)}
        />
        <TarjetaMetrica
          etiqueta="Ticket promedio"
          valor={formatoBs(metricas.ticketPromedio)}
        />
        <TarjetaMetrica
          etiqueta="Comisión promedio"
          valor={formatoBs(metricas.comisionPromedio)}
        />
        <TarjetaMetrica
          etiqueta="Pendientes de revisión"
          valor={String(metricas.pendientesRevision)}
          tono={metricas.pendientesRevision > 0 ? "warn" : "ok"}
          subtexto={metricas.pendientesRevision > 0 ? "Requieren verificación" : "Todo verificado"}
        />
      </section>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <PanelGrafico
            titulo="Evolución de registros"
            descripcion="Visualiza el comportamiento diario de los cierres registrados en el sistema."
          >
            <GraficoLineaRegistros
              datos={metricas.evolucionRegistros}
            />
          </PanelGrafico>
        </div>

        <div className="xl:col-span-4">
          <TarjetaMetaMensual
            meta={metricas.metaMensual}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelGrafico titulo="Top 10 Colocación" descripcion="Ranking por cantidad de cierres registrados.">
          <GraficoRanking
            etiqueta="Cierres"
            datos={metricas.topColocacion.map((a) => ({
              nombre: a.nombre,
              valor: a.cierres,
            }))}
          />
        </PanelGrafico>

        <PanelGrafico titulo="Top 10 Producer" descripcion="Ranking por monto pagado al asesor.">
          <GraficoRanking
            etiqueta="Bs"
            datos={metricas.topProducer.map((a) => ({
              nombre: a.nombre,
              valor: a.valor,
            }))}
          />
        </PanelGrafico>

        <PanelGrafico titulo="Top Captadores" descripcion="Asesores con más cierres como captadores.">
          <GraficoRanking
            etiqueta="Cierres"
            datos={metricas.topCaptadores.map((a) => ({
              nombre: a.nombre,
              valor: a.cierres,
            }))}
          />
        </PanelGrafico>

        <PanelGrafico titulo="Top Colocadores" descripcion="Asesores con más cierres como colocadores.">
          <GraficoRanking
            etiqueta="Cierres"
            datos={metricas.topColocadores.map((a) => ({
              nombre: a.nombre,
              valor: a.cierres,
            }))}
          />
        </PanelGrafico>
      </section>

      <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-carbon-900 dark:text-gold-50">Últimos cierres registrados</h2>
          <Link href="/dashboard/cierres" className="focus-ring text-sm text-gold-600 hover:text-gold-700 dark:text-gold-500 dark:hover:text-gold-300">
            Ver todos →
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gold-200 text-xs uppercase tracking-wide text-carbon-500 dark:border-carbon-700 dark:text-gold-100/40">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Registrado</th>
                <th className="py-2 pr-4">Dirección</th>
                <th className="py-2 pr-4">Tipo</th>
                <th className="py-2 pr-4">Comisión</th>
                <th className="py-2 pr-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {metricas.ultimosCierres.map((c) => (
                <tr key={c.id} className="border-b border-gold-100 text-carbon-700 hover:bg-gold-50 dark:border-carbon-700/50 dark:text-gold-100/80 dark:hover:bg-carbon-800/50">
                  <td className="py-2.5 pr-4 font-mono text-xs">{c.id}</td>
                  <td className="py-2.5 pr-4">{formatearFechaHoraBolivia(c.creadoEn)}</td>
                  <td className="py-2.5 pr-4">{c.direccionInmueble}</td>
                  <td className="py-2.5 pr-4">{c.tipoTransaccion}</td>
                  <td className="py-2.5 pr-4">{formatoBs(c.montoComision)}</td>
                  <td className="py-2.5 pr-4">
                    <EstadoBadge estado={c.estado} />
                  </td>
                </tr>
              ))}
              {metricas.ultimosCierres.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-carbon-500 dark:text-gold-100/40">
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

function SelectorPeriodo({ periodoActual }: { periodoActual: PeriodoDashboard }) {
  const opciones: { valor: PeriodoDashboard; label: string }[] = [
    { valor: "semana", label: "Semana" },
    { valor: "mes", label: "Mes" },
    { valor: "anio", label: "Año" },
  ];

  return (
    <div className="flex w-fit rounded-lg border border-gold-200 bg-white p-1 dark:border-carbon-700 dark:bg-carbon-800">
      {opciones.map((opcion) => (
        <Link
          key={opcion.valor}
          href={`/dashboard?periodo=${opcion.valor}`}
          className={
            periodoActual === opcion.valor
              ? "rounded-md bg-gold-400 px-3 py-1.5 text-sm font-medium text-carbon-950"
              : "rounded-md px-3 py-1.5 text-sm font-medium text-carbon-600 hover:bg-gold-50 dark:text-gold-100/60 dark:hover:bg-carbon-700"
          }
        >
          {opcion.label}
        </Link>
      ))}
    </div>
  );
}

function PanelGrafico({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <h2 className="font-display text-lg font-medium text-carbon-900 dark:text-gold-50">
        {titulo}
      </h2>
      <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
        {descripcion}
      </p>
      <div className="mt-4">{children}</div>
    </section>
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
