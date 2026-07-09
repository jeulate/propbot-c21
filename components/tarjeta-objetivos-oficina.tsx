function formatoBs(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

function ObjetivoCard({
  titulo,
  imagen,
  objetivo,
}: {
  titulo: string;
  imagen: string;
  objetivo: {
    objetivo: number;
    actual: number;
    porcentaje: number;
    faltante: number;
    alcanzado: boolean;
  };
}) {
  const porcentaje = Math.min(Math.max(objetivo.porcentaje, 0), 100);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gold-50 p-4 dark:bg-carbon-900">
      <div className="relative z-10 grid grid-cols-[1fr_90px] gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-sm font-semibold text-carbon-900 dark:text-gold-50">
                {titulo}
              </p>
              <p className="mt-1 text-xs text-carbon-500 dark:text-gold-100/45">
                Meta: {formatoBs(objetivo.objetivo)}
              </p>
            </div>

            <span className="rounded-full bg-gold-200 px-2.5 py-1 text-xs font-semibold text-carbon-800 dark:bg-carbon-700 dark:text-gold-100">
              {porcentaje.toFixed(1)}%
            </span>
          </div>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white dark:bg-carbon-800">
            <div
              className="h-full rounded-full bg-gold-500 transition-all"
              style={{ width: `${porcentaje}%` }}
            />
          </div>

          <div className="mt-4 rounded-lg bg-white/85 px-3 py-2 dark:bg-carbon-800/85">
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-carbon-600 dark:text-gold-100/60">
                {objetivo.alcanzado ? "Meta alcanzada" : "Faltante"}
              </span>
              <span className="text-right font-semibold text-carbon-900 dark:text-gold-50">
                {objetivo.alcanzado ? "Completado" : formatoBs(objetivo.faltante)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-center">
          <img
            src={imagen}
            alt=""
            aria-hidden="true"
            className="h-28 w-28 object-contain drop-shadow-2xl"
          />
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
  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
            Objetivos anuales de oficina
          </h2>
          <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
            Avance acumulado {objetivos.anio} según comisiones pagadas a oficina.
          </p>
        </div>

        <div className="rounded-xl bg-gold-50 px-4 py-3 dark:bg-carbon-900">
          <p className="text-xs uppercase tracking-wide text-carbon-500 dark:text-gold-100/40">
            Acumulado anual
          </p>
          <p className="mt-1 font-display text-xl font-semibold text-carbon-900 dark:text-gold-50">
            {formatoBs(objetivos.comisionAnualOficina)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ObjetivoCard
          titulo="Centurion"
          imagen="/images/objetivos/centurion.png"
          objetivo={objetivos.centurion}
        />

        <ObjetivoCard
          titulo="Doble Centurion"
          imagen="/images/objetivos/doble-centurion.png"
          objetivo={objetivos.dobleCenturion}
        />

        <ObjetivoCard
          titulo="Grand Centurion"
          imagen="/images/objetivos/grand-centurion.png"
          objetivo={objetivos.grandCenturion}
        />
      </div>
    </section>
  );
}