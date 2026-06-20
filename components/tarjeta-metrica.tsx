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
    <div className="shadow-panel rounded-xl border border-carbon-700 bg-carbon-800 p-5">
      <p className="text-xs uppercase tracking-wide text-gold-100/50">{etiqueta}</p>
      <p
        className={clsx(
          "font-display mt-2 text-3xl font-semibold",
          tono === "warn" && "text-signal-warn",
          tono === "ok" && "text-signal-ok",
          tono === "default" && "text-gold-50"
        )}
      >
        {valor}
      </p>
      {subtexto && <p className="mt-1 text-xs text-gold-100/40">{subtexto}</p>}
    </div>
  );
}
