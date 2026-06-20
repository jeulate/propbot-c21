import { listarCierres } from "@/lib/repositories/cierres";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";
import { TablaCierres } from "@/components/tabla-cierres";

export default async function CierresPage() {
  const sesion = await obtenerSesionActual();
  const { cierres } = await listarCierres({ cantidad: 200 });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-gold-50">Cierres registrados</h1>
        <p className="mt-1 text-sm text-gold-100/50">
          Listado completo de cierres capturados desde el bot de Telegram.
        </p>
      </header>

      <TablaCierres
        cierresIniciales={cierres}
        puedeVerificar={sesion ? PERMISOS[sesion.rol].verificar : false}
      />
    </div>
  );
}
