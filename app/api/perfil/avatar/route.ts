import { del, get, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { obtenerSesionActual } from "@/lib/auth";
import {
  actualizarAvatarUsuario,
  obtenerUsuarioAdminPorUsername,
} from "@/lib/repositories/usuarios-admin";

const TIPOS = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 3 * 1024 * 1024;

function obtenerBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN no está configurado.");
  }

  return token;
}

function respuestaErrorAvatar(error: unknown, operacion: string) {
  console.error(`[perfil/avatar] Error al ${operacion}:`, error);

  const mensaje =
    error instanceof Error &&
    error.message === "BLOB_READ_WRITE_TOKEN no está configurado."
      ? error.message
      : `No se pudo ${operacion} la fotografía.`;

  return NextResponse.json({ error: mensaje }, { status: 500 });
}

export async function GET() {
  try {
    const sesion = await obtenerSesionActual();
    if (!sesion) return new NextResponse(null, { status: 401 });

    const usuario = await obtenerUsuarioAdminPorUsername(sesion.sub);
    if (!usuario?.avatarPathname) {
      return new NextResponse(null, { status: 404 });
    }

    const resultado = await get(usuario.avatarPathname, {
      access: "private",
      token: obtenerBlobToken(),
    });

    if (!resultado || resultado.statusCode !== 200) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(resultado.stream, {
      headers: {
        "Content-Type":
          resultado.blob.contentType || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
        ETag: resultado.blob.etag,
      },
    });
  } catch (error: unknown) {
    return respuestaErrorAvatar(error, "obtener");
  }
}

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const formData = await req.formData();
    const archivo = formData.get("avatar");

    if (!(archivo instanceof File)) {
      return NextResponse.json(
        { error: "Selecciona una fotografía." },
        { status: 400 },
      );
    }

    if (!TIPOS.has(archivo.type) || archivo.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Usa JPG, PNG o WebP de hasta 3 MB." },
        { status: 400 },
      );
    }

    const usuario = await obtenerUsuarioAdminPorUsername(sesion.sub);
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 },
      );
    }

    const extension =
      archivo.type === "image/png"
        ? "png"
        : archivo.type === "image/webp"
          ? "webp"
          : "jpg";
    const token = obtenerBlobToken();
    const blob = await put(
      `usuarios/${usuario.id}/avatar-${Date.now()}.${extension}`,
      archivo,
      {
        access: "private",
        addRandomSuffix: true,
        contentType: archivo.type,
        token,
      },
    );

    try {
      await actualizarAvatarUsuario(usuario.username, blob.pathname);
    } catch (error: unknown) {
      await del(blob.pathname, { token }).catch((cleanupError: unknown) => {
        console.error(
          "[perfil/avatar] No se pudo eliminar el Blob tras fallar Redis:",
          cleanupError,
        );
      });
      throw error;
    }

    if (usuario.avatarPathname) {
      await del(usuario.avatarPathname, { token });
    }

    return NextResponse.json({
      ok: true,
      avatarUrl: "/api/perfil/avatar",
    });
  } catch (error: unknown) {
    return respuestaErrorAvatar(error, "subir");
  }
}

export async function DELETE() {
  try {
    const sesion = await obtenerSesionActual();
    if (!sesion) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const usuario = await obtenerUsuarioAdminPorUsername(sesion.sub);
    if (!usuario) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 },
      );
    }

    if (usuario.avatarPathname) {
      await del(usuario.avatarPathname, {
        token: obtenerBlobToken(),
      });
    }

    await actualizarAvatarUsuario(usuario.username, undefined);
    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    return respuestaErrorAvatar(error, "eliminar");
  }
}
