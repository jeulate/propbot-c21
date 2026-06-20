"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { LayoutDashboard, FileSpreadsheet, Users, LogOut, ShieldCheck } from "lucide-react";
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

  async function cerrarSesion() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-carbon-700 bg-carbon-900 px-4 py-6">
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
  );
}
