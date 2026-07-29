import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { obtenerSesionActual } from "@/lib/auth";
import {
  crearAgrupacion,
  listarAgrupaciones,
} from "@/lib/repositories/agrupaciones-asesor";
import { listarAsesores } from "@/lib/repositories/asesores";
import { PERMISOS } from "@/types/domain";

const esquema = z.object({
  nombre: z.string().trim().min(2).max(80),
  tipo: z.enum(["TEAM", "EQUIPO_TRIPLE_21"]),
});

export async function GET() {
  const sesion = await obtenerSesionActual();
  if (!sesion)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  return NextResponse.json({
    agrupaciones: await listarAgrupaciones(),
    asesores: await listarAsesores(),
  });
}

export async function POST(req: NextRequest) {
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
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Indica un nombre válido y el tipo de agrupación." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json({
      ok: true,
      agrupacion: await crearAgrupacion(parsed.data),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear la agrupación.",
      },
      { status: 400 },
    );
  }
}
