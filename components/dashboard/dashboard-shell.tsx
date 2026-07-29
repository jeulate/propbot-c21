"use client";

import { useCallback, useEffect, useState } from "react";
import type { RolUsuarioAdmin } from "@/types/domain";
import { BarraNavegacion } from "@/components/barra-navegacion";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";

const CLAVE_SIDEBAR = "c21-sidebar-contraido";

interface DashboardShellProps {
  children: React.ReactNode;
  nombre: string;
  rol: RolUsuarioAdmin;
}

export function DashboardShell({ children, nombre, rol }: DashboardShellProps) {
  const [sidebarContraido, setSidebarContraido] = useState(false);
  const [sidebarBajoCursor, setSidebarBajoCursor] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  useEffect(() => {
    setSidebarContraido(localStorage.getItem(CLAVE_SIDEBAR) === "true");
  }, []);

  function alternarSidebar() {
    setSidebarContraido((actual) => {
      const siguiente = !actual;
      localStorage.setItem(CLAVE_SIDEBAR, String(siguiente));
      return siguiente;
    });
  }

  const cerrarMenuMovil = useCallback(() => {
    setMenuMovilAbierto(false);
  }, []);

  const sidebarExpandidoTemporalmente = sidebarContraido && sidebarBajoCursor;

  return (
    <div className="min-h-screen bg-gold-50 text-carbon-900 dark:bg-carbon-950 dark:text-gold-50">
      <BarraNavegacion
        contraido={sidebarContraido}
        expandidoTemporalmente={sidebarExpandidoTemporalmente}
        menuMovilAbierto={menuMovilAbierto}
        nombre={nombre}
        onCerrarMenuMovil={cerrarMenuMovil}
        onEntrarSidebar={() => setSidebarBajoCursor(true)}
        onSalirSidebar={() => setSidebarBajoCursor(false)}
        rol={rol}
      />

      <div
        className={
          sidebarContraido
            ? "min-h-screen transition-[padding] duration-300 md:pl-20"
            : "min-h-screen transition-[padding] duration-300 md:pl-64"
        }
      >
        <DashboardHeader
          nombre={nombre}
          onAbrirMenuMovil={() => setMenuMovilAbierto(true)}
          onAlternarSidebar={alternarSidebar}
          rol={rol}
          sidebarContraido={sidebarContraido}
        />

        <main className="px-4 pb-6 pt-20 sm:px-6 md:px-8 md:pb-8 md:pt-24">
          {children}
        </main>
      </div>
    </div>
  );
}
