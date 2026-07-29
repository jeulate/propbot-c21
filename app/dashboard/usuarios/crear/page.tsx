import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { CrearUsuario } from "@/components/crear-usuario";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";

export default async function CrearUsuarioPage() {
  const sesion = await obtenerSesionActual();
  if (!sesion || !PERMISOS[sesion.rol].gestionarUsuarios) {
    redirect("/dashboard");
  }

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
          Crear usuario
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Registra las credenciales y los datos internos del nuevo usuario.
        </p>
      </header>

      <CrearUsuario />
    </div>
  );
}
