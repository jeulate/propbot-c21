/**
 * Tipos del dominio "Control de Cierres" — Century 21 Rita Quiroga.
 * Estos campos están mapeados 1:1 con las columnas del formato Excel original:
 * FECHA CIERRE | ID | ASESOR CAPTADOR | ASESOR COLOCADOR | DIRECCIÓN DEL INMUEBLE |
 * TIPO DE TRANSACCIÓN | MONTO TRANSACCIÓN | MONTO COMISIÓN | T.C. | NOMBRE PROPIETARIO |
 * TEL. PROPIETARIO | NOMBRE CLIENTE | TEL. CLIENTE | EXCLUSIVA (SI/NO)
 */

export type TipoTransaccion = "VENTA" | "ALQUILER" | "ANTICRÉTICO";

export interface Cierre {
  /** Clave Redis: cierre:<id> */
  id: string; // ID interno único del cierre
  idInmueble: string; // ID público del inmueble en c21.com.bo
  rolRegistro: "CAPTADOR" | "COLOCADOR" | "AMBOS";
  fechaCierre: string; // ISO date (yyyy-MM-dd)
  asesorCaptadorId: string; // referencia a Asesor.id (quien capta la propiedad)
  asesorCaptadorNombre: string;
  asesorCaptadorOficina?: string;
  asesorCaptadorTelefono?: string;
  asesorColocadorId: string; // referencia a Asesor.id (quien coloca/cierra con el cliente)
  asesorColocadorNombre: string;
  asesorColocadorOficina?: string;
  asesorColocadorTelefono?: string;
  direccionInmueble: string;
  tituloPropiedad?: string;
  urlPropiedad?: string;
  tipoTransaccion: TipoTransaccion;
  montoTransaccion: number;
  montoComision: number; // monto total que debe pagar el asesor (oficina nacional + oficina local)
  porcentajeOficinaNacionalAplicado: number;
  porcentajeOficinaLocalAplicado: number;
  montoPagoOficinaNacional: number;
  montoPagoOficinaLocal: number;
  porcentajeCategoriaAplicado: number;
  montoPagoRealAsesor: number;
  /** Fotografía histórica; opcional para cierres anteriores. */
  tipoCalculoComision?: "INDIVIDUAL" | "TEAM";
  categoriaIdAplicada?: string;
  categoriaNombreAplicada?: string;
  teamIdAplicado?: string;
  teamNombreAplicado?: string;
  teamLeaderTelegramIdAplicado?: string;
  teamLeaderNombreAplicado?: string;
  porcentajeOficinaTeamAplicado?: number;
  porcentajeTeamLeaderAplicado?: number;
  montoPagoTeamLeader?: number;
  tipoCambio: number; // T.C.
  nombrePropietario: string;
  telPropietario: string;
  nombreCliente: string;
  telCliente: string;
  exclusiva: boolean; // EXCLUSIVA (SI/NO)
  comprobantePagoFileId?: string;
  comprobantePagoFileUniqueId?: string;
  comprobantePagoTipo?: "photo" | "document";
  comprobantePagoNombreArchivo?: string;
  comprobantePagoMimeType?: string;
  /** Comprobantes separados para cierres Team. */
  comprobanteOficinaFileId?: string;
  comprobanteOficinaFileUniqueId?: string;
  comprobanteOficinaTipo?: "photo" | "document";
  comprobanteOficinaNombreArchivo?: string;
  comprobanteOficinaMimeType?: string;
  comprobanteTeamLeaderFileId?: string;
  comprobanteTeamLeaderFileUniqueId?: string;
  comprobanteTeamLeaderTipo?: "photo" | "document";
  comprobanteTeamLeaderNombreArchivo?: string;
  comprobanteTeamLeaderMimeType?: string;
  motivoRechazo?: string;

  // Metadatos de auditoría (no estaban en el Excel, necesarios para el sistema)
  registradoPorTelegramId: string;
  registradoPorNombre: string;
  creadoEn: string; // ISO datetime
  creadoEnBolivia: string; // yyyy-MM-ddTHH:mm:ss en zona horaria America/La_Paz
  actualizadoEn: string; // ISO datetime
  estado: "PENDIENTE_REVISION" | "VERIFICADO" | "RECHAZADO";
}

