import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { obtenerSesionActual } from "@/lib/auth";
import {
  actualizarUsuarioDesdeAdministracion,
  obtenerUsuarioAdminPorUsername,
} from "@/lib/repositories/usuarios-admin";
import { PERMISOS } from "@/types/domain";
import { usuarioAPublico } from "@/types/usuario";

const esquemaActualizar = z.object({
  nombre: z.string().trim().min(3).max(120),
  cargo: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  celular: z.string().trim().max(30).optional(),
  rol: z.enum(["ADMIN", "SUPERVISOR", "LECTOR"]),
  activo: z.boolean(),
});

async function autorizar() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return { error: "No autorizado.", status: 401 as const };
  if (!PERMISOS[sesion.rol].gestionarUsuarios) {
    return {
      error: "No tienes permiso para gestionar usuarios.",
      status: 403 as const,
    };
  }
  return { sesion };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } },
) {
  const auth = await autorizar();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const usuario = await obtenerUsuarioAdminPorUsername(
    decodeURIComponent(params.username),
  );
  if (!usuario) {
    return NextResponse.json(
      { error: "Usuario no encontrado." },
      { status: 404 },
    );
  }
  return NextResponse.json({ usuario: usuarioAPublico(usuario) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { username: string } },
) {
  const auth = await autorizar();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const parsed = esquemaActualizar.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa los datos personales, rol y estado." },
      { status: 400 },
    );
  }

  const username = decodeURIComponent(params.username).toLowerCase();
  if (username === auth.sesion.sub && !parsed.data.activo) {
    return NextResponse.json(
      { error: "No puedes desactivar tu propia cuenta." },
      { status: 400 },
    );
  }

  try {
    const usuario = await actualizarUsuarioDesdeAdministracion(
      username,
      parsed.data,
    );
    return NextResponse.json({ ok: true, usuario: usuarioAPublico(usuario) });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo actualizar el usuario.",
      },
      { status: 400 },
    );
  }
}
