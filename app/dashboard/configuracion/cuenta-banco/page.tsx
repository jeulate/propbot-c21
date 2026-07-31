import { GestionCuentaComision } from "@/components/gestion-cuenta-comision";
import { obtenerCuentaComision } from "@/lib/repositories/cuenta-comision";

export default async function CuentaBancoPage() {
  const cuentaComision = await obtenerCuentaComision();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold text-carbon-900 dark:text-gold-50">
          Cuenta de Banco
        </h1>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Administra la cuenta utilizada para el pago de comisiones.
        </p>
      </header>

      <GestionCuentaComision cuentaInicial={cuentaComision} />
    </div>
  );
}
