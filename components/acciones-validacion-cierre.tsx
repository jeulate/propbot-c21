"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccionesValidacionCierre({
  cierreId,
  verificarAction,
  rechazarAction,
}: {
  cierreId: string;
  verificarAction: (formData: FormData) => Promise<void>;
  rechazarAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [confirmarRechazo, setConfirmarRechazo] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  async function confirmarRechazoAction(formData: FormData) {
    if (motivoRechazo.trim().length < 3) return;
    setProcesando(true);
    await rechazarAction(formData);
    setConfirmarRechazo(false);
    router.refresh();
    setProcesando(false);
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-3">
      <form action={verificarAction}>
        <input type="hidden" name="id" value={cierreId} />
        <button
          type="submit"
          disabled={procesando}
          className="focus-ring w-full rounded-md bg-signal-ok px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          Verificar cierre
        </button>
      </form>

      <button
        type="button"
        onClick={() => setConfirmarRechazo(true)}
        disabled={procesando}
        className="focus-ring w-full rounded-md bg-signal-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        Rechazar cierre
      </button>

      {confirmarRechazo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gold-200 bg-white p-6 shadow-xl dark:border-carbon-700 dark:bg-carbon-800">
            <h3 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
              Confirmar rechazo
            </h3>

            <p className="mt-2 text-sm text-carbon-600 dark:text-gold-100/60">
              Este cierre será marcado como rechazado y no contará en el dashboard, KPIs ni rankings.
            </p>

            <label className="mt-4 block text-sm font-medium text-carbon-800 dark:text-gold-50">
              Motivo del rechazo
              <textarea
                name="motivoRechazo"
                form="form-rechazo-cierre"
                required
                minLength={3}
                maxLength={500}
                value={motivoRechazo}
                onChange={(event) => setMotivoRechazo(event.target.value)}
                className="focus-ring mt-2 min-h-24 w-full rounded-md border border-gold-300 bg-white p-3 text-sm dark:border-carbon-600 dark:bg-carbon-900"
              />
            </label>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmarRechazo(false)}
                disabled={procesando}
                className="focus-ring flex-1 rounded-md border border-gold-300 px-4 py-2.5 text-sm font-medium text-carbon-800 hover:bg-gold-50 disabled:opacity-60 dark:border-carbon-600 dark:text-gold-50 dark:hover:bg-carbon-700"
              >
                Cancelar
              </button>

              <form id="form-rechazo-cierre" action={confirmarRechazoAction} className="flex-1">
                <input type="hidden" name="id" value={cierreId} />
                <button
                  type="submit"
                  disabled={procesando || motivoRechazo.trim().length < 3}
                  className="focus-ring w-full rounded-md bg-signal-danger px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                >
                  {procesando ? "Rechazando..." : "Sí, rechazar"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}