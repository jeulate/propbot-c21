import { NextResponse } from "next/server";
import {
  guardarCaptacionMensual,
  listarCaptacionesMensuales,
} from "@/lib/repositories/captaciones-mensuales";

export async function GET() {
  const captaciones = await listarCaptacionesMensuales();
  return NextResponse.json({ captaciones });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const captacion = await guardarCaptacionMensual({
      anio: Number(body.anio),
      mes: Number(body.mes),
      asesorTelegramId: String(body.asesorTelegramId ?? ""),
      asesorNombre: String(body.asesorNombre ?? ""),
      cantidad: Number(body.cantidad),
    });

    return NextResponse.json({ captacion });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la captación.",
      },
      { status: 400 }
    );
  }
}