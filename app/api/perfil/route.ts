import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { obtenerSesionActual } from "@/lib/auth";
import {
  actualizarPerfilUsuario,
  cambiarPasswordUsuario,
  obtenerUsuarioAdminPorUsername,
} from "@/lib/repositories/usuarios-admin";
import { usuarioAPublico } from "@/types/usuario";

const perfilSchema = z.object({
  accion: z.literal("perfil"),
  nombre: z.string().trim().min(3).max(120),
  cargo: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  celular: z.string().trim().max(30).optional(),
});

const passwordSchema = z
  .object({
    accion: z.literal("password"),
    passwordActual: z.string().min(1),
    passwordNueva: z.string().min(8).max(128),
    confirmarPassword: z.string().min(8).max(128),
  })
  .refine((datos) => datos.passwordNueva === datos.confirmarPassword, {
    message: "Las contraseñas nuevas no coinciden.",
  });

export async function GET() {
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
  return NextResponse.json({ usuario: usuarioAPublico(usuario) });
}

export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);

  if (body?.accion === "perfil") {
    const parsed = perfilSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Revisa el nombre, cargo, correo y celular." },
        { status: 400 },
      );
    }
    const usuario = await actualizarPerfilUsuario(sesion.sub, parsed.data);
    return NextResponse.json({ ok: true, usuario: usuarioAPublico(usuario) });
  }

  const parsed = passwordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }
  const ok = await cambiarPasswordUsuario(
    sesion.sub,
    parsed.data.passwordActual,
    parsed.data.passwordNueva,
  );
  if (!ok) {
    return NextResponse.json(
      { error: "La contraseña actual no es correcta." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
}
