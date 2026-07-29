import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { obtenerSesionActual } from "@/lib/auth";
import { obtenerUsuarioAdminPorUsername } from "@/lib/repositories/usuarios-admin";
import { PERMISOS } from "@/types/domain";
import { usuarioAPublico } from "@/types/usuario";
import { PerfilUsuarioAdmin } from "@/components/perfil-usuario-admin";

export default async function UsuarioDetallePage({
  params,
}: {
  params: { username: string };
}) {
  const sesion = await obtenerSesionActual();
  if (!sesion || !PERMISOS[sesion.rol].gestionarUsuarios) {
    redirect("/dashboard");
  }

  const usuario = await obtenerUsuarioAdminPorUsername(
    decodeURIComponent(params.username),
  );
  if (!usuario) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link
          href="/dashboard/usuarios"
          className="mb-3 inline-flex items-center gap-2 text-sm text-carbon-600 hover:text-gold-600 dark:text-gold-100/60"
        >
          <ArrowLeft size={16} />
          Volver a usuarios
        </Link>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Perfil del usuario
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Consulta y administra sus datos, permisos y estado de acceso.
        </p>
      </header>
      <PerfilUsuarioAdmin usuarioInicial={usuarioAPublico(usuario)} />
    </div>
  );
}
