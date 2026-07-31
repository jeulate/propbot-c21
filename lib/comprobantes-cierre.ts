import type { Cierre } from "@/types/domain";

export function esCierreTeam(cierre: Pick<Cierre, "tipoCalculoComision">): boolean {
  return cierre.tipoCalculoComision === "TEAM";
}

export function comprobantesCompletos(
  cierre: Pick<
    Cierre,
    | "tipoCalculoComision"
    | "comprobantePagoFileId"
    | "comprobanteOficinaFileId"
    | "comprobanteTeamLeaderFileId"
  >,
): boolean {
  if (esCierreTeam(cierre)) {
    return Boolean(
      cierre.comprobanteOficinaFileId &&
        cierre.comprobanteTeamLeaderFileId,
    );
  }

  return Boolean(cierre.comprobantePagoFileId);
}

export function validarCambioEstadoCierre(
  cierre: Pick<
    Cierre,
    | "tipoCalculoComision"
    | "comprobantePagoFileId"
    | "comprobanteOficinaFileId"
    | "comprobanteTeamLeaderFileId"
  >,
  estado: Cierre["estado"],
  motivoRechazo?: string,
): void {
  if (estado === "VERIFICADO" && !comprobantesCompletos(cierre)) {
    throw new Error(
      esCierreTeam(cierre)
        ? "No se puede verificar el cierre Team: faltan los comprobantes de oficina o Team Leader."
        : "No se puede verificar el cierre: falta el comprobante de pago.",
    );
  }

  if (estado === "RECHAZADO" && !motivoRechazo?.trim()) {
    throw new Error("Debes indicar el motivo del rechazo.");
  }
}
