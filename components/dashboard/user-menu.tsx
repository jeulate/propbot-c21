"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import type { RolUsuarioAdmin } from "@/types/domain";
import type { UsuarioPublico } from "@/types/usuario";
import { AvatarUsuario } from "@/components/avatar-usuario";
import {
  EVENTO_PERFIL_ACTUALIZADO,
  type DetallePerfilActualizado,
} from "@/components/eventos-perfil";

const ETIQUETAS_ROL: Record<RolUsuarioAdmin, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  LECTOR: "Consulta",
};

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
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(Date.now());

  useEffect(() => {
    let activo = true;

    async function cargarPerfil() {
      try {
        const respuesta = await fetch("/api/perfil", { cache: "no-store" });
        const data = respuesta.ok ? await respuesta.json() : null;
        if (activo && data?.usuario) setUsuario(data.usuario);
      } catch {
        // El encabezado conserva los datos recibidos por props.
      }
    }

    function sincronizar(evento: Event) {
      const detalle = (evento as CustomEvent<DetallePerfilActualizado>).detail;
      if (detalle?.usuario) setUsuario(detalle.usuario);
      setAvatarVersion(detalle?.avatarVersion ?? Date.now());
      if (!detalle?.usuario) void cargarPerfil();
    }

    void cargarPerfil();
    window.addEventListener(EVENTO_PERFIL_ACTUALIZADO, sincronizar);
    return () => {
      activo = false;
      window.removeEventListener(EVENTO_PERFIL_ACTUALIZADO, sincronizar);
    };
  }, []);

  useEffect(() => {
    function cerrarAlHacerClicFuera(evento: MouseEvent) {
      if (!contenedorRef.current?.contains(evento.target as Node)) {
        setAbierto(false);
      }
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

  const nombreVisible = usuario?.nombre || nombre;
  const rolVisible = usuario?.rol || rol;
  const avatarSrc = usuario?.avatarPathname
    ? `/api/perfil/avatar?v=${avatarVersion}`
    : undefined;

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((actual) => !actual)}
        className="focus-ring flex items-center gap-2 rounded-xl border border-gold-200 bg-white/60 p-1.5 pr-2 text-left transition-colors hover:bg-gold-100 dark:border-carbon-700 dark:bg-carbon-800/70 dark:hover:bg-carbon-700"
        aria-expanded={abierto}
        aria-haspopup="menu"
      >
        <AvatarUsuario
          nombre={nombreVisible}
          src={avatarSrc}
          className="h-9 w-9 rounded-lg text-sm"
        />
        <span className="hidden min-w-0 lg:block">
          <span className="block max-w-40 truncate text-sm font-semibold">
            {nombreVisible}
          </span>
          <span className="block text-xs text-carbon-500 dark:text-gold-100/55">
            {ETIQUETAS_ROL[rolVisible]}
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
            <p className="truncate text-sm font-semibold">{nombreVisible}</p>
            <p className="truncate text-xs text-carbon-500 dark:text-gold-100/55">
              {usuario?.cargo || ETIQUETAS_ROL[rolVisible]}
            </p>
          </div>
          <Link
            href="/dashboard/perfil"
            role="menuitem"
            onClick={() => setAbierto(false)}
            className="focus-ring my-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-carbon-700 hover:bg-gold-100 dark:text-gold-100/75 dark:hover:bg-carbon-800"
          >
            <UserRound size={17} />
            Mi perfil
          </Link>
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
