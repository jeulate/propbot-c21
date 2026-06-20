import { redirect } from "next/navigation";
import { listarUsuariosAdmin } from "@/lib/repositories/usuarios-admin";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";
import { GestionUsuarios } from "@/components/gestion-usuarios";

export default async function UsuariosPage() {
  const sesion = await obtenerSesionActual();
  if (!sesion || !PERMISOS[sesion.rol].gestionarUsuarios) redirect("/dashboard");

  const usuarios = await listarUsuariosAdmin();
  const sinHash = usuarios.map(({ passwordHash, ...resto }) => resto);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-gold-50">Usuarios del sistema</h1>
        <p className="mt-1 text-sm text-gold-100/50">
          Administra quién puede acceder al dashboard y con qué nivel de permisos.
        </p>
      </header>

      <GestionUsuarios usuariosIniciales={sinHash} />
    </div>
  );
}
