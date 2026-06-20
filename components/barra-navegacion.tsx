"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { LayoutDashboard, FileSpreadsheet, Users, LogOut, ShieldCheck, Menu, X } from "lucide-react";
import type { RolUsuarioAdmin } from "@/types/domain";

const ENLACES = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/cierres", label: "Cierres", icon: FileSpreadsheet },
  { href: "/dashboard/asesores", label: "Asesores", icon: Users, soloGestion: true },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: ShieldCheck, soloAdmin: true },
];

export function BarraNavegacion({
  nombre,
  rol,
}: {
  nombre: string;
  rol: RolUsuarioAdmin;
}) {
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
      <header className="fixed inset-x-0 top-0 z-40 border-b border-carbon-700 bg-carbon-900/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gold-500">Century 21</p>
            <p className="font-display text-base font-semibold text-gold-50">Rita Quiroga</p>
          </div>
          <button
            onClick={() => setMenuAbierto((prev) => !prev)}
            className="focus-ring rounded-md border border-carbon-600 bg-carbon-800 p-2 text-gold-100"
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
          className="fixed inset-0 z-30 bg-carbon-950/70 md:hidden"
          aria-label="Cerrar menu"
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-carbon-700 bg-carbon-900 px-4 py-6 transition-transform duration-200 md:sticky md:top-0 md:z-10 md:h-screen md:w-64 md:translate-x-0",
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        )}
      >
      <div className="mb-8 px-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gold-500">Century 21</p>
        <p className="font-display text-lg font-semibold text-gold-50">Rita Quiroga</p>
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
                  ? "bg-gold-500/15 text-gold-300"
                  : "text-gold-100/70 hover:bg-carbon-800 hover:text-gold-100"
              )}
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-carbon-700 pt-4">
        <p className="px-2 text-sm font-medium text-gold-100">{nombre}</p>
        <p className="px-2 text-xs text-gold-100/50">{rol}</p>
        <button
          onClick={cerrarSesion}
          className="focus-ring mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-gold-100/60 transition-colors hover:bg-carbon-800 hover:text-signal-danger"
        >
          <LogOut size={16} strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </div>
      </aside>
    </>
  );
}
