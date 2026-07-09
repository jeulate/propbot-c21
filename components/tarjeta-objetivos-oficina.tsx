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

function ObjetivoRadial({
  titulo,
  imagen,
  objetivo,
  esDark,
}: {
  titulo: string;
  imagen: string;
  esDark: boolean;
  objetivo: {
    objetivo: number;
    actual: number;
    porcentaje: number;
    faltante: number;
    alcanzado: boolean;
  };
}) {
  const porcentaje = Math.min(Math.max(objetivo.porcentaje, 0), 100);

  const options: ApexOptions = {
    chart: {
      type: "radialBar",
      fontFamily: "Outfit, sans-serif",
      sparkline: { enabled: true },
    },
    colors: ["#BEAF87"],
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: "72%" },
        track: {
          background: esDark ? "#43454b" : "#E6E7E8",
          strokeWidth: "100%",
        },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: -2,
            fontSize: "22px",
            fontWeight: 700,
            color: esDark ? "#F9F8F3" : "#252526",
            formatter: (value) => `${Number(value).toFixed(1)}%`,
          },
        },
      },
    },
    stroke: { lineCap: "round" },
    labels: ["Avance"],
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-gold-50 p-4 dark:bg-carbon-900">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-carbon-900 dark:text-gold-50">
            {titulo}
          </p>
          <p className="mt-1 text-xs text-carbon-500 dark:text-gold-100/45">
            Meta: {formatoBs(objetivo.objetivo)}
          </p>
        </div>
      </div>

      <div className="relative z-10 mt-3">
        <Chart options={options} series={[porcentaje]} type="radialBar" height={170} />

        <img
          src={imagen}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[52%] h-20 w-20 -translate-x-1/2 -translate-y-1/2 object-contain opacity-90 drop-shadow-xl"
        />
      </div>

      <div className="relative z-10 mt-2 rounded-lg bg-white/80 px-3 py-2 dark:bg-carbon-800/80">
        <div className="flex items-center justify-between text-xs">
          <span className="text-carbon-600 dark:text-gold-100/60">
            {objetivo.alcanzado ? "Meta alcanzada" : "Faltante"}
          </span>
          <span className="font-semibold text-carbon-900 dark:text-gold-50">
            {objetivo.alcanzado ? "Completado" : formatoBs(objetivo.faltante)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function TarjetaObjetivosOficina({
  objetivos,
}: {
  objetivos: {
    anio: number;
    comisionAnualOficina: number;
    centurion: {
      objetivo: number;
      actual: number;
      porcentaje: number;
      faltante: number;
      alcanzado: boolean;
    };
    dobleCenturion: {
      objetivo: number;
      actual: number;
      porcentaje: number;
      faltante: number;
      alcanzado: boolean;
    };
    grandCenturion: {
      objetivo: number;
      actual: number;
      porcentaje: number;
      faltante: number;
      alcanzado: boolean;
    };
  };
}) {
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

  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
            Objetivos anuales de oficina
          </h2>
          <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
            Avance acumulado {objetivos.anio} según comisiones pagadas a oficina.
          </p>
        </div>

        <div className="mt-3 rounded-xl bg-gold-50 px-4 py-3 dark:bg-carbon-900 sm:mt-0">
          <p className="text-xs uppercase tracking-wide text-carbon-500 dark:text-gold-100/40">
            Acumulado anual
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-carbon-900 dark:text-gold-50">
            {formatoBs(objetivos.comisionAnualOficina)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ObjetivoRadial
          titulo="Centurion"
          imagen="/images/objetivos/centurion.png"
          objetivo={objetivos.centurion}
          esDark={esDark}
        />

        <ObjetivoRadial
          titulo="Doble Centurion"
          imagen="/images/objetivos/doble-centurion.png"
          objetivo={objetivos.dobleCenturion}
          esDark={esDark}
        />

        <ObjetivoRadial
          titulo="Grand Centurion"
          imagen="/images/objetivos/grand-centurion.png"
          objetivo={objetivos.grandCenturion}
          esDark={esDark}
        />
      </div>
    </section>
  );
}