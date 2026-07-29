import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { listarAsesores, registrarAsesor } from "@/lib/repositories/asesores";
import { listarCategoriasAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";
import { listarAgrupaciones } from "@/lib/repositories/agrupaciones-asesor";

const esquemaCrear = z.object({
  telegramId: z.string().min(1),
  nombre: z.string().min(2),
  categoriaId: z.string().min(1),
  celular: z.string().trim().max(30).optional(),
  teamId: z.string().nullable().optional(),
  equipoTriple21Id: z.string().nullable().optional(),
});

export async function GET() {
  const sesion = await obtenerSesionActual();
  if (!sesion)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const asesores = await listarAsesores();
  const categorias = await listarCategoriasAsesor();
  return NextResponse.json({
    asesores,
    categorias,
    agrupaciones: await listarAgrupaciones(),
  });
}

export async function POST(req: NextRequest) {
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
  const parsed = esquemaCrear.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos. Verifica telegramId y nombre." },
      { status: 400 },
    );
  }

  try {
    const asesor = await registrarAsesor({
      ...parsed.data,
      agregadoPorAdminId: sesion.sub,
    });
    return NextResponse.json({ ok: true, asesor });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
