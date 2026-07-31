"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CategoriaAsesor } from "@/types/domain";

type Props = {
  categoriasIniciales: CategoriaAsesor[];
  porcentajeOficinaNacionalInicial: number;
};

function numero(valor: string): number {
  return Number(valor.trim().replace(",", "."));
}

export function GestionCategorias({
  categoriasIniciales,
  porcentajeOficinaNacionalInicial,
}: Props) {
  const router = useRouter();
  const [categorias, setCategorias] = useState(categoriasIniciales);
  const [porcentajeOficinaNacional, setPorcentajeOficinaNacional] = useState(
    String(porcentajeOficinaNacionalInicial),
  );
  const [nombre, setNombre] = useState("");
  const [porcentaje, setPorcentaje] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nombreEditado, setNombreEditado] = useState("");
  const [porcentajeEditado, setPorcentajeEditado] = useState("");
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);
  const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false);
  const [categoriaAEliminar, setCategoriaAEliminar] =
    useState<CategoriaAsesor | null>(null);

  function actualizarCategorias(
    transformacion: (actuales: CategoriaAsesor[]) => CategoriaAsesor[],
  ) {
    setCategorias((actuales) => {
      const siguientes = transformacion(actuales);
      window.dispatchEvent(
        new CustomEvent<CategoriaAsesor[]>("categorias-asesor-actualizadas", {
          detail: siguientes,
        }),
      );
      return siguientes;
    });
  }

  function limpiarMensajes() {
    setError(null);
    setMensajeOk(null);
  }

  async function leerRespuesta(respuesta: Response) {
    const data = await respuesta.json();
    if (!respuesta.ok) {
      throw new Error(data.error ?? "No se pudo completar la operación.");
    }
    return data;
  }

  async function crear(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    limpiarMensajes();

    const valor = numero(porcentaje);
    if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
      setError("La comisión debe estar entre 0 y 100.");
      return;
    }

    setProcesandoId("nueva");
    try {
      const data = await leerRespuesta(
        await fetch("/api/categorias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombre.trim(),
            porcentajeComision: valor,
          }),
        }),
      );
      actualizarCategorias((actuales) =>
        [...actuales, data.categoria].sort((a, b) =>
          a.nombre.localeCompare(b.nombre, "es"),
        ),
      );
      setNombre("");
      setPorcentaje("");
      setMensajeOk(
        "Categoría creada. Su configuración Team inició en 0 % / 0 %.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setProcesandoId(null);
    }
  }

  async function guardarPorcentajeNacional(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    limpiarMensajes();

    const valor = numero(porcentajeOficinaNacional);
    if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
      setError("El porcentaje de Oficina Nacional debe estar entre 0 y 100.");
      return;
    }

    setGuardandoConfiguracion(true);
    try {
      const data = await leerRespuesta(
        await fetch("/api/configuracion", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ porcentajeOficinaNacional: valor }),
        }),
      );
      setPorcentajeOficinaNacional(
        String(data.configuracion.porcentajeOficinaNacional),
      );
      setMensajeOk("Porcentaje de Oficina Nacional guardado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setGuardandoConfiguracion(false);
    }
  }

  function iniciarEdicion(categoria: CategoriaAsesor) {
    limpiarMensajes();
    setEditandoId(categoria.id);
    setNombreEditado(categoria.nombre);
    setPorcentajeEditado(String(categoria.porcentajeComision));
  }

  async function guardarEdicion(id: string) {
    limpiarMensajes();
    const valor = numero(porcentajeEditado);
    if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
      setError("La comisión debe estar entre 0 y 100.");
      return;
    }

    setProcesandoId(id);
    try {
      const data = await leerRespuesta(
        await fetch(`/api/categorias/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: nombreEditado.trim(),
            porcentajeComision: valor,
          }),
        }),
      );
      actualizarCategorias((actuales) =>
        actuales
          .map((item) => (item.id === id ? data.categoria : item))
          .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
      );
      setEditandoId(null);
      setMensajeOk("Categoría actualizada correctamente.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setProcesandoId(null);
    }
  }

  async function cambiarEstado(categoria: CategoriaAsesor) {
    limpiarMensajes();
    setProcesandoId(categoria.id);
    try {
      const data = await leerRespuesta(
        await fetch(`/api/categorias/${categoria.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activo: !categoria.activo }),
        }),
      );
      actualizarCategorias((actuales) =>
        actuales.map((item) =>
          item.id === categoria.id ? data.categoria : item,
        ),
      );
      setMensajeOk(
        data.categoria.activo
          ? "Categoría activada."
          : "Categoría desactivada.",
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setProcesandoId(null);
    }
  }

  async function eliminar(categoria: CategoriaAsesor) {
    limpiarMensajes();
    setProcesandoId(categoria.id);
    try {
      await leerRespuesta(
        await fetch(`/api/categorias/${categoria.id}`, { method: "DELETE" }),
      );
      actualizarCategorias((actuales) =>
        actuales.filter((item) => item.id !== categoria.id),
      );
      setCategoriaAEliminar(null);
      setMensajeOk("Categoría eliminada junto con su configuración Team.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setProcesandoId(null);
    }
  }

  const inputClass =
    "focus-ring rounded-md border border-gold-300 bg-gold-50 px-3 py-2 text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50";
  const secondaryButton =
    "focus-ring rounded-md border border-gold-300 px-3 py-2 text-sm font-medium text-carbon-800 hover:bg-gold-50 disabled:opacity-50 dark:border-carbon-600 dark:text-gold-100 dark:hover:bg-carbon-700";

  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
        Categorías de asesores
      </h2>
      <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/60">
        Administra el nombre, comisión general y estado. Cada categoría mantiene
        una configuración Team relacionada por su identificador.
      </p>

      <form
        onSubmit={guardarPorcentajeNacional}
        className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-carbon-700 dark:text-gold-100/80">
          Porcentaje de Oficina Nacional
          <input
            className={inputClass}
            value={porcentajeOficinaNacional}
            onChange={(e) => setPorcentajeOficinaNacional(e.target.value)}
            placeholder="Porcentaje (%)"
            inputMode="decimal"
            required
          />
        </label>
        <button
          className="focus-ring rounded-md bg-gold-500 px-5 py-2 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-50"
          disabled={guardandoConfiguracion}
        >
          {guardandoConfiguracion ? "Guardando..." : "Guardar porcentaje"}
        </button>
      </form>

      <form onSubmit={crear} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          className={`${inputClass} flex-1`}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre de la categoría"
          minLength={2}
          maxLength={80}
          required
        />
        <input
          className={`${inputClass} sm:w-44`}
          value={porcentaje}
          onChange={(e) => setPorcentaje(e.target.value)}
          placeholder="Comisión (%)"
          inputMode="decimal"
          required
        />
        <button
          className="focus-ring rounded-md bg-gold-500 px-5 py-2 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-50"
          disabled={procesandoId === "nueva"}
        >
          {procesandoId === "nueva" ? "Creando..." : "Crear categoría"}
        </button>
      </form>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gold-200 dark:border-carbon-600">
              <th className="px-3 py-3">Nombre</th>
              <th className="px-3 py-3">Comisión general</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-3 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((categoria) => {
              const editando = editandoId === categoria.id;
              const procesando = procesandoId === categoria.id;
              return (
                <tr
                  key={categoria.id}
                  className="border-b border-gold-100 last:border-0 dark:border-carbon-700"
                >
                  <td className="px-3 py-3">
                    {editando ? (
                      <input
                        className={inputClass}
                        value={nombreEditado}
                        onChange={(e) => setNombreEditado(e.target.value)}
                      />
                    ) : (
                      categoria.nombre
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {editando ? (
                      <input
                        className={`${inputClass} w-32`}
                        value={porcentajeEditado}
                        onChange={(e) => setPorcentajeEditado(e.target.value)}
                        inputMode="decimal"
                      />
                    ) : (
                      `${categoria.porcentajeComision.toLocaleString("es-BO")}%`
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={
                        categoria.activo
                          ? "inline-flex items-center rounded-full bg-signal-ok/15 px-2.5 py-1 text-xs font-semibold text-signal-ok"
                          : "inline-flex items-center rounded-full bg-carbon-200 px-2.5 py-1 text-xs font-semibold text-carbon-700 dark:bg-carbon-700 dark:text-gold-100"
                      }
                    >
                      {categoria.activo ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      {editando ? (
                        <>
                          <button
                            type="button"
                            className={secondaryButton}
                            disabled={procesando}
                            onClick={() => guardarEdicion(categoria.id)}
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            className={secondaryButton}
                            onClick={() => setEditandoId(null)}
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() => iniciarEdicion(categoria)}
                        >
                          Editar
                        </button>
                      )}
                      <button
                        type="button"
                        className={secondaryButton}
                        disabled={procesando}
                        onClick={() => cambiarEstado(categoria)}
                      >
                        {categoria.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        className="focus-ring rounded-md border border-signal-danger/50 px-3 py-2 text-sm font-medium text-signal-danger hover:bg-signal-danger/10 disabled:opacity-50"
                        disabled={procesando}
                        onClick={() => setCategoriaAEliminar(categoria)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-signal-danger">
          {error}
        </p>
      )}
      {mensajeOk && (
        <p role="status" className="mt-4 text-sm text-signal-ok">
          {mensajeOk}
        </p>
      )}

      {categoriaAEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-carbon-950/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !procesandoId) {
              setCategoriaAEliminar(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-eliminar-categoria"
            className="w-full max-w-md rounded-xl border border-gold-200 bg-white p-6 shadow-2xl dark:border-carbon-600 dark:bg-carbon-800"
          >
            <h3
              id="titulo-eliminar-categoria"
              className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50"
            >
              Eliminar categoría
            </h3>
            <p className="mt-3 text-sm text-carbon-600 dark:text-gold-100/70">
              ¿Confirmas que deseas eliminar definitivamente la categoría{" "}
              <strong>{categoriaAEliminar.nombre}</strong>? También se eliminará
              su configuración de comisiones Team.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className={secondaryButton}
                disabled={procesandoId === categoriaAEliminar.id}
                onClick={() => setCategoriaAEliminar(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="focus-ring rounded-md bg-signal-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                disabled={procesandoId === categoriaAEliminar.id}
                onClick={() => eliminar(categoriaAEliminar)}
              >
                {procesandoId === categoriaAEliminar.id
                  ? "Eliminando..."
                  : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
