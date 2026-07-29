"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { clsx } from "clsx";

type Tema = "dark" | "light";

export function ThemeToggle({ compacto = false }: { compacto?: boolean }) {
  const [tema, setTema] = useState<Tema>("dark");

  useEffect(() => {
    const guardado = localStorage.getItem("tema-backend") as Tema | null;
    const inicial: Tema = guardado === "light" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", inicial === "dark");
    setTema(inicial);
  }, []);

  function alternarTema() {
    const siguiente: Tema = tema === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", siguiente === "dark");
    localStorage.setItem("tema-backend", siguiente);
    setTema(siguiente);
  }

  const etiqueta =
    tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <button
      onClick={alternarTema}
      className={clsx(
        "focus-ring flex items-center rounded-lg text-carbon-600 transition-colors hover:bg-gold-100 hover:text-carbon-900 dark:text-gold-100/70 dark:hover:bg-carbon-800 dark:hover:text-gold-100",
        compacto
          ? "h-10 w-10 justify-center"
          : "w-full gap-2 px-2 py-2 text-sm",
      )}
      title={etiqueta}
      aria-label={etiqueta}
      type="button"
    >
      {tema === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      {!compacto && (tema === "dark" ? "Modo claro" : "Modo oscuro")}
    </button>
  );
}
