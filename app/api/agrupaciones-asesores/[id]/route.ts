import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { obtenerSesionActual } from "@/lib/auth";
import { actualizarAgrupacion } from "@/lib/repositories/agrupaciones-asesor";
import { PERMISOS } from "@/types/domain";

const esquema = z
  .object({
    nombre: z.string().trim().min(2).max(80).optional(),
    activo: z.boolean().optional(),
    responsableTelegramId: z.string().trim().min(1).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0);

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const sesion = await obtenerSesionActual();
  if (!sesion)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!PERMISOS[sesion.rol].gestionarAsesores) {
    return NextResponse.json(
      { error: "No tienes permiso para gestionar agrupaciones." },
      { status: 403 },
    );
  }
  const parsed = esquema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  try {
    const resultado = await actualizarAgrupacion(params.id, parsed.data);
    return NextResponse.json({ ok: true, ...resultado });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar la agrupación.",
      },
      { status: 400 },
    );
  }
}
