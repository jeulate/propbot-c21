import { kv, KEYS } from "@/lib/redis";
import type { CuentaComision } from "@/types/domain";

const CUENTA_KEY = KEYS.cuentaComision;

export async function obtenerCuentaComision(): Promise<CuentaComision | null> {
  return await kv.get<CuentaComision>(CUENTA_KEY);
}

export async function guardarCuentaComision(
  input: Omit<CuentaComision, "actualizadoEn">
): Promise<CuentaComision> {
  const cuenta: CuentaComision = {
    banco: input.banco.trim(),
    cuenta: input.cuenta.trim(),
    titular: input.titular.trim(),
    nitCi: input.nitCi.trim(),
    actualizadoEn: new Date().toISOString(),
  };

  if (!cuenta.banco || !cuenta.cuenta || !cuenta.titular || !cuenta.nitCi) {
    throw new Error("Todos los datos de la cuenta son obligatorios.");
  }

  await kv.set(CUENTA_KEY, cuenta);
  return cuenta;
}

export async function eliminarCuentaComision(): Promise<void> {
  await kv.del(CUENTA_KEY);
}