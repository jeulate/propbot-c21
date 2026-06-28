"use client";

import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export function GraficoLineaRegistros({
  datos,
}: {
  datos: { etiqueta: string; cierres: number }[];
}) {
  if (datos.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-carbon-500 dark:text-gold-100/40">
        Todavía no hay registros en este período.
      </p>
    );
  }

  const options: ApexOptions = {
    chart: {
      type: "area",
      height: 350,
      fontFamily: "Outfit, sans-serif",
      toolbar: {
        show: false,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
        allowMouseWheelZoom: true,
      },
      selection: {
        enabled: true,
        type: "x",
      },
    },
    colors: ["#BEAF87"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.45,
        opacityTo: 0,
        stops: [0, 90, 100],
      },
    },
    grid: {
      borderColor: "rgba(190, 175, 135, 0.18)",
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories: datos.map((d) => d.etiqueta),
      labels: {
        style: {
          colors: "#A19276",
          fontSize: "12px",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      decimalsInFloat: 0,
      labels: {
        style: {
          colors: "#A19276",
          fontSize: "12px",
        },
      },
    },
    tooltip: {
      theme: "dark",
      x: {
        show: true,
      },
      y: {
        formatter: (value) => `${Math.round(value)} cierres`,
      },
    },
    markers: {
      size: 0,
      strokeWidth: 2,
      hover: {
        size: 5,
      },
    },
    noData: {
      text: "Sin registros para este período",
    },
  };

  const series = [
    {
      name: "Cierres registrados",
      data: datos.map((d) => d.cierres),
    },
  ];

  return (
    <div className="w-full">
      <Chart options={options} series={series} type="area" height={350} />
    </div>
  );
}