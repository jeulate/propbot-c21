import { NextRequest, NextResponse } from "next/server";
import { listarCierres } from "@/lib/repositories/cierres";
import { obtenerSesionActual } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sesion = await obtenerSesionActual();
  if (!sesion)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const desde = Number(searchParams.get("desde") ?? "0");
  const cantidad = Number(searchParams.get("cantidad") ?? "50");

  const resultado = await listarCierres({ desde, cantidad });
  return NextResponse.json(resultado);
}
