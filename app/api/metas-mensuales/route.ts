import { NextResponse } from "next/server";
import {
  guardarMetaMensual,
  listarMetasMensuales,
} from "@/lib/repositories/metas-mensuales";

export async function GET() {
  const metas = await listarMetasMensuales();
  return NextResponse.json({ metas });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const anio = Number(body.anio);
    const mes = Number(body.mes);
    const montoObjetivo = Number(body.montoObjetivo);

    const meta = await guardarMetaMensual({
      anio,
      mes,
      montoObjetivo,
    });

    return NextResponse.json({ meta });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "No se pudo guardar la meta.";

    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}