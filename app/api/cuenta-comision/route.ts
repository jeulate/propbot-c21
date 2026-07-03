import { NextResponse } from "next/server";
import {
  eliminarCuentaComision,
  guardarCuentaComision,
  obtenerCuentaComision,
} from "@/lib/repositories/cuenta-comision";

export async function GET() {
  const cuenta = await obtenerCuentaComision();
  return NextResponse.json({ cuenta });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const cuenta = await guardarCuentaComision({
      banco: String(body.banco ?? ""),
      cuenta: String(body.cuenta ?? ""),
      titular: String(body.titular ?? ""),
      nitCi: String(body.nitCi ?? ""),
    });

    return NextResponse.json({ cuenta });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo guardar la cuenta." },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  await eliminarCuentaComision();
  return NextResponse.json({ ok: true });
}