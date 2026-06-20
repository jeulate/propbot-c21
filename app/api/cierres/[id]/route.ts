import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { actualizarEstadoCierre } from "@/lib/repositories/cierres";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";
import { notificarCierreVerificado } from "@/lib/bot/notificaciones";

const esquema = z.object({
  estado: z.enum(["PENDIENTE_REVISION", "VERIFICADO", "RECHAZADO"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!PERMISOS[sesion.rol].verificar) {
    return NextResponse.json({ error: "No tienes permiso para verificar cierres." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = esquema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  try {
    const cierre = await actualizarEstadoCierre(params.id, parsed.data.estado);

    if (parsed.data.estado === "VERIFICADO") {
      await notificarCierreVerificado(cierre);
    }

    return NextResponse.json({ ok: true, cierre });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 404 });
  }
}
