import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  actualizarPorcentajeOficinaNacional,
  obtenerConfiguracionComisiones,
} from "@/lib/repositories/configuracion-comisiones";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";

const esquemaActualizar = z.object({
  porcentajeOficinaNacional: z.number().min(0).max(100),
});

export async function GET() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const configuracion = await obtenerConfiguracionComisiones();
  return NextResponse.json({ configuracion });
}

export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!PERMISOS[sesion.rol].gestionarAsesores) {
    return NextResponse.json({ error: "No tienes permiso para gestionar configuracion." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = esquemaActualizar.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos. El porcentaje debe estar entre 0 y 100." },
      { status: 400 }
    );
  }

  try {
    const configuracion = await actualizarPorcentajeOficinaNacional(
      parsed.data.porcentajeOficinaNacional
    );
    return NextResponse.json({ ok: true, configuracion });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
