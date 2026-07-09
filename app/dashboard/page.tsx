import { obtenerMetricas } from "@/lib/repositories/cierres";
import { TarjetaMetaMensual } from "@/components/tarjeta-meta-mensual";
import { TarjetaObjetivosOficina } from "@/components/tarjeta-objetivos-oficina";
import { TarjetaMetrica, TarjetaMetricaSaas, TarjetaMetricaIcono } from "@/components/tarjeta-metrica";
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

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <SelectorPeriodo periodoActual={periodo} />

        <div className="w-full sm:w-auto">
          <SelectorRangoFechas />
        </div>
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 [&>div]:min-h-[180px] [&>div]:p-5">
          <TarjetaMetricaIcono
            etiqueta="Pago real a asesores"
            valor={formatoBs(metricas.totalPagosReales)}
            subtexto="Total acumulado del período"
            icono={
              <svg
                className="h-6 w-6 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path fill-rule="evenodd" clip-rule="evenodd" d="M8.80443 5.60156C7.59109 5.60156 6.60749 6.58517 6.60749 7.79851C6.60749 9.01185 7.59109 9.99545 8.80443 9.99545C10.0178 9.99545 11.0014 9.01185 11.0014 7.79851C11.0014 6.58517 10.0178 5.60156 8.80443 5.60156ZM5.10749 7.79851C5.10749 5.75674 6.76267 4.10156 8.80443 4.10156C10.8462 4.10156 12.5014 5.75674 12.5014 7.79851C12.5014 9.84027 10.8462 11.4955 8.80443 11.4955C6.76267 11.4955 5.10749 9.84027 5.10749 7.79851ZM4.86252 15.3208C4.08769 16.0881 3.70377 17.0608 3.51705 17.8611C3.48384 18.0034 3.5211 18.1175 3.60712 18.2112C3.70161 18.3141 3.86659 18.3987 4.07591 18.3987H13.4249C13.6343 18.3987 13.7992 18.3141 13.8937 18.2112C13.9797 18.1175 14.017 18.0034 13.9838 17.8611C13.7971 17.0608 13.4132 16.0881 12.6383 15.3208C11.8821 14.572 10.6899 13.955 8.75042 13.955C6.81096 13.955 5.61877 14.572 4.86252 15.3208ZM3.8071 14.2549C4.87163 13.2009 6.45602 12.455 8.75042 12.455C11.0448 12.455 12.6292 13.2009 13.6937 14.2549C14.7397 15.2906 15.2207 16.5607 15.4446 17.5202C15.7658 18.8971 14.6071 19.8987 13.4249 19.8987H4.07591C2.89369 19.8987 1.73504 18.8971 2.05628 17.5202C2.28015 16.5607 2.76117 15.2906 3.8071 14.2549ZM15.3042 11.4955C14.4702 11.4955 13.7006 11.2193 13.0821 10.7533C13.3742 10.3314 13.6054 9.86419 13.7632 9.36432C14.1597 9.75463 14.7039 9.99545 15.3042 9.99545C16.5176 9.99545 17.5012 9.01185 17.5012 7.79851C17.5012 6.58517 16.5176 5.60156 15.3042 5.60156C14.7039 5.60156 14.1597 5.84239 13.7632 6.23271C13.6054 5.73284 13.3741 5.26561 13.082 4.84371C13.7006 4.37777 14.4702 4.10156 15.3042 4.10156C17.346 4.10156 19.0012 5.75674 19.0012 7.79851C19.0012 9.84027 17.346 11.4955 15.3042 11.4955ZM19.9248 19.8987H16.3901C16.7014 19.4736 16.9159 18.969 16.9827 18.3987H19.9248C20.1341 18.3987 20.2991 18.3141 20.3936 18.2112C20.4796 18.1175 20.5169 18.0034 20.4837 17.861C20.2969 17.0607 19.913 16.088 19.1382 15.3208C18.4047 14.5945 17.261 13.9921 15.4231 13.9566C15.2232 13.6945 14.9995 13.437 14.7491 13.1891C14.5144 12.9566 14.262 12.7384 13.9916 12.5362C14.3853 12.4831 14.8044 12.4549 15.2503 12.4549C17.5447 12.4549 19.1291 13.2008 20.1936 14.2549C21.2395 15.2906 21.7206 16.5607 21.9444 17.5202C22.2657 18.8971 21.107 19.8987 19.9248 19.8987Z" fill=""></path>
              </svg>
            }
          />

          <TarjetaMetricaIcono
            etiqueta="Pendientes de revisión"
            valor={String(metricas.pendientesRevision)}
            tono={metricas.pendientesRevision > 0 ? "warn" : "ok"}
            subtexto={
              metricas.pendientesRevision > 0
                ? "Requieren verificación"
                : "Todo verificado"
            }
            icono={
              <svg
                className="h-6 w-6 fill-current"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.625 9.33333L3 9.33333M4.75 14H3M3.875 18.6667H3M9.90222 22.3117H23.0071C23.9027 22.3117 24.6537 21.6356 24.7475 20.7449L26.129 7.62071C26.2378 6.58744 25.4276 5.6875 24.3887 5.6875H11.2838C10.3882 5.6875 9.63716 6.36364 9.5434 7.25429L8.16184 20.3785C8.05307 21.4118 8.86324 22.3117 9.90222 22.3117ZM16.4622 5.6875H19.5793L18.7043 11.508H15.5872L16.4622 5.6875Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
              </svg>
            }
          />
        </div>

        <TarjetaObjetivosOficina objetivos={metricas.objetivosAnualesOficina} />
      </section>
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <PanelGrafico
            titulo="Evolución de registros"
            descripcion="Visualiza el comportamiento diario de los cierres registrados en el sistema."
          >
            <GraficoLineaRegistros datos={metricas.evolucionRegistros} />
          </PanelGrafico>
        </div>

        <div className="xl:col-span-4">
          <TarjetaMetaMensual meta={metricas.metaMensual} />
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

        <PanelGrafico titulo="Top Captaciones" descripcion="Ranking mensual de captaciones por asesor.">
          <GraficoRanking
            etiqueta="Captaciones"
            tooltipLabel="Captaciones"
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
    <div className="grid w-full grid-cols-3 rounded-lg sm:flex sm:w-fit border border-gold-200 bg-white p-1 dark:border-carbon-700 dark:bg-carbon-800">
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
