"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye } from "lucide-react";
import type { UsuarioPublico } from "@/types/usuario";
import { AvatarUsuario } from "@/components/avatar-usuario";

export function GestionUsuarios({
  usuariosIniciales,
}: {
  usuariosIniciales: UsuarioPublico[];
}) {
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [notificacion, setNotificacion] = useState("");

  useEffect(() => {
    setUsuarios(usuariosIniciales);
  }, [usuariosIniciales]);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const creado = parametros.get("creado") === "1";
    const actualizado = parametros.get("actualizado") === "1";
    if (!creado && !actualizado) return;

    setNotificacion(
      actualizado
        ? "Usuario actualizado correctamente."
        : "Usuario creado correctamente.",
    );
    window.history.replaceState({}, "", "/dashboard/usuarios");
  }, []);

  return (
    <div className="space-y-4">
      {notificacion && (
        <div
          className="flex items-center gap-2 rounded-md bg-signal-ok/10 px-4 py-3 text-sm text-signal-ok"
          role="status"
        >
          <CheckCircle2 size={18} />
          {notificacion}
        </div>
      )}

      <div className="grid gap-3 md:hidden">
        {usuarios.map((usuario) => (
          <Tarjeta key={usuario.id} usuario={usuario} />
        ))}
      </div>

      <div className="shadow-panel hidden overflow-x-auto rounded-xl border border-gold-200 bg-white dark:border-carbon-700 dark:bg-carbon-800 md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gold-200 text-xs uppercase tracking-wide text-carbon-500 dark:border-carbon-700">
              <th className="px-4 py-3">Personal</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Acceso</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr
                key={usuario.id}
                className="border-b border-gold-100 dark:border-carbon-700/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <AvatarUsuario
                      nombre={usuario.nombre}
                      src={
                        usuario.avatarPathname
                          ? `/api/usuarios/${encodeURIComponent(usuario.username)}/avatar?v=${usuario.actualizadoEn}`
                          : undefined
                      }
                    />
                    <div>
                      <p className="font-medium">{usuario.nombre}</p>
                      <p className="text-xs text-carbon-500">
                        {usuario.cargo || "Sin cargo registrado"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p>{usuario.email || "Sin correo registrado"}</p>
                  <p className="text-xs text-carbon-500">
                    {usuario.celular || "Sin celular"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-mono text-xs">{usuario.username}</p>
                  <p className="text-xs text-carbon-500">{usuario.rol}</p>
                </td>
                <td className="px-4 py-3">
                  <Estado activo={usuario.activo} />
                </td>
                <td className="px-4 py-3 text-right">
                  <EnlacePerfil username={usuario.username} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EnlacePerfil({ username }: { username: string }) {
  return (
    <Link
      href={`/dashboard/usuarios/${encodeURIComponent(username)}`}
      className="focus-ring inline-flex items-center gap-2 rounded-md border border-gold-300 px-3 py-2 text-xs font-medium hover:bg-gold-50 dark:border-carbon-600 dark:hover:bg-carbon-700"
    >
      <Eye size={15} />
      Ver perfil
    </Link>
  );
}

function Tarjeta({ usuario }: { usuario: UsuarioPublico }) {
  return (
    <article className="shadow-panel rounded-xl border border-gold-200 bg-white p-4 dark:border-carbon-700 dark:bg-carbon-800">
      <div className="flex items-start gap-3">
        <AvatarUsuario
          nombre={usuario.nombre}
          src={
            usuario.avatarPathname
              ? `/api/usuarios/${encodeURIComponent(usuario.username)}/avatar?v=${usuario.actualizadoEn}`
              : undefined
          }
        />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{usuario.nombre}</p>
          <p className="text-xs text-carbon-500">
            {usuario.cargo || "Sin cargo"}
          </p>
        </div>
        <Estado activo={usuario.activo} />
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p>{usuario.email || "Sin correo"}</p>
        <p>{usuario.celular || "Sin celular"}</p>
        <p className="font-mono text-xs">
          {usuario.username} · {usuario.rol}
        </p>
      </div>
      <div className="mt-4">
        <EnlacePerfil username={usuario.username} />
      </div>
    </article>
  );
}

function Estado({ activo }: { activo: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
        activo
          ? "bg-signal-ok/15 text-signal-ok"
          : "bg-signal-danger/15 text-signal-danger"
      }`}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );
}
