"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import type { UsuarioPublico } from "@/types/usuario";
import { AvatarUsuario } from "@/components/avatar-usuario";
import { notificarPerfilActualizado } from "@/components/eventos-perfil";

type RespuestaApi = {
  error?: string;
  usuario?: UsuarioPublico;
  ok?: boolean;
};

async function leerRespuestaJson(respuesta: Response): Promise<RespuestaApi> {
  const contenido = await respuesta.text();
  if (!contenido) return {};
  try {
    return JSON.parse(contenido) as RespuestaApi;
  } catch {
    return {};
  }
}

export function PerfilUsuario({
  usuarioInicial,
}: {
  usuarioInicial: UsuarioPublico;
}) {
  const [usuario, setUsuario] = useState(usuarioInicial);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [estadoCarga, setEstadoCarga] = useState("");
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [avatarVersion, setAvatarVersion] = useState(Date.now());
  const archivoRef = useRef<HTMLInputElement>(null);

  async function guardarPerfil(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCargando(true);
    setError("");
    setMensaje("");
    const form = new FormData(evento.currentTarget);
    try {
      const respuesta = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "perfil",
          nombre: form.get("nombre"),
          cargo: form.get("cargo"),
          email: form.get("email"),
          celular: form.get("celular"),
        }),
      });
      const data = await leerRespuestaJson(respuesta);
      if (!respuesta.ok || !data.usuario) {
        setError(data.error ?? "No se pudo guardar.");
        return;
      }
      setUsuario(data.usuario);
      notificarPerfilActualizado({ usuario: data.usuario });
      setMensaje("Datos personales actualizados.");
    } finally {
      setCargando(false);
    }
  }

  async function cambiarPassword(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setCargando(true);
    setError("");
    setMensaje("");
    const formulario = evento.currentTarget;
    const form = new FormData(formulario);
    try {
      const respuesta = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "password",
          passwordActual: form.get("passwordActual"),
          passwordNueva: form.get("passwordNueva"),
          confirmarPassword: form.get("confirmarPassword"),
        }),
      });
      const data = await leerRespuestaJson(respuesta);
      if (!respuesta.ok) {
        setError(data.error ?? "No se pudo cambiar.");
        return;
      }
      formulario.reset();
      setMensaje("Contraseña actualizada correctamente.");
    } finally {
      setCargando(false);
    }
  }

  function subirAvatar() {
    const archivo = archivoRef.current?.files?.[0];
    if (!archivo) {
      setError("Selecciona una fotografía.");
      return;
    }

    setCargando(true);
    setError("");
    setMensaje("");
    setProgreso(0);
    setEstadoCarga("Preparando");

    const formData = new FormData();
    formData.set("avatar", archivo);
    const solicitud = new XMLHttpRequest();
    solicitud.open("POST", "/api/perfil/avatar");

    solicitud.upload.addEventListener("progress", (evento) => {
      if (!evento.lengthComputable) return;
      const porcentaje = Math.round((evento.loaded / evento.total) * 100);
      setProgreso(porcentaje);
      setEstadoCarga(porcentaje < 100 ? "Subiendo" : "Procesando");
    });

    solicitud.addEventListener("load", () => {
      setCargando(false);
      let data: RespuestaApi = {};
      try {
        data = solicitud.responseText
          ? (JSON.parse(solicitud.responseText) as RespuestaApi)
          : {};
      } catch {
        data = {};
      }

      if (solicitud.status < 200 || solicitud.status >= 300) {
        setEstadoCarga("");
        setError(
          data.error ??
            `No se pudo subir la fotografía. Código ${solicitud.status}.`,
        );
        return;
      }

      const version = Date.now();
      const actualizado = data.usuario ?? {
        ...usuario,
        avatarPathname: "actualizado",
      };
      setUsuario(actualizado);
      setAvatarVersion(version);
      setProgreso(100);
      setEstadoCarga("Completado");
      setMensaje("Fotografía actualizada.");
      if (archivoRef.current) archivoRef.current.value = "";
      setNombreArchivo("");
      notificarPerfilActualizado({
        usuario: actualizado,
        avatarVersion: version,
      });
    });

    solicitud.addEventListener("error", () => {
      setCargando(false);
      setEstadoCarga("");
      setError("No se pudo conectar con el servidor para subir la fotografía.");
    });

    solicitud.send(formData);
  }

  async function eliminarAvatar() {
    setCargando(true);
    setError("");
    setMensaje("");
    try {
      const respuesta = await fetch("/api/perfil/avatar", { method: "DELETE" });
      const data = await leerRespuestaJson(respuesta);
      if (!respuesta.ok) {
        setError(data.error ?? "No se pudo eliminar la fotografía.");
        return;
      }
      const actualizado = data.usuario ?? {
        ...usuario,
        avatarPathname: undefined,
      };
      setUsuario(actualizado);
      setAvatarVersion(Date.now());
      setProgreso(0);
      setEstadoCarga("");
      setMensaje("Fotografía eliminada.");
      notificarPerfilActualizado({ usuario: actualizado });
    } finally {
      setCargando(false);
    }
  }

  const inputClass =
    "focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 dark:border-carbon-600 dark:bg-carbon-900";
  const panelClass =
    "shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800";

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <section className={panelClass}>
        <div className="flex flex-col items-center text-center">
          <AvatarUsuario
            nombre={usuario.nombre}
            src={
              usuario.avatarPathname
                ? `/api/perfil/avatar?v=${avatarVersion}`
                : undefined
            }
            className="h-28 w-28 text-2xl"
          />
          <h2 className="mt-4 text-lg font-semibold">{usuario.nombre}</h2>
          <p className="text-sm text-carbon-500 dark:text-gold-100/55">
            {usuario.cargo || "Cargo pendiente"}
          </p>
          <label className="focus-within:focus-ring mt-5 flex w-full cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gold-400 bg-gold-50 px-4 py-3 text-left transition-colors hover:bg-gold-100 dark:border-carbon-600 dark:bg-carbon-900/70 dark:hover:bg-carbon-700">
            <span className="rounded-md bg-gold-200/70 p-2 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300">
              <ImagePlus size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                Seleccionar fotografía
              </span>
              <span className="block truncate text-xs text-carbon-500 dark:text-gold-100/50">
                {nombreArchivo || "Ningún archivo seleccionado"}
              </span>
            </span>
            <input
              ref={archivoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={cargando}
              onChange={(evento) =>
                setNombreArchivo(evento.target.files?.[0]?.name ?? "")
              }
              className="sr-only"
            />
          </label>
          <button
            type="button"
            onClick={subirAvatar}
            disabled={cargando}
            className="mt-3 w-full rounded-md bg-gold-500 px-4 py-2 font-medium text-carbon-950 disabled:opacity-60"
          >
            {cargando && estadoCarga ? "Cargando..." : "Subir fotografía"}
          </button>
          {estadoCarga && (
            <div className="mt-4 w-full text-left" aria-live="polite">
              <div className="mb-1 flex justify-between text-xs">
                <span>{estadoCarga}</span>
                <span>{progreso}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gold-100 dark:bg-carbon-700">
                <div
                  className="h-full rounded-full bg-gold-500 transition-[width]"
                  style={{ width: `${progreso}%` }}
                />
              </div>
            </div>
          )}
          {usuario.avatarPathname && (
            <button
              type="button"
              onClick={eliminarAvatar}
              disabled={cargando}
              className="mt-3 text-sm text-signal-danger disabled:opacity-60"
            >
              Eliminar fotografía
            </button>
          )}
          <p className="mt-3 text-xs text-carbon-500">
            JPG, PNG o WebP. Máximo 3 MB.
          </p>
        </div>
      </section>

      <div className="space-y-6">
        {(mensaje || error) && (
          <p
            className={`rounded-md px-4 py-3 text-sm ${
              error
                ? "bg-signal-danger/10 text-signal-danger"
                : "bg-signal-ok/10 text-signal-ok"
            }`}
          >
            {error || mensaje}
          </p>
        )}
        <form onSubmit={guardarPerfil} className={panelClass}>
          <h2 className="text-lg font-semibold">Información personal</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Campo
              label="Nombre completo"
              name="nombre"
              defaultValue={usuario.nombre}
              className={inputClass}
            />
            <Campo
              label="Cargo"
              name="cargo"
              defaultValue={usuario.cargo}
              className={inputClass}
            />
            <Campo
              label="Correo electrónico"
              name="email"
              type="email"
              defaultValue={usuario.email}
              className={inputClass}
            />
            <Campo
              label="Celular"
              name="celular"
              type="tel"
              defaultValue={usuario.celular ?? ""}
              className={inputClass}
              required={false}
            />
          </div>
          <button
            disabled={cargando}
            className="mt-5 rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 disabled:opacity-60"
          >
            Guardar datos
          </button>
        </form>

        <form onSubmit={cambiarPassword} className={panelClass}>
          <h2 className="text-lg font-semibold">Seguridad</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Campo
              label="Contraseña actual"
              name="passwordActual"
              type="password"
              className={inputClass}
            />
            <Campo
              label="Nueva contraseña"
              name="passwordNueva"
              type="password"
              className={inputClass}
            />
            <Campo
              label="Confirmar contraseña"
              name="confirmarPassword"
              type="password"
              className={inputClass}
            />
          </div>
          <button
            disabled={cargando}
            className="mt-5 rounded-md border border-gold-400 px-5 py-2.5 font-medium disabled:opacity-60"
          >
            Cambiar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

function Campo({
  label,
  name,
  type = "text",
  defaultValue,
  className,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  className: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className={className}
      />
    </label>
  );
}
