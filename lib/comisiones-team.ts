import type { TipoTransaccion } from "@/types/domain";

export interface ResultadoComisionTeam {
  porcentajeBaseComision: number;
  montoBaseComision: number;
  porcentajeOficinaTeamAplicado: number;
  porcentajeTeamLeaderAplicado: number;
  montoPagoOficinaTeam: number;
  montoPagoTeamLeader: number;
  montoPagoRealAsesor: number;
  montoComisionTotal: number;
}

function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function validarPorcentaje(nombre: string, valor: number): void {
  if (!Number.isFinite(valor) || valor < 0 || valor > 100) {
    throw new Error(`${nombre} debe estar entre 0 y 100.`);
  }
}

export function calcularComisionCierreTeam(params: {
  montoTransaccion: number;
  tipoTransaccion: TipoTransaccion;
  esCaptadorYColocadorMismoAsesor: boolean;
  porcentajeOficinaTeam: number;
  porcentajeTeamLeader: number;
}): ResultadoComisionTeam {
  if (!Number.isFinite(params.montoTransaccion) || params.montoTransaccion <= 0) {
    throw new Error("El monto de la transacción debe ser mayor que cero.");
  }

  validarPorcentaje("El porcentaje de oficina", params.porcentajeOficinaTeam);
  validarPorcentaje("El porcentaje de Team Leader", params.porcentajeTeamLeader);

  if (params.porcentajeOficinaTeam + params.porcentajeTeamLeader > 100) {
    throw new Error(
      "La suma de los porcentajes de oficina y Team Leader no puede superar 100.",
    );
  }

  const porcentajeBaseComision =
    params.tipoTransaccion === "ALQUILER"
      ? params.esCaptadorYColocadorMismoAsesor
        ? 100
        : 50
      : params.esCaptadorYColocadorMismoAsesor
        ? 4
        : 2;

  const montoBaseComision = redondear2(
    (params.montoTransaccion * porcentajeBaseComision) / 100,
  );
  const montoPagoOficinaTeam = redondear2(
    (montoBaseComision * params.porcentajeOficinaTeam) / 100,
  );
  const montoPagoTeamLeader = redondear2(
    (montoBaseComision * params.porcentajeTeamLeader) / 100,
  );

  // Los comprobantes representan importes redondeados por separado.
  const montoComisionTotal = redondear2(
    montoPagoOficinaTeam + montoPagoTeamLeader,
  );
  const montoPagoRealAsesor = redondear2(
    montoBaseComision - montoComisionTotal,
  );

  return {
    porcentajeBaseComision,
    montoBaseComision,
    porcentajeOficinaTeamAplicado: params.porcentajeOficinaTeam,
    porcentajeTeamLeaderAplicado: params.porcentajeTeamLeader,
    montoPagoOficinaTeam,
    montoPagoTeamLeader,
    montoPagoRealAsesor,
    montoComisionTotal,
  };
}
