import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cambiarEstadoAsesor } from "@/lib/repositories/asesores";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";

const esquema = z.object({ activo: z.boolean() });

export async function PATCH(req: NextRequest, { params }: { params: { telegramId: string } }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!PERMISOS[sesion.rol].gestionarAsesores) {
    return NextResponse.json({ error: "No tienes permiso para gestionar asesores." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = esquema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });

  try {
    const asesor = await cambiarEstadoAsesor(params.telegramId, parsed.data.activo);
    return NextResponse.json({ ok: true, asesor });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 404 });
  }
}
