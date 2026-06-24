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
  id: string; // ID de expediente ingresado manualmente por el asesor
  fechaCierre: string; // ISO date (yyyy-MM-dd)
  asesorCaptadorId: string; // referencia a Asesor.id (quien capta la propiedad)
  asesorCaptadorNombre: string;
  asesorColocadorId: string; // referencia a Asesor.id (quien coloca/cierra con el cliente)
  asesorColocadorNombre: string;
  direccionInmueble: string;
  tipoTransaccion: TipoTransaccion;
  montoTransaccion: number;
  montoComision: number;
  porcentajeCategoriaAplicado: number;
  montoPagoRealAsesor: number;
  tipoCambio: number; // T.C.
  nombrePropietario: string;
  telPropietario: string;
  nombreCliente: string;
  telCliente: string;
  exclusiva: boolean; // EXCLUSIVA (SI/NO)

  // Metadatos de auditoría (no estaban en el Excel, necesarios para el sistema)
  registradoPorTelegramId: string;
  registradoPorNombre: string;
  creadoEn: string; // ISO datetime
  actualizadoEn: string; // ISO datetime
  estado: "PENDIENTE_REVISION" | "VERIFICADO" | "RECHAZADO";
}

export type CierreInput = Omit<
  Cierre,
  | "creadoEn"
  | "actualizadoEn"
  | "estado"
  | "registradoPorTelegramId"
  | "registradoPorNombre"
  | "porcentajeCategoriaAplicado"
  | "montoPagoRealAsesor"
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
}

export interface CategoriaAsesor {
  id: string;
  nombre: string;
  porcentajeComision: number;
  activo: boolean;
  creadoEn: string;
}

/** Permisos por rol — usado tanto en backend (rutas API) como en UI (ocultar acciones) */
export const PERMISOS: Record<RolUsuarioAdmin, { exportar: boolean; verificar: boolean; gestionarAsesores: boolean; gestionarUsuarios: boolean }> = {
  ADMIN: { exportar: true, verificar: true, gestionarAsesores: true, gestionarUsuarios: true },
  SUPERVISOR: { exportar: true, verificar: true, gestionarAsesores: true, gestionarUsuarios: false },
  LECTOR: { exportar: true, verificar: false, gestionarAsesores: false, gestionarUsuarios: false },
};
