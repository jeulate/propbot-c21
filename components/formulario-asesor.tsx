"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AgrupacionAsesor,
  AsesorAutorizado,
  CategoriaAsesor,
} from "@/types/domain";

type Props = {
  asesor?: AsesorAutorizado;
  categorias: CategoriaAsesor[];
  agrupaciones: AgrupacionAsesor[];
  nombreOficina?: string;
};

export function FormularioAsesor({
  asesor,
  categorias,
  agrupaciones,
  nombreOficina,
}: Props) {
  const router = useRouter();
  const archivoFotoRef = useRef<HTMLInputElement>(null);
  const [asesorActual, setAsesorActual] = useState(asesor);
  const [telegramId, setTelegramId] = useState(asesor?.telegramId ?? "");
  const [nombre, setNombre] = useState(asesor?.nombre ?? "");
  const [celular, setCelular] = useState(asesor?.celular ?? "");
  const [categoriaId, setCategoriaId] = useState(
    asesor?.categoriaId ?? categorias.find((item) => item.activo)?.id ?? "",
  );
  const [teamId, setTeamId] = useState(asesor?.teamId ?? "");
  const [equipoTriple21Id, setEquipoTriple21Id] = useState(
    asesor?.equipoTriple21Id ?? "",
  );
  const [error, setError] = useState("");
  const [mensajeOk, setMensajeOk] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [fotoVersion, setFotoVersion] = useState(Date.now());
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [progresoFoto, setProgresoFoto] = useState(0);
  const [estadoFoto, setEstadoFoto] = useState("");
  const [fotoPendiente, setFotoPendiente] = useState<File | null>(null);
  const [fotoPrevia, setFotoPrevia] = useState("");

  function cargarFoto(
    archivo: File,
    asesorDestino: AsesorAutorizado,
  ): Promise<AsesorAutorizado> {
    return new Promise((resolve, reject) => {
      setSubiendoFoto(true);
      setProgresoFoto(0);
      setEstadoFoto("Preparando");
      const formData = new FormData();
      formData.append("foto", archivo);

      const solicitud = new XMLHttpRequest();
      solicitud.open(
        "POST",
        `/api/asesores/${encodeURIComponent(asesorDestino.telegramId)}/foto`,
      );
      solicitud.upload.addEventListener("progress", (evento) => {
        if (!evento.lengthComputable) return;
        const porcentaje = Math.round((evento.loaded / evento.total) * 100);
        setProgresoFoto(porcentaje);
        setEstadoFoto(porcentaje < 100 ? "Subiendo" : "Procesando");
      });
      solicitud.addEventListener("load", () => {
        let data: { error?: string; asesor?: AsesorAutorizado } = {};
        try {
          data = solicitud.responseText
            ? (JSON.parse(solicitud.responseText) as typeof data)
            : {};
        } catch {
          data = {};
        }
        if (solicitud.status < 200 || solicitud.status >= 300) {
          setSubiendoFoto(false);
          setEstadoFoto("");
          reject(
            new Error(
              data.error ??
                `No se pudo subir la fotografía. Código ${solicitud.status}.`,
            ),
          );
          return;
        }
        const actualizado = data.asesor ?? {
          ...asesorDestino,
          avatarPathname: "actualizado",
        };
        setAsesorActual(actualizado);
        setFotoVersion(Date.now());
        setProgresoFoto(100);
        setEstadoFoto("Completado");
        setSubiendoFoto(false);
        setFotoPendiente(null);
        if (archivoFotoRef.current) archivoFotoRef.current.value = "";
        resolve(actualizado);
      });
      solicitud.addEventListener("error", () => {
        setSubiendoFoto(false);
        setEstadoFoto("");
        reject(
          new Error(
            "No se pudo conectar con el servidor para subir la fotografía.",
          ),
        );
      });
      solicitud.send(formData);
    });
  }

  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMensajeOk("");
    setGuardando(true);
    try {
      const url = asesor
        ? `/api/asesores/${encodeURIComponent(asesor.telegramId)}`
        : "/api/asesores";
      const respuesta = await fetch(url, {
        method: asesor ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          asesor
            ? {
                nombre,
                celular: celular || null,
                categoriaId,
                teamId: teamId || null,
                equipoTriple21Id: equipoTriple21Id || null,
              }
            : {
                telegramId,
                nombre,
                celular,
                categoriaId,
                teamId: teamId || null,
                equipoTriple21Id: equipoTriple21Id || null,
              },
        ),
      });
      const data = await respuesta.json();
      if (!respuesta.ok)
        throw new Error(data.error ?? "No se pudo guardar el asesor.");
      const guardado = (data.asesor ?? asesorActual) as
        AsesorAutorizado | undefined;
      if (!guardado)
        throw new Error("El servidor no devolvió el asesor guardado.");
      setAsesorActual(guardado);
      if (fotoPendiente) await cargarFoto(fotoPendiente, guardado);
      if (asesor) {
        setMensajeOk("Cambios guardados correctamente.");
        router.refresh();
      } else {
        router.push("/dashboard/asesores?creado=1");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el asesor.",
      );
    } finally {
      setGuardando(false);
    }
  }

  async function subirFoto(event: React.ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    if (!archivo) return;
    setError("");
    setMensajeOk("");
    if (archivo.size > 3 * 1024 * 1024) {
      setError("La fotografía no puede superar los 3 MB.");
      return;
    }
    const lector = new FileReader();
    lector.onload = () => setFotoPrevia(String(lector.result ?? ""));
    lector.readAsDataURL(archivo);
    if (!asesorActual) {
      setFotoPendiente(archivo);
      setEstadoFoto("Lista para subir");
      setProgresoFoto(0);
      return;
    }
    try {
      await cargarFoto(archivo, asesorActual);
      setMensajeOk("Fotografía actualizada correctamente.");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo subir la fotografía.",
      );
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50";
  const teams = agrupaciones.filter(
    (item) => item.tipo === "TEAM" && (item.activo || item.id === teamId),
  );
  const equipos = agrupaciones.filter(
    (item) =>
      item.tipo === "EQUIPO_TRIPLE_21" &&
      (item.activo || item.id === equipoTriple21Id),
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
        <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-gold-100 text-4xl font-semibold text-gold-700 dark:bg-carbon-700 dark:text-gold-300">
          {fotoPrevia ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fotoPrevia}
              alt="Vista previa"
              className="h-full w-full object-cover"
            />
          ) : asesorActual?.avatarPathname ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={fotoVersion}
              src={`/api/asesores/${encodeURIComponent(asesorActual.telegramId)}/foto?v=${fotoVersion}`}
              alt={`Fotografía de ${nombre}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-label={`Sin fotografía para ${nombre || "el asesor"}`}>
              {nombre.trim().charAt(0).toUpperCase() || "A"}
            </span>
          )}
        </div>
        <label
          className={`mt-4 block rounded-md bg-gold-500 px-3 py-2 text-center text-sm font-medium text-carbon-950 ${
            subiendoFoto
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:bg-gold-300"
          }`}
        >
          {subiendoFoto
            ? "Subiendo fotografía..."
            : asesorActual?.avatarPathname || fotoPendiente
              ? "Cambiar fotografía"
              : "Seleccionar fotografía"}
          <input
            ref={archivoFotoRef}
            className="hidden"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={subirFoto}
            disabled={subiendoFoto}
          />
        </label>
        {estadoFoto && (
          <div className="mt-3" aria-live="polite">
            <div className="flex justify-between text-xs text-carbon-600 dark:text-gold-100/70">
              <span>{estadoFoto}</span>
              <span>{progresoFoto}%</span>
            </div>
            <div
              className="mt-1 h-2 overflow-hidden rounded-full bg-gold-100 dark:bg-carbon-700"
              role="progressbar"
              aria-label="Progreso de carga de la fotografía"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progresoFoto}
            >
              <div
                className="h-full rounded-full bg-gold-500 transition-[width] duration-200"
                style={{ width: `${progresoFoto}%` }}
              />
            </div>
          </div>
        )}
        <p className="mt-2 text-center text-xs text-carbon-500">
          JPG, PNG o WebP, máximo 3 MB.
        </p>
        <div className="mt-6 border-t border-gold-100 pt-5 text-sm dark:border-carbon-700">
          <p className="text-xs uppercase tracking-wide text-carbon-500">
            Oficina
          </p>
          <p className="mt-1 font-medium text-carbon-900 dark:text-gold-50">
            {nombreOficina?.trim() || "Oficina sin configurar"}
          </p>
          {!asesor && (
            <p className="mt-3 text-xs leading-5 text-carbon-500">
              La fotografía se cargará automáticamente después de registrar al
              asesor.
            </p>
          )}
        </div>
      </aside>

      <form
        onSubmit={guardar}
        className="grid min-w-0 gap-5 rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800 md:grid-cols-2 xl:p-8"
      >
        <label className="text-sm font-medium">
          ID de Telegram
          <input
            className={inputClass}
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            disabled={!!asesor}
            required
          />
        </label>
        <label className="text-sm font-medium">
          Nombre completo
          <input
            className={inputClass}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
        <label className="text-sm font-medium">
          Celular
          <input
            className={inputClass}
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            placeholder="+591 70000000"
          />
        </label>
        <label className="text-sm font-medium">
          Categoría
          <select
            className={inputClass}
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            required
          >
            {categorias
              .filter((item) => item.activo || item.id === categoriaId)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
          </select>
        </label>
        <>
          <label className="text-sm font-medium">
            Equipo Triple 21
            <select
              className={inputClass}
              value={equipoTriple21Id}
              onChange={(e) => setEquipoTriple21Id(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {equipos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Team
            <select
              className={inputClass}
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {teams.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </label>
        </>
        {mensajeOk && (
          <p
            className="md:col-span-2 rounded-md border border-signal-ok/40 bg-signal-ok/10 px-4 py-3 text-sm font-medium text-signal-ok"
            role="status"
            aria-live="polite"
          >
            {mensajeOk}
          </p>
        )}
        {error && (
          <p
            className="md:col-span-2 rounded-md border border-signal-danger/40 bg-signal-danger/10 px-4 py-3 text-sm text-signal-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        <div className="flex gap-3 md:col-span-2">
          <button
            disabled={guardando || subiendoFoto}
            className="rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 disabled:opacity-60"
          >
            {guardando || subiendoFoto
              ? "Guardando..."
              : asesor
                ? "Guardar cambios"
                : "Registrar asesor"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/dashboard/asesores")}
            className="rounded-md border border-gold-300 px-5 py-2.5"
          >
            Volver
          </button>
        </div>
      </form>
    </div>
  );
}
