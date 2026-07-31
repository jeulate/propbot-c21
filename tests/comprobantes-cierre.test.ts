import assert from "node:assert/strict";
import test from "node:test";
import {
  comprobantesCompletos,
  validarCambioEstadoCierre,
} from "../lib/comprobantes-cierre";

test("un cierre individual conserva el comprobante Único", () => {
  assert.equal(
    comprobantesCompletos({
      tipoCalculoComision: "INDIVIDUAL",
      comprobantePagoFileId: "individual",
    }),
    true,
  );
});

test("un cierre Team exige los dos comprobantes", () => {
  assert.equal(
    comprobantesCompletos({
      tipoCalculoComision: "TEAM",
      comprobanteOficinaFileId: "oficina",
    }),
    false,
  );
  assert.equal(
    comprobantesCompletos({
      tipoCalculoComision: "TEAM",
      comprobanteOficinaFileId: "oficina",
      comprobanteTeamLeaderFileId: "leader",
    }),
    true,
  );
});

test("impide verificar un cierre Team incompleto", () => {
  assert.throws(
    () =>
      validarCambioEstadoCierre(
        {
          tipoCalculoComision: "TEAM",
          comprobanteOficinaFileId: "oficina",
        },
        "VERIFICADO",
      ),
    /faltan los comprobantes/,
  );
});

test("exige motivo al rechazar", () => {
  assert.throws(
    () =>
      validarCambioEstadoCierre(
        {
          tipoCalculoComision: "INDIVIDUAL",
          comprobantePagoFileId: "individual",
        },
        "RECHAZADO",
      ),
    /motivo/,
  );
});

test("acepta aprobación Team completa y rechazo motivado", () => {
  assert.doesNotThrow(() =>
    validarCambioEstadoCierre(
      {
        tipoCalculoComision: "TEAM",
        comprobanteOficinaFileId: "oficina",
        comprobanteTeamLeaderFileId: "leader",
      },
      "VERIFICADO",
    ),
  );
  assert.doesNotThrow(() =>
    validarCambioEstadoCierre(
      {
        tipoCalculoComision: "TEAM",
        comprobanteOficinaFileId: "oficina",
        comprobanteTeamLeaderFileId: "leader",
      },
      "RECHAZADO",
      "El importe no coincide.",
    ),
  );
});
