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
      <p className="text-xs uppercase tracking-wide text-gold-100/50">{etiqueta}</p>
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
