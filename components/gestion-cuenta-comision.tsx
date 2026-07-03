"use client";

import { useState } from "react";
import type { CuentaComision } from "@/types/domain";

export function GestionCuentaComision({
  cuentaInicial,
}: {
  cuentaInicial: CuentaComision | null;
}) {
  const [cuentaGuardada, setCuentaGuardada] = useState<CuentaComision | null>(cuentaInicial);
  const [banco, setBanco] = useState(cuentaInicial?.banco ?? "");
  const [cuenta, setCuenta] = useState(cuentaInicial?.cuenta ?? "");
  const [titular, setTitular] = useState(cuentaInicial?.titular ?? "");
  const [nitCi, setNitCi] = useState(cuentaInicial?.nitCi ?? "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);
    setCargando(true);

    try {
      const res = await fetch("/api/cuenta-comision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banco, cuenta, titular, nitCi }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la cuenta.");
        return;
      }

      setCuentaGuardada(data.cuenta);
      setMensajeOk("Cuenta de comisión guardada correctamente.");
    } finally {
      setCargando(false);
    }
  }

  async function eliminar() {
    const confirmar = window.confirm("¿Seguro que deseas eliminar los datos de la cuenta?");
    if (!confirmar) return;

    setError(null);
    setMensajeOk(null);
    setCargando(true);

    try {
      const res = await fetch("/api/cuenta-comision", { method: "DELETE" });

      if (!res.ok) {
        setError("No se pudo eliminar la cuenta.");
        return;
      }

      setCuentaGuardada(null);
      setBanco("");
      setCuenta("");
      setTitular("");
      setNitCi("");
      setMensajeOk("Cuenta eliminada correctamente.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
          Cuenta para pago de comisiones
        </h2>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Estos datos se mostrarán al asesor cuando deba adjuntar el comprobante de pago.
        </p>
      </div>

      <form onSubmit={guardar} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Campo label="Banco" value={banco} onChange={setBanco} placeholder="Ej. BNB" />
        <Campo label="Cuenta" value={cuenta} onChange={setCuenta} placeholder="Ej. 1000000000" />
        <Campo label="Titular" value={titular} onChange={setTitular} placeholder="Ej. Century 21 Rita Quiroga" />
        <Campo label="NIT/CI" value={nitCi} onChange={setNitCi} placeholder="Ej. 0000000" />

        <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
          <button
            type="submit"
            disabled={cargando}
            className="focus-ring rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-60"
          >
            {cargando ? "Guardando..." : cuentaGuardada ? "Actualizar cuenta" : "Guardar cuenta"}
          </button>

          {cuentaGuardada && (
            <button
              type="button"
              onClick={eliminar}
              disabled={cargando}
              className="focus-ring rounded-md border border-signal-danger/40 px-5 py-2.5 font-medium text-signal-danger hover:bg-signal-danger/10 disabled:opacity-60"
            >
              Eliminar cuenta
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="mt-4 rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}

      {mensajeOk && (
        <p className="mt-4 rounded-md border border-signal-ok/40 bg-signal-ok/10 px-3 py-2 text-sm text-signal-ok">
          {mensajeOk}
        </p>
      )}

      {cuentaGuardada && (
        <div className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-4 dark:border-carbon-700 dark:bg-carbon-900">
          <p className="text-sm font-semibold text-carbon-900 dark:text-gold-50">
            Cuenta activa
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
            <Dato label="Banco" valor={cuentaGuardada.banco} />
            <Dato label="Cuenta" valor={cuentaGuardada.cuenta} />
            <Dato label="Titular" valor={cuentaGuardada.titular} />
            <Dato label="NIT/CI" valor={cuentaGuardada.nitCi} />
          </div>
        </div>
      )}
    </section>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-carbon-700 dark:text-gold-100/80">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder={placeholder}
        className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 placeholder:text-carbon-400 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50 dark:placeholder:text-gold-100/30"
      />
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-carbon-500 dark:text-gold-100/40">
        {label}
      </p>
      <p className="mt-1 font-medium text-carbon-900 dark:text-gold-50">
        {valor}
      </p>
    </div>
  );
}