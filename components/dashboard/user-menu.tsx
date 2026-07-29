"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { RolUsuarioAdmin } from "@/types/domain";

const ETIQUETAS_ROL: Record<RolUsuarioAdmin, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  LECTOR: "Consulta",
};

function obtenerIniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "U";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export function UserMenu({
  nombre,
  rol,
}: {
  nombre: string;
  rol: RolUsuarioAdmin;
}) {
  const router = useRouter();
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    function cerrarAlHacerClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node))
        setAbierto(false);
    }

    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAbierto(false);
    }

    document.addEventListener("mousedown", cerrarAlHacerClicFuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarAlHacerClicFuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, []);

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        className="focus-ring flex items-center gap-2 rounded-xl border border-gold-200 bg-white/60 p-1.5 pr-2 text-left transition-colors hover:bg-gold-100 dark:border-carbon-700 dark:bg-carbon-800/70 dark:hover:bg-carbon-700"
        aria-expanded={abierto}
        aria-haspopup="menu"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold-300 text-sm font-bold text-carbon-900">
          {obtenerIniciales(nombre)}
        </span>
        <span className="hidden min-w-0 lg:block">
          <span className="block max-w-40 truncate text-sm font-semibold">
            {nombre}
          </span>
          <span className="block text-xs text-carbon-500 dark:text-gold-100/55">
            {ETIQUETAS_ROL[rol]}
          </span>
        </span>
        <ChevronDown
          size={16}
          className={clsx(
            "hidden transition-transform sm:block",
            abierto && "rotate-180",
          )}
        />
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-xl border border-gold-200 bg-white p-2 shadow-xl dark:border-carbon-700 dark:bg-carbon-900"
        >
          <div className="border-b border-gold-200 px-3 py-2 dark:border-carbon-700">
            <p className="truncate text-sm font-semibold">{nombre}</p>
            <p className="text-xs text-carbon-500 dark:text-gold-100/55">
              {ETIQUETAS_ROL[rol]}
            </p>
          </div>

          <div className="my-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-carbon-500 dark:text-gold-100/45">
            <UserRound size={17} />
            Perfil disponible en el siguiente bloque
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={cerrarSesion}
            className="focus-ring flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-carbon-700 transition-colors hover:bg-gold-100 hover:text-signal-danger dark:text-gold-100/75 dark:hover:bg-carbon-800 dark:hover:text-signal-danger"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
