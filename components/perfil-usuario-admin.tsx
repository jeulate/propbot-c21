"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AvatarUsuario } from "@/components/avatar-usuario";
import type { UsuarioPublico } from "@/types/usuario";

const FECHA = new Intl.DateTimeFormat("es-BO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/La_Paz",
});

export function PerfilUsuarioAdmin({
  usuarioInicial,
}: {
  usuarioInicial: UsuarioPublico;
}) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(usuarioInicial);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cambioPendiente, setCambioPendiente] = useState<{
    datos: DatosActualizacion;
    nuevoEstado: boolean;
  } | null>(null);

  async function ejecutarGuardado(datos: DatosActualizacion) {
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      const respuesta = await fetch(
        `/api/usuarios/${encodeURIComponent(usuario.username)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datos),
        },
      );
      const contenido = await respuesta.text();
      const data = contenido
        ? (JSON.parse(contenido) as {
            error?: string;
            usuario?: UsuarioPublico;
          })
        : {};
      if (!respuesta.ok || !data.usuario) {
        setError(data.error ?? "No se pudo guardar el usuario.");
        return;
      }
      setUsuario(data.usuario);
      setCambioPendiente(null);
      router.push("/dashboard/usuarios?actualizado=1");
      router.refresh();
    } catch {
      setError("No se pudo procesar la respuesta del servidor.");
    } finally {
      setGuardando(false);
    }
  }

  function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const form = new FormData(evento.currentTarget);
    const datos: DatosActualizacion = {
      nombre: String(form.get("nombre") ?? ""),
      cargo: String(form.get("cargo") ?? ""),
      email: String(form.get("email") ?? ""),
      celular: String(form.get("celular") ?? ""),
      rol: String(form.get("rol") ?? ""),
      activo: form.get("activo") === "true",
    };

    if (datos.activo !== usuario.activo) {
      setCambioPendiente({ datos, nuevoEstado: datos.activo });
      return;
    }

    void ejecutarGuardado(datos);
  }

  const panel =
    "shadow-panel rounded-xl border border-gold-200 bg-white dark:border-carbon-700 dark:bg-carbon-800";
  const input =
    "focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 dark:border-carbon-600 dark:bg-carbon-900";

  return (
    <div className="space-y-6">
      <section className={`${panel} overflow-hidden`}>
        <div className="h-28 bg-gradient-to-r from-carbon-900 via-carbon-800 to-gold-600" />
        <div className="px-6 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-4 sm:flex-row sm:items-end">
            <AvatarUsuario
              nombre={usuario.nombre}
              src={
                usuario.avatarPathname
                  ? `/api/usuarios/${encodeURIComponent(usuario.username)}/avatar?v=${usuario.actualizadoEn}`
                  : undefined
              }
              className="h-28 w-28 border-4 border-white text-2xl shadow-lg dark:border-carbon-800"
            />
            <div className="min-w-0 flex-1 sm:pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{usuario.nombre}</h2>
                <Estado activo={usuario.activo} />
              </div>
              <p className="text-sm text-carbon-500 dark:text-gold-100/55">
                {usuario.cargo || "Sin cargo"} · @{usuario.username}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
            <Dato
              icono={<Mail size={17} />}
              etiqueta="Correo"
              valor={usuario.email || "Sin correo"}
            />
            <Dato
              icono={<Phone size={17} />}
              etiqueta="Celular"
              valor={usuario.celular || "Sin celular"}
            />
            <Dato
              icono={<ShieldCheck size={17} />}
              etiqueta="Rol"
              valor={usuario.rol}
            />
            <Dato
              icono={<CalendarDays size={17} />}
              etiqueta="Creado"
              valor={FECHA.format(new Date(usuario.creadoEn))}
            />
          </div>
        </div>
      </section>

      {(mensaje || error) && (
        <p
          className={`rounded-md px-4 py-3 text-sm ${error ? "bg-signal-danger/10 text-signal-danger" : "bg-signal-ok/10 text-signal-ok"}`}
        >
          {error || mensaje}
        </p>
      )}

      <form onSubmit={guardar} className={`${panel} p-6`}>
        <div className="flex items-center gap-2">
          <UserRound size={20} />
          <h2 className="text-lg font-semibold">Información y acceso</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Campo
            label="Nombre completo"
            name="nombre"
            defaultValue={usuario.nombre}
            className={input}
          />
          <Campo
            label="Cargo"
            name="cargo"
            defaultValue={usuario.cargo}
            className={input}
          />
          <Campo
            label="Correo electrónico"
            name="email"
            type="email"
            defaultValue={usuario.email}
            className={input}
          />
          <Campo
            label="Celular"
            name="celular"
            type="tel"
            defaultValue={usuario.celular ?? ""}
            className={input}
            required={false}
          />
          <label className="text-sm font-medium">
            Rol
            <select name="rol" defaultValue={usuario.rol} className={input}>
              <option value="ADMIN">Administrador</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="LECTOR">Solo lectura</option>
            </select>
          </label>
          <label className="text-sm font-medium">
            Estado de acceso
            <select
              name="activo"
              defaultValue={String(usuario.activo)}
              className={input}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
          </label>
        </div>
        <div className="mt-5 rounded-lg bg-gold-50 p-4 text-sm dark:bg-carbon-900/60">
          <p>
            <span className="font-medium">Usuario:</span> {usuario.username}
          </p>
          <p className="mt-1 text-carbon-500 dark:text-gold-100/50">
            Última actualización:{" "}
            {FECHA.format(new Date(usuario.actualizadoEn))}
          </p>
        </div>
        <button
          disabled={guardando}
          className="mt-5 rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      {cambioPendiente && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-carbon-950/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-confirmar-estado"
        >
          <div className="w-full max-w-md rounded-xl border border-gold-200 bg-white p-6 shadow-2xl dark:border-carbon-600 dark:bg-carbon-800">
            <div className="flex items-start gap-3">
              <span className="rounded-full bg-gold-100 p-2 text-gold-700 dark:bg-gold-500/15 dark:text-gold-300">
                <AlertTriangle size={22} />
              </span>
              <div>
                <h2
                  id="titulo-confirmar-estado"
                  className="text-lg font-semibold"
                >
                  Confirmar cambio de estado
                </h2>
                <p className="mt-2 text-sm text-carbon-600 dark:text-gold-100/60">
                  {cambioPendiente.nuevoEstado
                    ? `Se activará la cuenta de ${usuario.nombre}. El usuario recuperará el acceso al sistema.`
                    : `Se desactivará la cuenta de ${usuario.nombre}. El usuario ya no podrá iniciar sesión.`}
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setCambioPendiente(null)}
                disabled={guardando}
                className="focus-ring rounded-md border border-gold-300 px-4 py-2 text-sm font-medium dark:border-carbon-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void ejecutarGuardado(cambioPendiente.datos)}
                disabled={guardando}
                className="focus-ring rounded-md bg-gold-500 px-4 py-2 text-sm font-medium text-carbon-950 disabled:opacity-60"
              >
                {guardando ? "Actualizando..." : "Confirmar cambio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type DatosActualizacion = {
  nombre: string;
  cargo: string;
  email: string;
  celular: string;
  rol: string;
  activo: boolean;
};

function Dato({
  icono,
  etiqueta,
  valor,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  valor: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-lg bg-gold-50 p-3 dark:bg-carbon-900/50">
      <span className="mt-0.5 text-gold-600">{icono}</span>
      <div className="min-w-0">
        <p className="text-xs text-carbon-500">{etiqueta}</p>
        <p className="truncate font-medium">{valor}</p>
      </div>
    </div>
  );
}

function Estado({ activo }: { activo: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${activo ? "bg-signal-ok/15 text-signal-ok" : "bg-signal-danger/15 text-signal-danger"}`}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
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
