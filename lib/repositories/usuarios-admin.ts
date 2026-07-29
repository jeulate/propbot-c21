import { kv, KEYS } from "@/lib/redis";
import bcrypt from "bcryptjs";
import type { RolUsuarioAdmin } from "@/types/domain";
import type { UsuarioAdminExtendido } from "@/types/usuario";
import { nanoid } from "nanoid";

export async function obtenerUsuarioAdminPorUsername(
  username: string,
): Promise<UsuarioAdminExtendido | null> {
  return (
    (await kv.get<UsuarioAdminExtendido>(
      KEYS.usuarioAdmin(username.toLowerCase()),
    )) ?? null
  );
}

export async function crearUsuarioAdmin(params: {
  username: string;
  password: string;
  nombre: string;
  cargo: string;
  email: string;
  celular?: string;
  rol: RolUsuarioAdmin;
}): Promise<UsuarioAdminExtendido> {
  const username = params.username.trim().toLowerCase();
  if (await obtenerUsuarioAdminPorUsername(username)) {
    throw new Error(`El usuario "${username}" ya existe.`);
  }

  const ahora = new Date().toISOString();
  const usuario: UsuarioAdminExtendido = {
    id: nanoid(10),
    username,
    passwordHash: await bcrypt.hash(params.password, 10),
    nombre: params.nombre.trim(),
    cargo: params.cargo.trim(),
    email: params.email.trim().toLowerCase(),
    celular: params.celular?.trim() || undefined,
    rol: params.rol,
    activo: true,
    creadoEn: ahora,
    actualizadoEn: ahora,
  };

  await kv.set(KEYS.usuarioAdmin(username), usuario);
  await kv.sadd(KEYS.usuariosAdminIndex, username);
  return usuario;
}

export async function listarUsuariosAdmin(): Promise<UsuarioAdminExtendido[]> {
  const usernames = await kv.smembers(KEYS.usuariosAdminIndex);
  if (!usernames?.length) return [];
  const usuarios = await Promise.all(
    usernames.map((username) => obtenerUsuarioAdminPorUsername(username)),
  );
  return usuarios
    .filter((usuario): usuario is UsuarioAdminExtendido => usuario !== null)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

export async function actualizarPerfilUsuario(
  username: string,
  cambios: {
    nombre: string;
    cargo: string;
    email: string;
    celular?: string;
  },
): Promise<UsuarioAdminExtendido> {
  const usuario = await obtenerUsuarioAdminPorUsername(username);
  if (!usuario) throw new Error("Usuario no encontrado.");

  const actualizado: UsuarioAdminExtendido = {
    ...usuario,
    nombre: cambios.nombre.trim(),
    cargo: cambios.cargo.trim(),
    email: cambios.email.trim().toLowerCase(),
    celular: cambios.celular?.trim() || undefined,
    actualizadoEn: new Date().toISOString(),
  };
  await kv.set(KEYS.usuarioAdmin(usuario.username), actualizado);
  return actualizado;
}

export async function actualizarUsuarioDesdeAdministracion(
  username: string,
  cambios: {
    nombre: string;
    cargo: string;
    email: string;
    celular?: string;
    rol: RolUsuarioAdmin;
    activo: boolean;
  },
): Promise<UsuarioAdminExtendido> {
  const usuario = await obtenerUsuarioAdminPorUsername(username);
  if (!usuario) throw new Error("Usuario no encontrado.");

  const actualizado: UsuarioAdminExtendido = {
    ...usuario,
    nombre: cambios.nombre.trim(),
    cargo: cambios.cargo.trim(),
    email: cambios.email.trim().toLowerCase(),
    celular: cambios.celular?.trim() || undefined,
    rol: cambios.rol,
    activo: cambios.activo,
    actualizadoEn: new Date().toISOString(),
  };
  await kv.set(KEYS.usuarioAdmin(usuario.username), actualizado);
  return actualizado;
}

export async function actualizarAvatarUsuario(
  username: string,
  avatarPathname?: string,
): Promise<UsuarioAdminExtendido> {
  const usuario = await obtenerUsuarioAdminPorUsername(username);
  if (!usuario) throw new Error("Usuario no encontrado.");
  const actualizado = {
    ...usuario,
    avatarPathname,
    actualizadoEn: new Date().toISOString(),
  };
  await kv.set(KEYS.usuarioAdmin(usuario.username), actualizado);
  return actualizado;
}

export async function cambiarPasswordUsuario(
  username: string,
  passwordActual: string,
  passwordNueva: string,
): Promise<boolean> {
  const usuario = await obtenerUsuarioAdminPorUsername(username);
  if (!usuario) return false;
  if (!(await bcrypt.compare(passwordActual, usuario.passwordHash))) {
    return false;
  }
  usuario.passwordHash = await bcrypt.hash(passwordNueva, 10);
  usuario.actualizadoEn = new Date().toISOString();
  await kv.set(KEYS.usuarioAdmin(usuario.username), usuario);
  return true;
}

export async function verificarCredenciales(
  username: string,
  password: string,
): Promise<UsuarioAdminExtendido | null> {
  const usuario = await obtenerUsuarioAdminPorUsername(
    username.trim().toLowerCase(),
  );
  if (!usuario?.activo) return null;
  return (await bcrypt.compare(password, usuario.passwordHash))
    ? usuario
    : null;
}
