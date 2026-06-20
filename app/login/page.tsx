import { redirect } from "next/navigation";
import { obtenerSesionActual } from "@/lib/auth";
import { FormularioLogin } from "@/components/formulario-login";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  const sesion = await obtenerSesionActual();
  if (sesion) redirect("/dashboard");

  const destino = searchParams.from ?? "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-500">Century 21 Rita Quiroga</p>
          <h1 className="font-display mt-2 text-3xl font-semibold text-gold-50">
            Control de Cierres
          </h1>
          <p className="mt-2 text-sm text-gold-100/60">
            Acceso administrativo · Solo personal autorizado
          </p>
        </div>

        <div className="shadow-panel rounded-xl border border-carbon-700 bg-carbon-800 p-7">
          <FormularioLogin destino={destino} />
        </div>
      </div>
    </main>
  );
}
