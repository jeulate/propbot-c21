"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

function formatoBs(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function TarjetaMetaMensual({
  meta,
}: {
  meta: {
    anio: number;
    mes: number;
    objetivo: number;
    objetivoAnterior: number;
    actual: number;
    porcentaje: number;
    faltante: number;
    excedente: number;
    variacionObjetivoVsMesAnterior: number;
    configurada: boolean;
  };
}) {
  const porcentajeVisual = Math.min(Math.max(meta.porcentaje, 0), 100);
  const mesNombre = MESES[meta.mes - 1] ?? String(meta.mes);
  const variacionPositiva = meta.variacionObjetivoVsMesAnterior >= 0;
  const [esDark, setEsDark] = useState(false);

    useEffect(() => {
    const actualizarTema = () => {
        setEsDark(document.documentElement.classList.contains("dark"));
    };

    actualizarTema();

    const observer = new MutationObserver(actualizarTema);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
    });

    return () => observer.disconnect();
    }, []);

  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      fontFamily: "Outfit, sans-serif",
      sparkline: {
        enabled: true,
      },
    },
    colors: ["#BEAF87"],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: {
          size: "72%",
        },
        track: {
          background: "#E6E7E8",
          strokeWidth: "100%",
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            offsetY: -2,
            fontSize: "28px",
            fontWeight: 700,
            color: esDark ? "#F9F8F3" : "#252526",
            formatter: (value) => `${Number(value).toFixed(1)}%`,
          },
        },
      },
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Avance"],
  };

  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
            Meta mensual
          </h2>
          <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
            {mesNombre} {meta.anio}
          </p>
        </div>

        <span
          className={
            variacionPositiva
              ? "rounded-full bg-signal-ok/15 px-2.5 py-1 text-xs font-semibold text-signal-ok"
              : "rounded-full bg-signal-danger/15 px-2.5 py-1 text-xs font-semibold text-signal-danger"
          }
        >
          {variacionPositiva ? "+" : ""}
          {meta.variacionObjetivoVsMesAnterior.toFixed(1)}%
        </span>
      </div>

      <div className="mt-5">
        {meta.configurada ? (
          <Chart
            options={options}
            series={[porcentajeVisual]}
            type="radialBar"
            height={240}
          />
        ) : (
          <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-gold-300 bg-gold-50 text-center dark:border-carbon-600 dark:bg-carbon-900">
            <div>
              <p className="font-medium text-carbon-800 dark:text-gold-50">
                Meta no configurada
              </p>
              <p className="mt-1 text-sm text-carbon-500 dark:text-gold-100/50">
                Registra una meta mensual desde Configuración.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
        <div className="flex items-center justify-between rounded-lg bg-gold-50 px-4 py-3 dark:bg-carbon-900">
          <span className="text-carbon-600 dark:text-gold-100/60">
            Meta
          </span>
          <span className="font-semibold text-carbon-900 dark:text-gold-50">
            {formatoBs(meta.objetivo)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gold-50 px-4 py-3 dark:bg-carbon-900">
          <span className="text-carbon-600 dark:text-gold-100/60">
            Avance
          </span>
          <span className="font-semibold text-carbon-900 dark:text-gold-50">
            {formatoBs(meta.actual)}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-gold-50 px-4 py-3 dark:bg-carbon-900">
          <span className="text-carbon-600 dark:text-gold-100/60">
            {meta.excedente > 0 ? "Excedente" : "Faltante"}
          </span>
          <span className="font-semibold text-carbon-900 dark:text-gold-50">
            {formatoBs(meta.excedente > 0 ? meta.excedente : meta.faltante)}
          </span>
        </div>
      </div>
    </section>
  );
}