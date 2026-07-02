"use client";

import { useState } from "react";

export function ComprobantePagoPreview({ fileId }: { fileId: string }) {
  const [abierto, setAbierto] = useState(false);
  const src = `/api/telegram/file/${encodeURIComponent(fileId)}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="mt-3 block overflow-hidden rounded-lg border border-gold-200 dark:border-carbon-700"
      >
        <img
          src={src}
          alt="Comprobante de pago"
          className="max-h-80 w-full object-contain"
        />
      </button>

      {abierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setAbierto(false)}
        >
          <img
            src={src}
            alt="Comprobante de pago ampliado"
            className="max-h-[92vh] max-w-[92vw] rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}