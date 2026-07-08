import { NextResponse } from "next/server";
import { obtenerSesionActual } from "@/lib/auth";

export async function GET(req: Request) {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");

  if (!fileId) {
    return NextResponse.json({ error: "Falta fileId" }, { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Falta TELEGRAM_BOT_TOKEN" }, { status: 500 });
  }

  const infoRes = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
  );

  const info = await infoRes.json();

  if (!info.ok || !info.result?.file_path) {
    return NextResponse.json({ error: "No se pudo obtener el archivo" }, { status: 404 });
  }

  const fileRes = await fetch(
    `https://api.telegram.org/file/bot${token}/${info.result.file_path}`
  );

  if (!fileRes.ok) {
    return NextResponse.json({ error: "No se pudo descargar el archivo" }, { status: 404 });
  }

  const buffer = await fileRes.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": fileRes.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "private, max-age=300",
    },
  });
}