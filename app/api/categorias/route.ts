import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearCategoriaAsesor, listarCategoriasAsesor } from "@/lib/repositories/categorias-asesor";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";

const esquemaCrear = z.object({
  nombre: z.string().min(2),
  porcentajeComision: z.number().gt(0).lte(100),
});

export async function GET() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const categorias = await listarCategoriasAsesor();
  return NextResponse.json({ categorias });
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!PERMISOS[sesion.rol].gestionarAsesores) {
    return NextResponse.json({ error: "No tienes permiso para gestionar configuracion." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = esquemaCrear.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos. Verifica nombre y porcentaje de comision." },
      { status: 400 }
    );
  }

  try {
    const categoria = await crearCategoriaAsesor(parsed.data);
    return NextResponse.json({ ok: true, categoria });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
