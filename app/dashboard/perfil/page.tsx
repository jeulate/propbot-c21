import { redirect } from "next/navigation";
import { obtenerSesionActual } from "@/lib/auth";
import { obtenerUsuarioAdminPorUsername } from "@/lib/repositories/usuarios-admin";
import { PerfilUsuario } from "@/components/perfil-usuario";
import { usuarioAPublico } from "@/types/usuario";

export default async function PerfilPage() {
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect("/login");
  const usuario = await obtenerUsuarioAdminPorUsername(sesion.sub);
  if (!usuario) redirect("/login");

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Mi perfil
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Actualiza tus datos personales, fotografía y contraseña.
        </p>
      </header>
      <PerfilUsuario usuarioInicial={usuarioAPublico(usuario)} />
    </div>
  );
}
