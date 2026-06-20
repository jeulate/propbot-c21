import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { crearUsuarioAdmin, listarUsuariosAdmin } from "@/lib/repositories/usuarios-admin";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";

const esquemaCrear = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  nombre: z.string().min(2),
  rol: z.enum(["ADMIN", "SUPERVISOR", "LECTOR"]),
});

export async function GET() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!PERMISOS[sesion.rol].gestionarUsuarios) {
    return NextResponse.json({ error: "No tienes permiso para ver usuarios." }, { status: 403 });
  }

  const usuarios = await listarUsuariosAdmin();
  // No devolver los hashes de contraseña al cliente
  const sinHash = usuarios.map(({ passwordHash, ...resto }) => resto);
  return NextResponse.json({ usuarios: sinHash });
}

export async function POST(req: NextRequest) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!PERMISOS[sesion.rol].gestionarUsuarios) {
    return NextResponse.json({ error: "No tienes permiso para crear usuarios." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = esquemaCrear.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos. La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }

  try {
    const usuario = await crearUsuarioAdmin(parsed.data);
    const { passwordHash, ...sinHash } = usuario;
    return NextResponse.json({ ok: true, usuario: sinHash });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
