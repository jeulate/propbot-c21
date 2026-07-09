import { kv, KEYS } from "@/lib/redis";
import type { ObjetivosOficina, ObjetivosOficinaInput } from "@/types/domain";

const OBJETIVOS_KEY = KEYS.objetivosOficina;

const OBJETIVOS_DEFAULT: ObjetivosOficina = {
  centurion: 2300000,
  dobleCenturion: 5000000,
  grandCenturion: 11000000,
  actualizadoEn: new Date().toISOString(),
};

export async function obtenerObjetivosOficina(): Promise<ObjetivosOficina> {
  return (await kv.get<ObjetivosOficina>(OBJETIVOS_KEY)) ?? OBJETIVOS_DEFAULT;
}

export async function guardarObjetivosOficina(
  input: ObjetivosOficinaInput
): Promise<ObjetivosOficina> {
  const objetivos: ObjetivosOficina = {
    centurion: Number(input.centurion),
    dobleCenturion: Number(input.dobleCenturion),
    grandCenturion: Number(input.grandCenturion),
    actualizadoEn: new Date().toISOString(),
  };

  if (
    objetivos.centurion <= 0 ||
    objetivos.dobleCenturion <= 0 ||
    objetivos.grandCenturion <= 0
  ) {
    throw new Error("Todos los objetivos deben ser mayores a 0.");
  }

  await kv.set(OBJETIVOS_KEY, objetivos);
  return objetivos;
}