import assert from "node:assert/strict";
import test from "node:test";
import { calcularComisionCierreTeam } from "../lib/comisiones-team";

test("Gold: calcula por separado oficina y Team Leader sobre la participación", () => {
  const resultado = calcularComisionCierreTeam({
    montoTransaccion: 835_200,
    tipoTransaccion: "VENTA",
    esCaptadorYColocadorMismoAsesor: false,
    porcentajeOficinaTeam: 21.8,
    porcentajeTeamLeader: 4.6,
  });

  assert.equal(resultado.porcentajeBaseComision, 2);
  assert.equal(resultado.montoBaseComision, 16_704);
  assert.equal(resultado.montoPagoOficinaTeam, 3_641.47);
  assert.equal(resultado.montoPagoTeamLeader, 768.38);
  assert.equal(resultado.montoComisionTotal, 4_409.85);
  assert.equal(resultado.montoPagoRealAsesor, 12_294.15);
});

test("AMBOS: usa el 4 % completo en una venta", () => {
  const resultado = calcularComisionCierreTeam({
    montoTransaccion: 100_000,
    tipoTransaccion: "VENTA",
    esCaptadorYColocadorMismoAsesor: true,
    porcentajeOficinaTeam: 21.8,
    porcentajeTeamLeader: 4.6,
  });

  assert.equal(resultado.montoBaseComision, 4_000);
  assert.equal(resultado.montoPagoOficinaTeam, 872);
  assert.equal(resultado.montoPagoTeamLeader, 184);
  assert.equal(resultado.montoPagoRealAsesor, 2_944);
});

test("alquiler con un solo rol usa el 50 % del monto", () => {
  const resultado = calcularComisionCierreTeam({
    montoTransaccion: 5_000,
    tipoTransaccion: "ALQUILER",
    esCaptadorYColocadorMismoAsesor: false,
    porcentajeOficinaTeam: 26.4,
    porcentajeTeamLeader: 9.2,
  });

  assert.equal(resultado.montoBaseComision, 2_500);
  assert.equal(resultado.montoPagoOficinaTeam, 660);
  assert.equal(resultado.montoPagoTeamLeader, 230);
  assert.equal(resultado.montoPagoRealAsesor, 1_610);
});

test("rechaza una distribución superior al 100 %", () => {
  assert.throws(
    () =>
      calcularComisionCierreTeam({
        montoTransaccion: 100_000,
        tipoTransaccion: "VENTA",
        esCaptadorYColocadorMismoAsesor: false,
        porcentajeOficinaTeam: 80,
        porcentajeTeamLeader: 21,
      }),
    /no puede superar 100/,
  );
});

test("rechaza montos no positivos", () => {
  assert.throws(
    () =>
      calcularComisionCierreTeam({
        montoTransaccion: 0,
        tipoTransaccion: "VENTA",
        esCaptadorYColocadorMismoAsesor: false,
        porcentajeOficinaTeam: 21.8,
        porcentajeTeamLeader: 4.6,
      }),
    /mayor que cero/,
  );
});
