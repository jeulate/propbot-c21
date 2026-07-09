function formatoBs(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

function BarraObjetivo({
  titulo,
  objetivo,
}: {
  titulo: string;
  objetivo: {
    objetivo: number;
    actual: number;
    porcentaje: number;
    faltante: number;
    alcanzado: boolean;
  };
}) {
  return (
    <div className="rounded-xl border border-gold-200 bg-gold-50 p-4 dark:border-carbon-700 dark:bg-carbon-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-carbon-900 dark:text-gold-50">
            {titulo}
          </p>
          <p className="mt-1 text-xs text-carbon-500 dark:text-gold-100/50">
            Meta: {formatoBs(objetivo.objetivo)}
          </p>
        </div>

        <span
          className={
            objetivo.alcanzado
              ? "rounded-full bg-signal-ok/15 px-2.5 py-1 text-xs font-semibold text-signal-ok"
              : "rounded-full bg-gold-200 px-2.5 py-1 text-xs font-semibold text-carbon-800 dark:bg-carbon-700 dark:text-gold-100"
          }
        >
          {objetivo.porcentaje.toFixed(1)}%
        </span>
      </div>

      <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white dark:bg-carbon-800">
        <div
          className="h-full rounded-full bg-gold-500"
          style={{ width: `${objetivo.porcentaje}%` }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-carbon-600 dark:text-gold-100/60">
          {objetivo.alcanzado ? "Meta alcanzada" : "Faltante"}
        </span>
        <span className="font-semibold text-carbon-900 dark:text-gold-50">
          {objetivo.alcanzado ? "Completado" : formatoBs(objetivo.faltante)}
        </span>
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
  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div className="mb-5 flex flex-col gap-1">
        <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
          Objetivos anuales de oficina
        </h2>
        <p className="text-sm text-carbon-600 dark:text-gold-100/50">
          Avance acumulado {objetivos.anio} según comisiones pagadas a oficina.
        </p>
      </div>

      <div className="mb-5 rounded-xl bg-gold-50 px-4 py-3 dark:bg-carbon-900">
        <p className="text-xs uppercase tracking-wide text-carbon-500 dark:text-gold-100/40">
          Comisión acumulada anual
        </p>
        <p className="mt-1 font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          {formatoBs(objetivos.comisionAnualOficina)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <BarraObjetivo titulo="Centurion" objetivo={objetivos.centurion} />
        <BarraObjetivo titulo="Doble Centurion" objetivo={objetivos.dobleCenturion} />
        <BarraObjetivo titulo="Grand Centurion" objetivo={objetivos.grandCenturion} />
      </div>
    </section>
  );
}