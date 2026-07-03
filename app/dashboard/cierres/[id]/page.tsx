import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { obtenerSesionActual } from "@/lib/auth";
import { actualizarEstadoCierre, obtenerCierre } from "@/lib/repositories/cierres";
import { PERMISOS, type Cierre } from "@/types/domain";
import { formatearFechaHoraBolivia } from "@/lib/fechas";
import { ComprobantePagoPreview } from "@/components/comprobante-pago-preview";
import { AccionesValidacionCierre } from "@/components/acciones-validacion-cierre";

function formatoBs(valor?: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 2,
  }).format(valor ?? 0)}`;
}

async function verificarCierre(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  await actualizarEstadoCierre(id, "VERIFICADO");

  revalidatePath(`/dashboard/cierres/${id}`);
  revalidatePath("/dashboard/cierres");
  revalidatePath("/dashboard");
}

async function rechazarCierre(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  await actualizarEstadoCierre(id, "RECHAZADO");

  revalidatePath(`/dashboard/cierres/${id}`);
  revalidatePath("/dashboard/cierres");
  revalidatePath("/dashboard");
}

export default async function DetalleCierrePage({
  params,
}: {
  params: { id: string };
}) {
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect("/login");

  const cierre = await obtenerCierre(params.id);
  if (!cierre) notFound();

  const puedeVerificar = PERMISOS[sesion.rol].verificar;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/dashboard/cierres"
          className="focus-ring text-sm font-medium text-gold-600 hover:text-gold-700 dark:text-gold-400 dark:hover:text-gold-300"
        >
          ← Volver a cierres
        </Link>

        <h1 className="mt-4 font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Detalle del cierre {cierre.id}
        </h1>

        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Revisa la comisión calculada y compárala con el comprobante antes de aprobar.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Panel titulo="Información del cierre">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Dato label="ID inmueble" valor={cierre.id} />
              <Dato label="Estado" valor={<EstadoBadge estado={cierre.estado} />} />
              <Dato label="Fecha cierre declarada" valor={cierre.fechaCierre} />
              <Dato label="Fecha registro sistema" valor={formatearFechaHoraBolivia(cierre.creadoEn)} />
              <Dato label="Tipo transacción" valor={cierre.tipoTransaccion} />
              <Dato label="Exclusiva" valor={cierre.exclusiva ? "Sí" : "No"} />
              <Dato label="Dirección" valor={cierre.direccionInmueble} className="md:col-span-2" />

              {cierre.tituloPropiedad && (
                <Dato label="Propiedad" valor={cierre.tituloPropiedad} className="md:col-span-2" />
              )}

              {cierre.urlPropiedad && (
                <Dato
                  label="URL propiedad"
                  className="md:col-span-2"
                  valor={
                    <a
                      href={cierre.urlPropiedad}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gold-600 hover:underline dark:text-gold-400"
                    >
                      Ver propiedad
                    </a>
                  }
                />
              )}
            </div>
          </Panel>

          <Panel titulo="Asesores" className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Dato label="Asesor captador" valor={cierre.asesorCaptadorNombre} />
              <Dato label="Asesor colocador" valor={cierre.asesorColocadorNombre} />
              <Dato label="Oficina captador" valor={cierre.asesorCaptadorOficina ?? "-"} />
              <Dato label="Oficina colocador" valor={cierre.asesorColocadorOficina ?? "-"} />
              <Dato label="Tel. captador" valor={cierre.asesorCaptadorTelefono ?? "-"} />
              <Dato label="Tel. colocador" valor={cierre.asesorColocadorTelefono ?? "-"} />
            </div>
          </Panel>

          <Panel titulo="Propietario y cliente" className="mt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Dato label="Propietario" valor={cierre.nombrePropietario} />
              <Dato label="Tel. propietario" valor={cierre.telPropietario} />
              <Dato label="Cliente" valor={cierre.nombreCliente} />
              <Dato label="Tel. cliente" valor={cierre.telCliente} />
            </div>
          </Panel>
        </div>

        <aside className="xl:col-span-4">
          <Panel titulo="Validación administrativa">
            <div className="space-y-3">
              <ResumenMonto label="Monto transacción" valor={formatoBs(cierre.montoTransaccion)} />
              <ResumenMonto label="Comisión registrada" valor={formatoBs(cierre.montoComision)} destaque />
              <ResumenMonto label="Oficina nacional" valor={formatoBs(cierre.montoPagoOficinaNacional)} />
              <ResumenMonto label="Oficina local" valor={formatoBs(cierre.montoPagoOficinaLocal)} />
              <ResumenMonto label="Pago real asesor" valor={formatoBs(cierre.montoPagoRealAsesor)} />
            </div>

            <div className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-4 dark:border-carbon-700 dark:bg-carbon-900">
              <p className="text-sm font-medium text-carbon-900 dark:text-gold-50">
                Comprobante de pago
              </p>

              {cierre.comprobantePagoFileId ? (
                  <ComprobantePagoPreview fileId={cierre.comprobantePagoFileId} />
                ) : (
                  <p className="mt-2 text-sm text-signal-danger">
                    No se registró comprobante.
                  </p>
                )}
            </div>

            {puedeVerificar && (
              <AccionesValidacionCierre
                cierreId={cierre.id}
                verificarAction={verificarCierre}
                rechazarAction={rechazarCierre}
              />
            )}
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function Panel({
  titulo,
  children,
  className = "",
}: {
  titulo: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800 ${className}`}>
      <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
        {titulo}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Dato({
  label,
  valor,
  className = "",
}: {
  label: string;
  valor: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs uppercase tracking-wide text-carbon-500 dark:text-gold-100/40">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-carbon-900 dark:text-gold-50">
        {valor}
      </div>
    </div>
  );
}

function ResumenMonto({
  label,
  valor,
  destaque = false,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-gold-50 px-4 py-3 dark:bg-carbon-900">
      <span className="text-sm text-carbon-600 dark:text-gold-100/60">{label}</span>
      <span className={destaque ? "font-semibold text-gold-700 dark:text-gold-300" : "font-semibold text-carbon-900 dark:text-gold-50"}>
        {valor}
      </span>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: Cierre["estado"] }) {
  const estilos: Record<Cierre["estado"], string> = {
    PENDIENTE_REVISION: "bg-signal-warn/15 text-signal-warn",
    VERIFICADO: "bg-signal-ok/15 text-signal-ok",
    RECHAZADO: "bg-signal-danger/15 text-signal-danger",
  };

  const etiquetas: Record<Cierre["estado"], string> = {
    PENDIENTE_REVISION: "Pendiente",
    VERIFICADO: "Verificado",
    RECHAZADO: "Rechazado",
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado]}`}>
      {etiquetas[estado]}
    </span>
  );
}