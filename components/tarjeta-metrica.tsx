import { clsx } from "clsx";

export function TarjetaMetrica({
  etiqueta,
  valor,
  subtexto,
  tono = "default",
}: {
  etiqueta: string;
  valor: string;
  subtexto?: string;
  tono?: "default" | "warn" | "ok";
}) {
  return (
    <div className="shadow-panel rounded-xl border border-gold-200 bg-white p-5 dark:border-carbon-700 dark:bg-carbon-800">
      <p className="text-xs uppercase tracking-wide text-carbon-600 dark:text-gold-100/50">{etiqueta}</p>
      <p
        className={clsx(
          "font-display mt-2 text-3xl font-semibold",
          tono === "warn" && "text-signal-warn",
          tono === "ok" && "text-signal-ok",
          tono === "default" && "text-carbon-900 dark:text-gold-50"
        )}
      >
        {valor}
      </p>
      {subtexto && <p className="mt-1 text-xs text-carbon-600 dark:text-gold-100/50">{subtexto}</p>}
    </div>
  );
}

export function TarjetaMetricaSaas({
  etiqueta,
  valor,
  variacion,
}: {
  etiqueta: string;
  valor: string;
  variacion: number;
}) {
  const esPositivo = variacion >= 0;

  return (
    <div className="border-b border-gold-200 p-5 last:border-b-0 dark:border-carbon-700 md:border-b-0 md:border-r md:last:border-r-0">
      <p className="text-sm font-medium text-carbon-600 dark:text-gold-100/60">
        {etiqueta}
      </p>

      <div className="mt-3 flex items-center gap-3">
        <p className="font-display text-3xl font-semibold text-carbon-900 dark:text-gold-50">
          {valor}
        </p>

        <span
          className={clsx(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            esPositivo
              ? "bg-signal-ok/15 text-signal-ok"
              : "bg-signal-danger/15 text-signal-danger"
          )}
        >
          {esPositivo ? "+" : ""}
          {variacion.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
