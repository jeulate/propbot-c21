import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { GestionUsuarios } from "@/components/gestion-usuarios";
import { obtenerSesionActual } from "@/lib/auth";
import { listarUsuariosAdmin } from "@/lib/repositories/usuarios-admin";
import { PERMISOS } from "@/types/domain";
import { usuarioAPublico } from "@/types/usuario";

export default async function UsuariosPage() {
  const sesion = await obtenerSesionActual();
  if (!sesion || !PERMISOS[sesion.rol].gestionarUsuarios) {
    redirect("/dashboard");
  }

  const usuarios = await listarUsuariosAdmin();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
            Usuarios del sistema
          </h1>
          <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
            Consulta al personal y administra sus credenciales, roles y estado.
          </p>
        </div>
        <Link
          href="/dashboard/usuarios/crear"
          className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-gold-500 px-4 py-2.5 font-medium text-carbon-950 hover:bg-gold-400"
        >
          <Plus size={18} />
          Crear usuario
        </Link>
      </header>

      <GestionUsuarios usuariosIniciales={usuarios.map(usuarioAPublico)} />
    </div>
  );
}
