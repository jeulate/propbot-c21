import type { UsuarioPublico } from "@/types/usuario";

export const EVENTO_PERFIL_ACTUALIZADO = "perfil-usuario-actualizado";

export type DetallePerfilActualizado = {
  usuario?: UsuarioPublico;
  avatarVersion?: number;
};

export function notificarPerfilActualizado(
  detalle: DetallePerfilActualizado = {},
) {
  window.dispatchEvent(
    new CustomEvent<DetallePerfilActualizado>(EVENTO_PERFIL_ACTUALIZADO, {
      detail: {
        ...detalle,
        avatarVersion: detalle.avatarVersion ?? Date.now(),
      },
    }),
  );
}
