import { NextResponse } from "next/server";
import {
  guardarObjetivosOficina,
  obtenerObjetivosOficina,
} from "@/lib/repositories/objetivos-oficina";

export async function GET() {
  const objetivos = await obtenerObjetivosOficina();
  return NextResponse.json({ objetivos });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const objetivos = await guardarObjetivosOficina({
      centurion: Number(body.centurion),
      dobleCenturion: Number(body.dobleCenturion),
      grandCenturion: Number(body.grandCenturion),
    });

    return NextResponse.json({ objetivos });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron guardar los objetivos.",
      },
      { status: 400 }
    );
  }
}