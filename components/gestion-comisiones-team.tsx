"use client";

import { useState } from "react";

type GestionComisionesTeamProps = {
  porcentajeOficinaTeamInicial: number;
  porcentajeTeamLeaderInicial: number;
};

function convertirPorcentaje(valor: string): number {
  return Number(valor.replace(",", "."));
}

export function GestionComisionesTeam({
  porcentajeOficinaTeamInicial,
  porcentajeTeamLeaderInicial,
}: GestionComisionesTeamProps) {
  const [porcentajeOficinaTeam, setPorcentajeOficinaTeam] = useState(
    String(porcentajeOficinaTeamInicial),
  );
  const [porcentajeTeamLeader, setPorcentajeTeamLeader] = useState(
    String(porcentajeTeamLeaderInicial),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);

  async function guardar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMensajeOk(null);

    const oficina = convertirPorcentaje(porcentajeOficinaTeam);
    const lider = convertirPorcentaje(porcentajeTeamLeader);

    if (!Number.isFinite(oficina) || !Number.isFinite(lider)) {
      setError("Ingresa porcentajes validos.");
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch("/api/configuracion", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          porcentajeOficinaTeam: oficina,
          porcentajeTeamLeader: lider,
        }),
      });
      const data = await respuesta.json();

      if (!respuesta.ok) {
        setError(data.error ?? "No se pudo guardar la configuracion de Team.");
        return;
      }

      setPorcentajeOficinaTeam(
        String(data.configuracion.porcentajeOficinaTeam),
      );
      setPorcentajeTeamLeader(String(data.configuracion.porcentajeTeamLeader));
      setMensajeOk("Configuracion de comisiones de Team guardada.");
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div>
        <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
          Comisiones para integrantes de Team
        </h2>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/60">
          Se aplicaran sobre la comision base solamente a integrantes de un Team
          que no sean Team Leaders.
        </p>
      </div>

      <form
        onSubmit={guardar}
        className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <div>
          <label
            htmlFor="porcentaje-oficina-team"
            className="text-sm font-medium text-carbon-700 dark:text-gold-100/80"
          >
            Comision para la oficina (%)
          </label>
          <input
            id="porcentaje-oficina-team"
            type="text"
            inputMode="decimal"
            required
            value={porcentajeOficinaTeam}
            onChange={(e) => setPorcentajeOficinaTeam(e.target.value)}
            placeholder="21.8"
            className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 placeholder:text-carbon-400 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50 dark:placeholder:text-gold-100/30"
          />
        </div>

        <div>
          <label
            htmlFor="porcentaje-team-leader"
            className="text-sm font-medium text-carbon-700 dark:text-gold-100/80"
          >
            Comision para el Team Leader (%)
          </label>
          <input
            id="porcentaje-team-leader"
            type="text"
            inputMode="decimal"
            required
            value={porcentajeTeamLeader}
            onChange={(e) => setPorcentajeTeamLeader(e.target.value)}
            placeholder="4.6"
            className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 placeholder:text-carbon-400 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50 dark:placeholder:text-gold-100/30"
          />
        </div>

        <p className="text-sm text-carbon-600 dark:text-gold-100/70 md:col-span-2">
          Estos valores no modifican la regla actual de los asesores sin Team ni
          la de los Team Leaders. El sistema conservara ambos porcentajes como
          configuracion global para el futuro calculo del chatbot.
        </p>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger md:col-span-2"
          >
            {error}
          </p>
        )}

        {mensajeOk && (
          <p
            role="status"
            className="rounded-md border border-signal-ok/40 bg-signal-ok/10 px-3 py-2 text-sm text-signal-ok md:col-span-2"
          >
            {mensajeOk}
          </p>
        )}

        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={guardando}
            className="focus-ring rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar comisiones de Team"}
          </button>
        </div>
      </form>
    </section>
  );
}
