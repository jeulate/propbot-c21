"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { clsx } from "clsx";
import type { RolUsuarioAdmin } from "@/types/domain";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/dashboard/user-menu";

interface DashboardHeaderProps {
  nombre: string;
  rol: RolUsuarioAdmin;
  sidebarContraido: boolean;
  onAlternarSidebar: () => void;
  onAbrirMenuMovil: () => void;
}

export function DashboardHeader({
  nombre,
  rol,
  sidebarContraido,
  onAlternarSidebar,
  onAbrirMenuMovil,
}: DashboardHeaderProps) {
  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-30 h-16 border-b border-gold-200 bg-gold-50/95 backdrop-blur transition-[left] duration-300 dark:border-carbon-700 dark:bg-carbon-900/95 md:right-0 md:h-20",
        sidebarContraido ? "md:left-20" : "md:left-64",
      )}
    >
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onAbrirMenuMovil}
            className="focus-ring rounded-lg border border-gold-300 bg-gold-100 p-2 text-carbon-800 transition-colors hover:bg-gold-200 dark:border-carbon-600 dark:bg-carbon-800 dark:text-gold-100 dark:hover:bg-carbon-700 md:hidden"
            aria-label="Abrir menú de navegación"
          >
            <Menu size={20} />
          </button>

          <button
            type="button"
            onClick={onAlternarSidebar}
            className="focus-ring hidden rounded-lg border border-gold-300 bg-gold-100 p-2 text-carbon-800 transition-colors hover:bg-gold-200 dark:border-carbon-600 dark:bg-carbon-800 dark:text-gold-100 dark:hover:bg-carbon-700 md:inline-flex"
            aria-label={
              sidebarContraido
                ? "Expandir barra lateral"
                : "Contraer barra lateral"
            }
            title={
              sidebarContraido
                ? "Expandir barra lateral"
                : "Contraer barra lateral"
            }
          >
            {sidebarContraido ? (
              <PanelLeftOpen size={20} />
            ) : (
              <PanelLeftClose size={20} />
            )}
          </button>

          <div className="hidden sm:block">
            <p className="text-xs uppercase tracking-[0.18em] text-gold-600 dark:text-gold-400">
              Panel de control
            </p>
            <p className="font-display text-base font-semibold">
              Gestión comercial
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle compacto />
          <UserMenu nombre={nombre} rol={rol} />
        </div>
      </div>
    </header>
  );
}
