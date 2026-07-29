import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  cambiarAgrupacionesAsesor,
  cambiarCategoriaAsesor,
  cambiarEstadoAsesor,
  actualizarPerfilAsesor,
} from "@/lib/repositories/asesores";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";

const esquema = z
  .object({
    activo: z.boolean().optional(),
    categoriaId: z.string().min(1).optional(),
    teamId: z.string().min(1).nullable().optional(),
    equipoTriple21Id: z.string().min(1).nullable().optional(),
    nombre: z.string().trim().min(2).max(120).optional(),
    celular: z.string().trim().max(30).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo a actualizar.",
  });

export async function PATCH(
  req: NextRequest,
  { params }: { params: { telegramId: string } },
) {
  const sesion = await obtenerSesionActual();
  if (!sesion)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!PERMISOS[sesion.rol].gestionarAsesores) {
    return NextResponse.json(
      { error: "No tienes permiso para gestionar asesores." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = esquema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  try {
    let asesor;
    if (parsed.data.nombre !== undefined || parsed.data.celular !== undefined) {
      asesor = await actualizarPerfilAsesor(params.telegramId, {
        nombre: parsed.data.nombre,
        celular: parsed.data.celular,
      });
    }
    if (parsed.data.categoriaId) {
      asesor = await cambiarCategoriaAsesor(
        params.telegramId,
        parsed.data.categoriaId,
      );
    }
    if (parsed.data.activo !== undefined) {
      asesor = await cambiarEstadoAsesor(params.telegramId, parsed.data.activo);
    }
    if (
      parsed.data.teamId !== undefined ||
      parsed.data.equipoTriple21Id !== undefined
    ) {
      asesor = await cambiarAgrupacionesAsesor(params.telegramId, {
        teamId: parsed.data.teamId,
        equipoTriple21Id: parsed.data.equipoTriple21Id,
      });
    }

    return NextResponse.json({ ok: true, asesor });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 404 });
  }
}
