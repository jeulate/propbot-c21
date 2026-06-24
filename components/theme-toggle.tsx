"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "dark" | "light";

export function ThemeToggle() {
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

  return (
    <button
      onClick={alternarTema}
      className="focus-ring mt-3 flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm text-gold-100/70 transition-colors hover:bg-carbon-800"
      title={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      type="button"
    >
      {tema === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      {tema === "dark" ? "Modo claro" : "Modo oscuro"}
    </button>
  );
}