export type CierreInput = Omit<
  Cierre,
  | "id"
  | "creadoEn"
  | "creadoEnBolivia"
  | "actualizadoEn"
  | "estado"
  | "registradoPorTelegramId"
  | "registradoPorNombre"
  | "montoComision"
  | "porcentajeOficinaNacionalAplicado"
  | "porcentajeOficinaLocalAplicado"
  | "montoPagoOficinaNacional"
  | "montoPagoOficinaLocal"
  | "porcentajeCategoriaAplicado"
  | "montoPagoRealAsesor"
  | "tipoCalculoComision"
  | "categoriaIdAplicada"
  | "categoriaNombreAplicada"
  | "teamIdAplicado"
  | "teamNombreAplicado"
  | "teamLeaderTelegramIdAplicado"
  | "teamLeaderNombreAplicado"
  | "porcentajeOficinaTeamAplicado"
  | "porcentajeTeamLeaderAplicado"
  | "montoPagoTeamLeader"
>;

export type RolUsuarioAdmin = "ADMIN" | "SUPERVISOR" | "LECTOR";

export interface UsuarioAdmin {
  id: string;
  username: string;
  passwordHash: string;
  nombre: string;
  rol: RolUsuarioAdmin;
  creadoEn: string;
  activo: boolean;
}

export interface AsesorAutorizado {
  telegramId: string; // clave: asesor:<telegramId>
  nombre: string;
  categoriaId: string;
  activo: boolean;
  agregadoPorAdminId: string;
  creadoEn: string;
  celular?: string;
  avatarPathname?: string;
  teamId?: string;
  equipoTriple21Id?: string;
}

export type TipoAgrupacionAsesor = "TEAM" | "EQUIPO_TRIPLE_21";

export interface AgrupacionAsesor {
  id: string;
  nombre: string;
  tipo: TipoAgrupacionAsesor;
  activo: boolean;
  responsableTelegramId?: string;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CategoriaAsesor {
  id: string;
  nombre: string;
  porcentajeComision: number;
  activo: boolean;
  creadoEn: string;
}

export interface ConfiguracionComisionTeamCategoria {
  categoriaId: string;
  porcentajeOficina: number;
  porcentajeTeamLeader: number;
}

export interface ConfiguracionComisiones {
  porcentajeOficinaNacional: number;
  comisionesTeamPorCategoria: ConfiguracionComisionTeamCategoria[];
  nombreOficina?: string;
  actualizadoEn: string;

  // Compatibilidad temporal con configuraciones anteriores.
  porcentajeOficinaTeam?: number;
  porcentajeTeamLeader?: number;
}

export interface MetaMensual {
  id: string; // meta:<anio>:<mes>
  anio: number;
  mes: number; // 1-12
  montoObjetivo: number;
  creadoEn: string; // ISO datetime UTC
  actualizadoEn: string; // ISO datetime UTC
}

export interface CuentaComision {
  banco: string;
  cuenta: string;
  titular: string;
  nitCi: string;
  actualizadoEn: string;
}

export interface CaptacionMensual {
  id: string; // captacion:<anio>:<mes>:<asesorTelegramId>
  anio: number;
  mes: number; // 1-12
  asesorTelegramId: string;
  asesorNombre: string;
  cantidad: number;
  creadoEn: string;
  actualizadoEn: string;
}

export type CaptacionMensualInput = Omit<
  CaptacionMensual,
  "id" | "creadoEn" | "actualizadoEn"
>;

export type MetaMensualInput = Omit<
  MetaMensual,
  "id" | "creadoEn" | "actualizadoEn"
>;

export interface ObjetivosOficina {
  centurion: number;
  dobleCenturion: number;
  grandCenturion: number;
  actualizadoEn: string;
}

export type ObjetivosOficinaInput = Omit<ObjetivosOficina, "actualizadoEn">;

/** Permisos por rol — usado tanto en backend (rutas API) como en UI (ocultar acciones) */
export const PERMISOS: Record<
  RolUsuarioAdmin,
  {
    exportar: boolean;
    verificar: boolean;
    gestionarAsesores: boolean;
    gestionarUsuarios: boolean;
  }
> = {
  ADMIN: {
    exportar: true,
    verificar: true,
    gestionarAsesores: true,
    gestionarUsuarios: true,
  },
  SUPERVISOR: {
    exportar: true,
    verificar: true,
    gestionarAsesores: true,
    gestionarUsuarios: false,
  },
  LECTOR: {
    exportar: true,
    verificar: false,
    gestionarAsesores: false,
    gestionarUsuarios: false,
  },
};
