import type { RolUsuarioAdmin, UsuarioAdmin } from "@/types/domain";

export interface UsuarioPublico {
  id: string;
  username: string;
  nombre: string;
  cargo: string;
  email: string;
  celular?: string;
  rol: RolUsuarioAdmin;
  activo: boolean;
  avatarPathname?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export type UsuarioAdminExtendido = UsuarioAdmin & {
  cargo?: string;
  email?: string;
  celular?: string;
  avatarPathname?: string;
  actualizadoEn?: string;
};

export function usuarioAPublico(
  usuario: UsuarioAdminExtendido,
): UsuarioPublico {
  return {
    id: usuario.id,
    username: usuario.username,
    nombre: usuario.nombre,
    cargo: usuario.cargo ?? "",
    email: usuario.email ?? "",
    celular: usuario.celular,
    rol: usuario.rol,
    activo: usuario.activo,
    avatarPathname: usuario.avatarPathname,
    creadoEn: usuario.creadoEn,
    actualizadoEn: usuario.actualizadoEn ?? usuario.creadoEn,
  };
}
