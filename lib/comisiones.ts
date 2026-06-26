import type { TipoTransaccion } from "@/types/domain";

export interface ResultadoComision {
  porcentajeBaseComision: number;
  montoBaseComision: number;
  porcentajeOficinaNacionalAplicado: number;
  porcentajeOficinaLocalAplicado: number;
  porcentajeCategoriaAplicado: number;
  montoPagoOficinaNacional: number;
  montoPagoOficinaLocal: number;
  montoPagoRealAsesor: number;
  montoComisionTotal: number;
}

function redondear2(valor: number) {
  return Math.round(valor * 100) / 100;
}

export function calcularComisionCierre(params: {
  montoTransaccion: number;
  tipoTransaccion: TipoTransaccion;
  esCaptadorYColocadorMismoAsesor: boolean;
  porcentajeOficinaNacional: number;
  porcentajeCategoriaAsesor: number;
}): ResultadoComision {
  const porcentajeBaseComision =
    params.tipoTransaccion === "ALQUILER"
      ? params.esCaptadorYColocadorMismoAsesor
        ? 100
        : 50
      : params.esCaptadorYColocadorMismoAsesor
        ? 4
        : 2;

  const montoBaseComision = redondear2((params.montoTransaccion * porcentajeBaseComision) / 100);

  const montoPagoOficinaNacional = redondear2(
    (montoBaseComision * params.porcentajeOficinaNacional) / 100
  );

  const saldoDespuesNacional = redondear2(montoBaseComision - montoPagoOficinaNacional);

  const porcentajeOficinaLocalAplicado = redondear2(
    100 - params.porcentajeCategoriaAsesor
  );

  const montoPagoOficinaLocal = redondear2(
    (saldoDespuesNacional * porcentajeOficinaLocalAplicado) / 100
  );

  const montoPagoRealAsesor = redondear2(
    (saldoDespuesNacional * params.porcentajeCategoriaAsesor) / 100
  );

  const montoComisionTotal = redondear2(
    montoPagoOficinaNacional + montoPagoOficinaLocal
  );

  return {
    porcentajeBaseComision,
    montoBaseComision,
    porcentajeOficinaNacionalAplicado: params.porcentajeOficinaNacional,
    porcentajeOficinaLocalAplicado,
    porcentajeCategoriaAplicado: params.porcentajeCategoriaAsesor,
    montoPagoOficinaNacional,
    montoPagoOficinaLocal,
    montoPagoRealAsesor,
    montoComisionTotal,
  };
}
