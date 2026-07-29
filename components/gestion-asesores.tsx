"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type {
  AgrupacionAsesor,
  AsesorAutorizado,
  CategoriaAsesor,
} from "@/types/domain";

export function GestionAsesores({
  asesoresIniciales,
  categoriasIniciales,
  agrupacionesIniciales,
  mensajeInicial,
}: {
  asesoresIniciales: AsesorAutorizado[];
  categoriasIniciales: CategoriaAsesor[];
  agrupacionesIniciales: AgrupacionAsesor[];
  mensajeInicial?: string;
}) {
  const [asesores, setAsesores] = useState(asesoresIniciales);
  const [categorias] = useState(categoriasIniciales);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState<string | null>(
    mensajeInicial ?? null,
  );
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [asesorExpandido, setAsesorExpandido] = useState<string | null>(null);
  const POR_PAGINA = 10;

  const categoriasActivas = categorias.filter((categoria) => categoria.activo);
  const teamsActivos = agrupacionesIniciales.filter(
    (item) => item.tipo === "TEAM" && item.activo,
  );
  const equiposActivos = agrupacionesIniciales.filter(
    (item) => item.tipo === "EQUIPO_TRIPLE_21" && item.activo,
  );

  const nombreCategoria = useCallback(
    (id: string) =>
      categorias.find((categoria) => categoria.id === id)?.nombre ??
      "Sin categoría",
    [categorias],
  );

  const asesoresFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase("es");
    if (!termino) return asesores;
    return asesores.filter((asesor) =>
      [
        asesor.nombre,
        asesor.telegramId,
        asesor.celular ?? "",
        nombreCategoria(asesor.categoriaId),
      ]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(termino),
    );
  }, [asesores, busqueda, nombreCategoria]);
  const totalPaginas = Math.max(
    1,
    Math.ceil(asesoresFiltrados.length / POR_PAGINA),
  );
  const paginaActual = Math.min(pagina, totalPaginas);
  const asesoresVisibles = asesoresFiltrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  );

  async function alternarEstado(asesor: AsesorAutorizado) {
    setError(null);
    setMensajeOk(null);
    const res = await fetch(`/api/asesores/${asesor.telegramId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: !asesor.activo }),
    });
    if (res.ok) {
      setAsesores((prev) =>
        prev.map((a) =>
          a.telegramId === asesor.telegramId ? { ...a, activo: !a.activo } : a,
        ),
      );
      setMensajeOk(
        asesor.activo
          ? "Asesor desactivado correctamente."
          : "Asesor activado correctamente.",
      );
    } else {
      const data = await res.json();
      setError(data.error ?? "No se pudo actualizar el estado del asesor.");
    }
  }

  async function actualizarCategoria(
    asesor: AsesorAutorizado,
    nuevaCategoriaId: string,
  ) {
    setError(null);
    setMensajeOk(null);
    const res = await fetch(`/api/asesores/${asesor.telegramId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoriaId: nuevaCategoriaId }),
    });

    if (res.ok) {
      setAsesores((prev) =>
        prev.map((a) =>
          a.telegramId === asesor.telegramId
            ? { ...a, categoriaId: nuevaCategoriaId }
            : a,
        ),
      );
      setMensajeOk("Categoría actualizada correctamente.");
    } else {
      const data = await res.json();
      setError(data.error ?? "No se pudo actualizar la categoría.");
    }
  }

  async function actualizarAgrupacion(
    asesor: AsesorAutorizado,
    campo: "teamId" | "equipoTriple21Id",
    valor: string,
  ) {
    setError(null);
    setMensajeOk(null);
    const res = await fetch(`/api/asesores/${asesor.telegramId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [campo]: valor || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "No se pudo actualizar la agrupación.");
      return;
    }
    setAsesores((prev) =>
      prev.map((item) =>
        item.telegramId === asesor.telegramId ? data.asesor : item,
      ),
    );
    setMensajeOk(
      campo === "teamId"
        ? "Team actualizado correctamente."
        : "Equipo Triple 21 actualizado correctamente.",
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-4 dark:border-carbon-700 dark:bg-carbon-800 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="w-full sm:max-w-md">
            <span className="text-sm font-medium text-carbon-700 dark:text-gold-100/80">
              Buscar asesor
            </span>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Nombre, Telegram ID, celular o categoría"
              className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 placeholder:text-carbon-400 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
            />
          </label>
          <p className="text-sm text-carbon-500 dark:text-gold-100/50">
            {asesoresFiltrados.length} de {asesores.length} asesores
          </p>
        </div>
      </section>

      {categoriasActivas.length === 0 && (
        <p className="rounded-md border border-signal-warn/40 bg-signal-warn/10 px-3 py-2 text-sm text-signal-warn">
          Debes crear al menos una categoria activa en Configuracion antes de
          registrar asesores.
        </p>
      )}

      {mensajeOk && (
        <p
          className="rounded-md border border-signal-ok/40 bg-signal-ok/10 px-4 py-3 text-sm font-medium text-signal-ok"
          role="status"
          aria-live="polite"
        >
          {mensajeOk}
        </p>
      )}

      {error && (
        <p className="rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}

      <p className="text-xs text-carbon-500 dark:text-gold-100/40">
        💡 Para obtener el ID de Telegram de un asesor, pídele que le escriba a{" "}
        <span className="font-mono">@userinfobot</span> en Telegram — le
        devolverá su ID numérico.
      </p>

      <div className="space-y-3 md:hidden">
        {asesoresVisibles.map((a) => (
          <article
            key={a.telegramId}
            className="shadow-panel rounded-xl border border-gold-200 bg-white p-4 dark:border-carbon-700 dark:bg-carbon-800"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-100 font-semibold text-gold-700 dark:bg-carbon-700 dark:text-gold-300">
                  {a.avatarPathname ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/api/asesores/${encodeURIComponent(a.telegramId)}/foto`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    a.nombre.trim().charAt(0).toUpperCase() || "A"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-carbon-900 dark:text-gold-50">
                    {a.nombre}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-medium text-gold-800 dark:bg-carbon-700 dark:text-gold-300">
                    {nombreCategoria(a.categoriaId)}
                  </span>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  a.activo
                    ? "bg-signal-ok/15 text-signal-ok"
                    : "bg-signal-danger/15 text-signal-danger"
                }`}
              >
                {a.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href={`/dashboard/asesores/${encodeURIComponent(a.telegramId)}`}
                className="focus-ring rounded-md bg-gold-500 px-3 py-1.5 text-xs font-medium text-carbon-950 hover:bg-gold-300"
              >
                Ver perfil
              </Link>
              <button
                type="button"
                onClick={() =>
                  setAsesorExpandido((actual) =>
                    actual === a.telegramId ? null : a.telegramId,
                  )
                }
                className="focus-ring rounded-md border border-gold-300 px-3 py-1.5 text-xs text-gold-700 hover:bg-gold-100 dark:border-carbon-600 dark:text-gold-300 dark:hover:bg-carbon-700"
                aria-expanded={asesorExpandido === a.telegramId}
              >
                {asesorExpandido === a.telegramId
                  ? "Ocultar edición"
                  : "Editar datos"}
              </button>
            </div>
            {asesorExpandido === a.telegramId && (
              <div className="mt-3 rounded-lg bg-gold-50 p-3 dark:bg-carbon-900">
                <label className="block text-xs text-carbon-500">
                  Categoría
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
                </label>
                <label className="mt-2 block text-xs text-carbon-500">
                  Equipo Triple 21
                  <select
                    value={a.equipoTriple21Id ?? ""}
                    onChange={(e) =>
                      actualizarAgrupacion(
                        a,
                        "equipoTriple21Id",
                        e.target.value,
                      )
                    }
                    className="focus-ring mt-2 w-full rounded-md border border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
                  >
                    <option value="">Sin Equipo Triple 21</option>
                    {equiposActivos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-2 block text-xs text-carbon-500">
                  Team
                  <select
                    value={a.teamId ?? ""}
                    onChange={(e) =>
                      actualizarAgrupacion(a, "teamId", e.target.value)
                    }
                    className="focus-ring mt-2 w-full rounded-md border border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
                  >
                    <option value="">Sin Team</option>
                    {teamsActivos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => alternarEstado(a)}
                  className="focus-ring mt-3 w-full rounded-md border border-gold-300 px-3 py-2 text-xs font-medium text-carbon-700 dark:border-carbon-600 dark:text-gold-100"
                >
                  {a.activo ? "Desactivar asesor" : "Activar asesor"}
                </button>
              </div>
            )}
          </article>
        ))}
        {asesoresVisibles.length === 0 && (
          <div className="rounded-xl border border-gold-200 bg-white px-4 py-8 text-center text-sm text-carbon-500 dark:border-carbon-700 dark:bg-carbon-800 dark:text-gold-100/40">
            No se encontraron asesores.
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
              <th className="px-4 py-3">Equipo Triple 21</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {asesoresVisibles.map((a) => (
              <tr
                key={a.telegramId}
                className="border-b border-gold-100 text-carbon-700 hover:bg-gold-50 dark:border-carbon-700/50 dark:text-gold-100/80 dark:hover:bg-carbon-800/50"
              >
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
                  <select
                    value={a.equipoTriple21Id ?? ""}
                    onChange={(e) =>
                      actualizarAgrupacion(
                        a,
                        "equipoTriple21Id",
                        e.target.value,
                      )
                    }
                    className="focus-ring rounded-md border border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
                  >
                    <option value="">Sin asignar</option>
                    {equiposActivos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={a.teamId ?? ""}
                    onChange={(e) =>
                      actualizarAgrupacion(a, "teamId", e.target.value)
                    }
                    className="focus-ring rounded-md border border-gold-300 bg-gold-50 px-2.5 py-1.5 text-xs text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
                  >
                    <option value="">Sin asignar</option>
                    {teamsActivos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      a.activo
                        ? "bg-signal-ok/15 text-signal-ok"
                        : "bg-signal-danger/15 text-signal-danger"
                    }`}
                  >
                    {a.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 whitespace-nowrap">
                    <Link
                      href={`/dashboard/asesores/${encodeURIComponent(a.telegramId)}`}
                      className="focus-ring text-sm font-medium text-gold-700 hover:text-gold-900 dark:text-gold-500 dark:hover:text-gold-300"
                    >
                      Ver perfil
                    </Link>
                    <button
                      type="button"
                      onClick={() => alternarEstado(a)}
                      className="focus-ring text-sm text-carbon-600 hover:text-carbon-900 dark:text-gold-100/70 dark:hover:text-gold-50"
                    >
                      {a.activo ? "Desactivar" : "Activar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {asesoresVisibles.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-carbon-500 dark:text-gold-100/40"
                >
                  No se encontraron asesores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPaginas > 1 && (
        <nav
          className="flex items-center justify-between gap-3"
          aria-label="Paginación de asesores"
        >
          <button
            type="button"
            disabled={paginaActual === 1}
            onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
            className="rounded-md border border-gold-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          <p className="text-sm text-carbon-500">
            Página {paginaActual} de {totalPaginas}
          </p>
          <button
            type="button"
            disabled={paginaActual === totalPaginas}
            onClick={() =>
              setPagina((actual) => Math.min(totalPaginas, actual + 1))
            }
            className="rounded-md border border-gold-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </nav>
      )}
    </div>
  );
}
