import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { obtenerSesionActual } from "@/lib/auth";
import { obtenerUsuarioAdminPorUsername } from "@/lib/repositories/usuarios-admin";
import { PERMISOS } from "@/types/domain";

function obtenerBlobToken() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN no está configurado.");
  return token;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } },
) {
  try {
    const sesion = await obtenerSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }
    if (!PERMISOS[sesion.rol].gestionarUsuarios) {
      return NextResponse.json(
        { error: "No tienes permiso para consultar esta fotografía." },
        { status: 403 },
      );
    }

    const usuario = await obtenerUsuarioAdminPorUsername(
      decodeURIComponent(params.username),
    );
    if (!usuario?.avatarPathname) {
      return NextResponse.json(
        { error: "Fotografía no encontrada." },
        { status: 404 },
      );
    }

    const resultado = await get(usuario.avatarPathname, {
      access: "private",
      token: obtenerBlobToken(),
    });
    if (!resultado?.stream) {
      return NextResponse.json(
        { error: "Fotografía no encontrada." },
        { status: 404 },
      );
    }

    return new NextResponse(resultado.stream, {
      headers: {
        "Content-Type":
          resultado.blob.contentType ?? "application/octet-stream",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Error al obtener avatar administrativo:",
      error instanceof Error ? error.message : "Error desconocido",
    );
    return NextResponse.json(
      { error: "No se pudo obtener la fotografía." },
      { status: 500 },
    );
  }
}
