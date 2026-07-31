import { GestionCaptacionesMensuales } from "@/components/gestion-captaciones-mensuales";
import { listarAsesores } from "@/lib/repositories/asesores";
import { listarCaptacionesMensuales } from "@/lib/repositories/captaciones-mensuales";

export default async function RegistroCaptacionesPage() {
  const [asesores, captaciones] = await Promise.all([
    listarAsesores(),
    listarCaptacionesMensuales(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Registro de Captaciones
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Registra y consulta las captaciones mensuales de cada asesor.
        </p>
      </header>

      <GestionCaptacionesMensuales
        asesores={asesores}
        captacionesIniciales={captaciones}
      />
    </div>
  );
}
