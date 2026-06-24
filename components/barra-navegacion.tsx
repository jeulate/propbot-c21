"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  FileSpreadsheet,
  Users,
  LogOut,
  ShieldCheck,
  SlidersHorizontal,
  Menu,
  X,
} from "lucide-react";
import type { RolUsuarioAdmin } from "@/types/domain";
import { ThemeToggle } from "@/components/theme-toggle";

const ENLACES = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/cierres", label: "Cierres", icon: FileSpreadsheet },
  { href: "/dashboard/asesores", label: "Asesores", icon: Users, soloGestion: true },
  { href: "/dashboard/configuracion", label: "Configuración", icon: SlidersHorizontal, soloGestion: true },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: ShieldCheck, soloAdmin: true },
];

export function BarraNavegacion({ nombre, rol }: { nombre: string; rol: RolUsuarioAdmin }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-gold-200 bg-gold-50/95 px-4 py-3 backdrop-blur dark:border-carbon-700 dark:bg-carbon-900/95 md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
              Century 21
            </p>
            <p className="font-display text-base font-semibold text-carbon-900 dark:text-gold-50">
              Rita Quiroga
            </p>
          </div>

          <button
            onClick={() => setMenuAbierto((prev) => !prev)}
            className="focus-ring rounded-md border border-gold-300 bg-gold-100 p-2 text-carbon-900 dark:border-carbon-600 dark:bg-carbon-800 dark:text-gold-100"
            aria-label={menuAbierto ? "Cerrar menu" : "Abrir menu"}
            aria-expanded={menuAbierto}
          >
            {menuAbierto ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {menuAbierto && (
        <button
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-30 bg-carbon-950/40 backdrop-blur-sm dark:bg-carbon-950/70 md:hidden"
          aria-label="Cerrar menu"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gold-200 bg-gold-50 px-4 py-6 transition-transform duration-200 dark:border-carbon-700 dark:bg-carbon-900 md:sticky md:top-0 md:z-10 md:h-screen md:w-64 md:translate-x-0",
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 px-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
            Century 21
          </p>
          <p className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
            Rita Quiroga
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {ENLACES.filter((e) => {
            if (e.soloAdmin) return rol === "ADMIN";
            if (e.soloGestion) return rol === "ADMIN" || rol === "SUPERVISOR";
            return true;
          }).map(({ href, label, icon: Icon }) => {
            const activo = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "focus-ring flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  activo
                    ? "bg-gold-200 text-carbon-900 dark:bg-gold-500/15 dark:text-gold-300"
                    : "text-carbon-700 hover:bg-gold-100 hover:text-carbon-900 dark:text-gold-100/70 dark:hover:bg-carbon-800 dark:hover:text-gold-100"
                )}
              >
                <Icon size={18} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-gold-200 pt-4 dark:border-carbon-700">
          <p className="px-2 text-sm font-medium text-carbon-900 dark:text-gold-100">
            {nombre}
          </p>
          <p className="px-2 text-xs text-carbon-500 dark:text-gold-100/50">
            {rol}
          </p>

          <button
            onClick={cerrarSesion}
            className="focus-ring mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-carbon-600 transition-colors hover:bg-gold-100 hover:text-signal-danger dark:text-gold-100/60 dark:hover:bg-carbon-800 dark:hover:text-signal-danger"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Cerrar sesión
          </button>

          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}