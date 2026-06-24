"use client";

import { useState } from "react";
import type { AsesorAutorizado, CategoriaAsesor } from "@/types/domain";

export function GestionAsesores({
  asesoresIniciales,
  categoriasIniciales,
}: {
  asesoresIniciales: AsesorAutorizado[];
  categoriasIniciales: CategoriaAsesor[];
}) {
  const [asesores, setAsesores] = useState(asesoresIniciales);
  const [categorias] = useState(categoriasIniciales);
  const [telegramId, setTelegramId] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState(categoriasIniciales.find((c) => c.activo)?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const categoriasActivas = categorias.filter((categoria) => categoria.activo);

  function nombreCategoria(id: string) {
    return categorias.find((categoria) => categoria.id === id)?.nombre ?? "Sin categoria";
  }

  async function agregarAsesor(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/asesores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId, nombre, categoriaId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo agregar el asesor.");
        return;
      }
      setAsesores((prev) => [data.asesor, ...prev]);
      setTelegramId("");
      setNombre("");
      setCategoriaId(categoriasActivas[0]?.id ?? "");
    } finally {
      setCargando(false);
    }
  }

  async function alternarEstado(asesor: AsesorAutorizado) {
    const res = await fetch(`/api/asesores/${asesor.telegramId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !asesor.activo }),
    });
    if (res.ok) {
      setAsesores((prev) =>
        prev.map((a) => (a.telegramId === asesor.telegramId ? { ...a, activo: !a.activo } : a))
      );
    }
  }

  async function actualizarCategoria(asesor: AsesorAutorizado, nuevaCategoriaId: string) {
    const res = await fetch(`/api/asesores/${asesor.telegramId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoriaId: nuevaCategoriaId }),
    });

    if (res.ok) {
      setAsesores((prev) =>
        prev.map((a) =>
          a.telegramId === asesor.telegramId ? { ...a, categoriaId: nuevaCategoriaId } : a
        )
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={agregarAsesor}
        className="shadow-panel grid grid-cols-1 gap-4 rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800 md:grid-cols-4"
      >
        <div className="flex-1">
          <label className="text-sm font-medium text-carbon-700 dark:text-gold-100/80">ID de Telegram</label>
          <input
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            required
            placeholder="ej. 123456789"
            className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 placeholder:text-carbon-400 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50 dark:placeholder:text-gold-100/30"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-carbon-700 dark:text-gold-100/80">Nombre del asesor</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="ej. Juan Pérez"
            className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 placeholder:text-carbon-400 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50 dark:placeholder:text-gold-100/30"
          />
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium text-carbon-700 dark:text-gold-100/80">Categoria</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
            className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 placeholder:text-carbon-400 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50 dark:placeholder:text-gold-100/30"
          >
            {categoriasActivas.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nombre} ({categoria.porcentajeComision}%)
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={cargando || categoriasActivas.length === 0}
          className="focus-ring rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-60"
        >
          {cargando ? "Agregando..." : "Agregar asesor"}
        </button>
      </form>

      {categoriasActivas.length === 0 && (
        <p className="rounded-md border border-signal-warn/40 bg-signal-warn/10 px-3 py-2 text-sm text-signal-warn">
          Debes crear al menos una categoria activa en Configuracion antes de registrar asesores.
        </p>
      )}

      {error && (
        <p className="rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}

      <p className="text-xs text-carbon-500 dark:text-gold-100/40">
        💡 Para obtener el ID de Telegram de un asesor, pídele que le escriba a{" "}
        <span className="font-mono">@userinfobot</span> en Telegram — le devolverá su ID numérico.
      </p>

      <div className="space-y-3 md:hidden">
        {asesores.map((a) => (
          <article key={a.telegramId} className="shadow-panel rounded-xl border border-gold-200 bg-white p-4 dark:border-carbon-700 dark:bg-carbon-800">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-carbon-900 dark:text-gold-50">{a.nombre}</p>
                <p className="mt-1 font-mono text-xs text-carbon-500 dark:text-gold-100/60">{a.telegramId}</p>
                <p className="mt-1 text-xs text-carbon-600 dark:text-gold-100/70">Categoria: {nombreCategoria(a.categoriaId)}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  a.activo ? "bg-signal-ok/15 text-signal-ok" : "bg-signal-danger/15 text-signal-danger"
                }`}
              >
                {a.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <button
              onClick={() => alternarEstado(a)}
              className="focus-ring mt-3 rounded-md border border-gold-300 px-3 py-1.5 text-xs text-gold-700 hover:bg-gold-100 dark:border-carbon-600 dark:text-gold-300 dark:hover:bg-carbon-700"
            >
              {a.activo ? "Desactivar" : "Activar"}
            </button>
            <select
              value={a.categoriaId}
              onChange={(e) => actualizarCategoria(a, e.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
            >
              {categoriasActivas.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre} ({categoria.porcentajeComision}%)
                </option>
              ))}
            </select>
          </article>
        ))}
        {asesores.length === 0 && (
          <div className="rounded-xl border border-gold-200 bg-white px-4 py-8 text-center text-sm text-carbon-500 dark:border-carbon-700 dark:bg-carbon-800 dark:text-gold-100/40">
            Ningún asesor registrado todavía.
          </div>
        )}
      </div>

      <div className="shadow-panel hidden overflow-x-auto rounded-xl border border-gold-200 bg-white dark:border-carbon-700 dark:bg-carbon-800 md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gold-200 text-xs uppercase tracking-wide text-carbon-500 dark:border-carbon-700 dark:text-gold-100/40">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">ID de Telegram</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {asesores.map((a) => (
              <tr key={a.telegramId} className="border-b border-gold-100 text-carbon-700 hover:bg-gold-50 dark:border-carbon-700/50 dark:text-gold-100/80 dark:hover:bg-carbon-800/50">
                <td className="px-4 py-3">{a.nombre}</td>
                <td className="px-4 py-3 font-mono text-xs">{a.telegramId}</td>
                <td className="px-4 py-3">
                  <select
                    value={a.categoriaId}
                    onChange={(e) => actualizarCategoria(a, e.target.value)}
                    className="focus-ring rounded-md border border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
                  >
                    {categoriasActivas.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre} ({categoria.porcentajeComision}%)
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      a.activo ? "bg-signal-ok/15 text-signal-ok" : "bg-signal-danger/15 text-signal-danger"
                    }`}
                  >
                    {a.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => alternarEstado(a)}
                    className="focus-ring text-sm text-gold-700 hover:text-gold-900 dark:text-gold-500 dark:hover:text-gold-300"
                  >
                    {a.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {asesores.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-carbon-500 dark:text-gold-100/40">
                  Ningún asesor registrado todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
