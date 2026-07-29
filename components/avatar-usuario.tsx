"use client";

import { useEffect, useState } from "react";
import { clsx } from "clsx";

export function obtenerIniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return "U";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function AvatarUsuario({
  nombre,
  src,
  className,
}: {
  nombre: string;
  src?: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  return (
    <span
      className={clsx(
        "grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-gold-300 font-bold text-carbon-900",
        className,
      )}
    >
      {src && !error ? (
        // La imagen se sirve desde una ruta autenticada.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`Fotografía de ${nombre}`}
          className="h-full w-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        obtenerIniciales(nombre)
      )}
    </span>
  );
}
