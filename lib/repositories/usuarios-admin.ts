import { kv, KEYS } from "@/lib/redis";
import bcrypt from "bcryptjs";
import type { RolUsuarioAdmin, UsuarioAdmin } from "@/types/domain";
import { nanoid } from "nanoid";

export async function obtenerUsuarioAdminPorUsername(
  username: string
): Promise<UsuarioAdmin | null> {
  return (await kv.get<UsuarioAdmin>(KEYS.usuarioAdmin(username))) ?? null;
}

export async function crearUsuarioAdmin(params: {
  username: string;
  password: string;
  nombre: string;
  rol: RolUsuarioAdmin;
}): Promise<UsuarioAdmin> {
  const existente = await obtenerUsuarioAdminPorUsername(params.username);
  if (existente) throw new Error(`El usuario "${params.username}" ya existe.`);

  const passwordHash = await bcrypt.hash(params.password, 10);
  const usuario: UsuarioAdmin = {
    id: nanoid(10),
    username: params.username,
    passwordHash,
    nombre: params.nombre,
    rol: params.rol,
    creadoEn: new Date().toISOString(),
    activo: true,
  };

  await kv.set(KEYS.usuarioAdmin(usuario.username), usuario);
  await kv.sadd(KEYS.usuariosAdminIndex, usuario.username);
  return usuario;
}

export async function listarUsuariosAdmin(): Promise<UsuarioAdmin[]> {
  const usernames = await kv.smembers(KEYS.usuariosAdminIndex);
  if (!usernames || usernames.length === 0) return [];
  const usuarios = await Promise.all(usernames.map((u) => obtenerUsuarioAdminPorUsername(u)));
  return usuarios.filter((u): u is UsuarioAdmin => u !== null);
}

export async function verificarCredenciales(
  username: string,
  password: string
): Promise<UsuarioAdmin | null> {
  const usuario = await obtenerUsuarioAdminPorUsername(username);
  if (!usuario || !usuario.activo) return null;
  const valido = await bcrypt.compare(password, usuario.passwordHash);
  return valido ? usuario : null;
}
