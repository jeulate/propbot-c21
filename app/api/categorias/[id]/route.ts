import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  actualizarCategoriaAsesor,
  cambiarEstadoCategoriaAsesor,
  eliminarCategoriaAsesor,
} from "@/lib/repositories/categorias-asesor";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";

const esquema = z
  .object({
    nombre: z.string().trim().min(2).max(80).optional(),
    porcentajeComision: z.number().min(0).max(100).optional(),
    activo: z.boolean().optional(),
  })
  .refine((datos) => Object.keys(datos).length > 0, {
    message: "Debes enviar al menos un cambio.",
  });

async function autorizar() {
  const sesion = await obtenerSesionActual();

  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!PERMISOS[sesion.rol].gestionarAsesores) {
    return NextResponse.json(
      { error: "No tienes permiso para gestionar configuración." },
      { status: 403 },
    );
  }

  return null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const respuestaAutorizacion = await autorizar();
  if (respuestaAutorizacion) return respuestaAutorizacion;

  const body = await req.json().catch(() => null);
  const parsed = esquema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  try {
    let categoria = await actualizarCategoriaAsesor(params.id, {
      nombre: parsed.data.nombre,
      porcentajeComision: parsed.data.porcentajeComision,
    });

    if (parsed.data.activo !== undefined) {
      categoria = await cambiarEstadoCategoriaAsesor(
        params.id,
        parsed.data.activo,
      );
    }

    return NextResponse.json({ ok: true, categoria });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido.";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const respuestaAutorizacion = await autorizar();
  if (respuestaAutorizacion) return respuestaAutorizacion;

  try {
    await eliminarCategoriaAsesor(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido.";
    return NextResponse.json({ error: mensaje }, { status: 409 });
  }
}
