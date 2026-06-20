import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verificarCredenciales } from "@/lib/repositories/usuarios-admin";
import { crearTokenSesion, establecerCookieSesion } from "@/lib/auth";

const esquemaLogin = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = esquemaLogin.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Usuario y contraseña son requeridos." }, { status: 400 });
  }

  const usuario = await verificarCredenciales(parsed.data.username, parsed.data.password);
  if (!usuario) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const token = await crearTokenSesion({
    sub: usuario.username,
    nombre: usuario.nombre,
    rol: usuario.rol,
  });
  await establecerCookieSesion(token);

  return NextResponse.json({
    ok: true,
    usuario: { username: usuario.username, nombre: usuario.nombre, rol: usuario.rol },
  });
}
