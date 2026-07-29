import { del, get, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { obtenerSesionActual } from "@/lib/auth";
import {
  actualizarPerfilAsesor,
  obtenerAsesor,
} from "@/lib/repositories/asesores";
import { PERMISOS } from "@/types/domain";

const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 3 * 1024 * 1024;

function tokenBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN no está configurado.");
  return token;
}

async function autorizar() {
  const sesion = await obtenerSesionActual();
  return sesion && PERMISOS[sesion.rol].gestionarAsesores ? sesion : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { telegramId: string } },
) {
  if (!(await autorizar())) return new NextResponse(null, { status: 401 });
  const asesor = await obtenerAsesor(decodeURIComponent(params.telegramId));
  if (!asesor?.avatarPathname) return new NextResponse(null, { status: 404 });
  const resultado = await get(asesor.avatarPathname, {
    access: "private",
    token: tokenBlob(),
  });
  if (!resultado?.stream) return new NextResponse(null, { status: 404 });
  return new NextResponse(resultado.stream, {
    headers: {
      "Content-Type": resultado.blob.contentType ?? "application/octet-stream",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { telegramId: string } },
) {
  if (!(await autorizar()))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const telegramId = decodeURIComponent(params.telegramId);
  const asesor = await obtenerAsesor(telegramId);
  if (!asesor)
    return NextResponse.json(
      { error: "Asesor no encontrado." },
      { status: 404 },
    );
  const archivo = (await req.formData()).get("foto");
  if (
    !(archivo instanceof File) ||
    !TIPOS.has(archivo.type) ||
    archivo.size > MAX_BYTES
  ) {
    return NextResponse.json(
      { error: "Usa JPG, PNG o WebP de hasta 3 MB." },
      { status: 400 },
    );
  }
  const extension =
    archivo.type === "image/png"
      ? "png"
      : archivo.type === "image/webp"
        ? "webp"
        : "jpg";
  const token = tokenBlob();
  const blob = await put(
    `asesores/${telegramId}/foto-${Date.now()}.${extension}`,
    archivo,
    {
      access: "private",
      addRandomSuffix: true,
      contentType: archivo.type,
      token,
    },
  );
  try {
    await actualizarPerfilAsesor(telegramId, { avatarPathname: blob.pathname });
  } catch (error) {
    await del(blob.pathname, { token });
    throw error;
  }
  if (asesor.avatarPathname) await del(asesor.avatarPathname, { token });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { telegramId: string } },
) {
  if (!(await autorizar()))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const telegramId = decodeURIComponent(params.telegramId);
  const asesor = await obtenerAsesor(telegramId);
  if (!asesor)
    return NextResponse.json(
      { error: "Asesor no encontrado." },
      { status: 404 },
    );
  if (asesor.avatarPathname)
    await del(asesor.avatarPathname, { token: tokenBlob() });
  await actualizarPerfilAsesor(telegramId, { avatarPathname: "" });
  return NextResponse.json({ ok: true });
}
