import { listarCierres } from "@/lib/repositories/cierres";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";
import { TablaCierres } from "@/components/tabla-cierres";

function normalizarPerPage(valor?: string): number {
  const numero = Number(valor);
  return [10, 20, 50].includes(numero) ? numero : 10;
}

function normalizarPagina(valor?: string): number {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : 1;
}

export default async function CierresPage({
  searchParams,
}: {
  searchParams?: {
    page?: string;
    perPage?: string;
  };
}) {
  const sesion = await obtenerSesionActual();

  const pagina = normalizarPagina(searchParams?.page);
  const perPage = normalizarPerPage(searchParams?.perPage);
  const desde = (pagina - 1) * perPage;

  const { cierres, total } = await listarCierres({
    desde,
    cantidad: perPage,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Cierres registrados
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Listado completo de cierres capturados desde el bot de Telegram.
        </p>
      </header>

      <TablaCierres
        cierresIniciales={cierres}
        puedeVerificar={sesion ? PERMISOS[sesion.rol].verificar : false}
        paginaActual={pagina}
        perPage={perPage}
        total={total}
      />
    </div>
  );
}