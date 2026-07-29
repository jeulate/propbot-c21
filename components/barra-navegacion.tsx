"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  FileSpreadsheet,
  LayoutDashboard,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import type { RolUsuarioAdmin } from "@/types/domain";

const ENLACES = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/cierres", label: "Cierres", icon: FileSpreadsheet },
  {
    href: "/dashboard/asesores",
    label: "Asesores",
    icon: Users,
    soloGestion: true,
  },
  {
    href: "/dashboard/configuracion",
    label: "Configuración",
    icon: SlidersHorizontal,
    soloGestion: true,
  },
  {
    href: "/dashboard/usuarios",
    label: "Usuarios",
    icon: ShieldCheck,
    soloAdmin: true,
  },
];

interface BarraNavegacionProps {
  nombre: string;
  rol: RolUsuarioAdmin;
  contraido: boolean;
  expandidoTemporalmente: boolean;
  menuMovilAbierto: boolean;
  onCerrarMenuMovil: () => void;
  onEntrarSidebar: () => void;
  onSalirSidebar: () => void;
}

export function BarraNavegacion({
  nombre,
  rol,
  contraido,
  expandidoTemporalmente,
  menuMovilAbierto,
  onCerrarMenuMovil,
  onEntrarSidebar,
  onSalirSidebar,
}: BarraNavegacionProps) {
  const pathname = usePathname();
  const compacto = contraido && !expandidoTemporalmente;

  useEffect(() => {
    onCerrarMenuMovil();
  }, [pathname, onCerrarMenuMovil]);

  const enlacesVisibles = ENLACES.filter((enlace) => {
    if (enlace.soloAdmin) return rol === "ADMIN";
    if (enlace.soloGestion) return rol === "ADMIN" || rol === "SUPERVISOR";
    return true;
  });

  return (
    <>
      {menuMovilAbierto && (
        <button
          type="button"
          onClick={onCerrarMenuMovil}
          className="fixed inset-0 z-40 bg-carbon-950/50 backdrop-blur-sm md:hidden"
          aria-label="Cerrar menú de navegación"
        />
      )}

      <aside
        onMouseEnter={onEntrarSidebar}
        onMouseLeave={onSalirSidebar}
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-gold-200 bg-gold-50 px-3 py-5 shadow-xl transition-[transform,width] duration-300 dark:border-carbon-700 dark:bg-carbon-900 md:translate-x-0 md:shadow-none",
          menuMovilAbierto ? "translate-x-0" : "-translate-x-full",
          compacto ? "md:w-20" : "md:w-64",
          expandidoTemporalmente && "md:shadow-xl",
        )}
      >
        <div
          className={clsx(
            "mb-8 flex h-10 items-center",
            compacto ? "md:justify-center" : "px-2",
          )}
        >
          <div className={clsx("min-w-0", compacto && "md:hidden")}>
            <p className="text-[11px] uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
              Century 21
            </p>
            <p className="truncate font-display text-lg font-semibold">
              Rita Quiroga
            </p>
          </div>
          <span
            className={clsx(
              "hidden h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-300 font-display font-bold text-carbon-900",
              compacto && "md:grid",
            )}
            title="Century 21 Rita Quiroga"
          >
            21
          </span>
          <button
            type="button"
            onClick={onCerrarMenuMovil}
            className="focus-ring ml-auto rounded-lg p-2 hover:bg-gold-100 dark:hover:bg-carbon-800 md:hidden"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav
          className="flex flex-1 flex-col gap-1"
          aria-label="Navegación principal"
        >
          {enlacesVisibles.map(({ href, label, icon: Icon }) => {
            const activo =
              href === "/dashboard"
                ? pathname === href
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                title={compacto ? label : undefined}
                aria-label={label}
                className={clsx(
                  "focus-ring flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors",
                  compacto ? "md:justify-center md:px-0" : "gap-3",
                  activo
                    ? "bg-gold-200 text-carbon-900 dark:bg-gold-500/15 dark:text-gold-300"
                    : "text-carbon-700 hover:bg-gold-100 hover:text-carbon-900 dark:text-gold-100/70 dark:hover:bg-carbon-800 dark:hover:text-gold-100",
                )}
              >
                <Icon size={19} strokeWidth={1.75} className="shrink-0" />
                <span className={clsx("truncate", compacto && "md:hidden")}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={clsx(
            "border-t border-gold-200 pt-4 dark:border-carbon-700",
            compacto && "md:text-center",
          )}
        >
          <div className={clsx("px-2", compacto && "md:hidden")}>
            <p className="truncate text-sm font-medium">{nombre}</p>
            <p className="text-xs text-carbon-500 dark:text-gold-100/50">
              {rol}
            </p>
          </div>
          <span
            className={clsx(
              "hidden text-[10px] font-semibold text-carbon-500 dark:text-gold-100/50",
              compacto && "md:block",
            )}
          >
            {rol.slice(0, 3)}
          </span>
        </div>
      </aside>
    </>
  );
}
