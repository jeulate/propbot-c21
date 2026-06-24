"use client";

import { useState } from "react";
import type { CategoriaAsesor } from "@/types/domain";

function formatoPorcentaje(valor: number) {
  return `${valor.toFixed(2)}%`;
}

export function GestionCategorias({
  categoriasIniciales,
  porcentajeOficinaNacionalInicial,
}: {
  categoriasIniciales: CategoriaAsesor[];
  porcentajeOficinaNacionalInicial: number;
}) {
  const [categorias, setCategorias] = useState(categoriasIniciales);
  const [porcentajeOficinaNacional, setPorcentajeOficinaNacional] = useState(
    String(porcentajeOficinaNacionalInicial)
  );
  const [nombre, setNombre] = useState("");
  const [porcentajeComision, setPorcentajeComision] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);

  async function guardarPorcentajeNacional(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);
    setGuardandoConfiguracion(true);

    try {
      const porcentaje = Number(porcentajeOficinaNacional);
      const res = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ porcentajeOficinaNacional: porcentaje }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar el porcentaje de Oficina Nacional.");
        return;
      }

      setPorcentajeOficinaNacional(String(data.configuracion.porcentajeOficinaNacional));
      setMensajeOk("Configuracion guardada correctamente.");
    } finally {
      setGuardandoConfiguracion(false);
    }
  }

  async function crearCategoria(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const porcentaje = Number(porcentajeComision);
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, porcentajeComision: porcentaje }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la categoria.");
        return;
      }

      setCategorias((prev) => [data.categoria, ...prev]);
      setNombre("");
      setPorcentajeComision("");
    } finally {
      setCargando(false);
    }
  }

  async function alternarEstado(categoria: CategoriaAsesor) {
    const res = await fetch(`/api/categorias/${categoria.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !categoria.activo }),
    });

    if (!res.ok) return;

    setCategorias((prev) =>
      prev.map((item) =>
        item.id === categoria.id ? { ...item, activo: !item.activo } : item
      )
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={guardarPorcentajeNacional}
        className="shadow-panel grid grid-cols-1 gap-4 rounded-xl border border-carbon-700 bg-carbon-800 p-6 md:grid-cols-3"
      >
        <div>
          <label className="text-sm font-medium text-gold-100/80">
            % a pagar a Oficina Nacional
          </label>
          <input
            value={porcentajeOficinaNacional}
            onChange={(e) => setPorcentajeOficinaNacional(e.target.value)}
            required
            inputMode="decimal"
            placeholder="Ej. 8"
            className="focus-ring mt-1.5 w-full rounded-md border border-carbon-600 bg-carbon-900 px-3.5 py-2.5 text-gold-50 placeholder:text-gold-100/30"
          />
        </div>

        <p className="text-sm text-gold-100/70 md:col-span-1 md:self-end md:pb-2">
          Este porcentaje se aplica sobre la comision base (4% o 2%) antes del reparto por categoria.
        </p>

        <button
          type="submit"
          disabled={guardandoConfiguracion}
          className="focus-ring self-end rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-60"
        >
          {guardandoConfiguracion ? "Guardando..." : "Guardar porcentaje nacional"}
        </button>
      </form>

      <form
        onSubmit={crearCategoria}
        className="shadow-panel grid grid-cols-1 gap-4 rounded-xl border border-carbon-700 bg-carbon-800 p-6 md:grid-cols-3"
      >
        <div>
          <label className="text-sm font-medium text-gold-100/80">Nombre de categoria</label>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej. Senior"
            className="focus-ring mt-1.5 w-full rounded-md border border-carbon-600 bg-carbon-900 px-3.5 py-2.5 text-gold-50 placeholder:text-gold-100/30"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gold-100/80">% de comision</label>
          <input
            value={porcentajeComision}
            onChange={(e) => setPorcentajeComision(e.target.value)}
            required
            inputMode="decimal"
            placeholder="Ej. 3.5"
            className="focus-ring mt-1.5 w-full rounded-md border border-carbon-600 bg-carbon-900 px-3.5 py-2.5 text-gold-50 placeholder:text-gold-100/30"
          />
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="focus-ring self-end rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-60"
        >
          {cargando ? "Guardando..." : "Crear categoria"}
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}

      {mensajeOk && (
        <p className="rounded-md border border-signal-ok/40 bg-signal-ok/10 px-3 py-2 text-sm text-signal-ok">
          {mensajeOk}
        </p>
      )}

      <div className="space-y-3 md:hidden">
        {categorias.map((categoria) => (
          <article key={categoria.id} className="shadow-panel rounded-xl border border-carbon-700 bg-carbon-800 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gold-50">{categoria.nombre}</p>
                <p className="mt-1 text-xs text-gold-100/70">
                  Porcentaje: {formatoPorcentaje(categoria.porcentajeComision)}
                </p>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  categoria.activo ? "bg-signal-ok/15 text-signal-ok" : "bg-signal-danger/15 text-signal-danger"
                }`}
              >
                {categoria.activo ? "Activa" : "Inactiva"}
              </span>
            </div>
            <button
              onClick={() => alternarEstado(categoria)}
              className="focus-ring mt-3 rounded-md border border-carbon-600 px-3 py-1.5 text-xs text-gold-300 hover:bg-carbon-700"
            >
              {categoria.activo ? "Desactivar" : "Activar"}
            </button>
          </article>
        ))}
      </div>

      <div className="shadow-panel hidden overflow-x-auto rounded-xl border border-carbon-700 bg-carbon-800 md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-carbon-700 text-xs uppercase tracking-wide text-gold-100/40">
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">% Comision</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Accion</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((categoria) => (
              <tr key={categoria.id} className="border-b border-carbon-700/50 text-gold-100/80">
                <td className="px-4 py-3">{categoria.nombre}</td>
                <td className="px-4 py-3">{formatoPorcentaje(categoria.porcentajeComision)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      categoria.activo ? "bg-signal-ok/15 text-signal-ok" : "bg-signal-danger/15 text-signal-danger"
                    }`}
                  >
                    {categoria.activo ? "Activa" : "Inactiva"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => alternarEstado(categoria)}
                    className="focus-ring text-sm text-gold-500 hover:text-gold-300"
                  >
                    {categoria.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
            {categorias.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gold-100/40">
                  Aun no hay categorias configuradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
