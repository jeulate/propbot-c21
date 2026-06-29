"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Flatpickr from "react-flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es.js";

function formatoInput(fecha?: string | null) {
  return fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : "";
}

function formatoFechaUrl(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function formatearFechaVisible(fechaISO?: string) {
  if (!fechaISO) return "";

  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);

  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(fecha);
}

export function SelectorRangoFechas() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const desde = formatoInput(searchParams.get("desde"));
  const hasta = formatoInput(searchParams.get("hasta"));

  const valorVisible =
    desde && hasta
      ? `${formatearFechaVisible(desde)} - ${formatearFechaVisible(hasta)}`
      : "";

  return (
    <Flatpickr
      value={desde && hasta ? [desde, hasta] : []}
      options={{
        mode: "range",
        dateFormat: "Y-m-d",
        locale: Spanish,
        allowInput: false,
        disableMobile: true,
        appendTo: typeof window !== "undefined" ? document.body : undefined,
        position: "auto right",
      }}
      onChange={(fechas) => {
        if (fechas.length !== 2) return;

        const desdeSeleccionado = formatoFechaUrl(fechas[0]);
        const hastaSeleccionado = formatoFechaUrl(fechas[1]);

        router.push(
          `/dashboard?periodo=rango&desde=${desdeSeleccionado}&hasta=${hastaSeleccionado}`
        );
      }}
      render={(_, ref) => (
        <div className="relative w-full sm:w-64">
          <input
            ref={ref}
            readOnly
            value={valorVisible}
            placeholder="Rango de fechas"
            className="focus-ring w-full cursor-pointer rounded-lg border border-gold-200 bg-white px-4 py-2.5 pr-10 text-sm font-medium text-carbon-700 placeholder:text-carbon-400 dark:border-carbon-700 dark:bg-carbon-800 dark:text-gold-50 dark:placeholder:text-gold-100/40"
          />

          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-carbon-500 dark:text-gold-100/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3M5 11h14M6 5h12a1 1 0 011 1v13a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1z"
              />
            </svg>
          </div>
        </div>
      )}
    />
  );
}