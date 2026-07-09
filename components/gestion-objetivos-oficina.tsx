"use client";

import { useState } from "react";
import type { ObjetivosOficina } from "@/types/domain";

function formatoBs(valor: number): string {
  return `Bs ${new Intl.NumberFormat("es-BO", {
    maximumFractionDigits: 2,
  }).format(valor)}`;
}

export function GestionObjetivosOficina({
  objetivosIniciales,
}: {
  objetivosIniciales: ObjetivosOficina;
}) {
  const [objetivos, setObjetivos] = useState(objetivosIniciales);
  const [centurion, setCenturion] = useState(String(objetivosIniciales.centurion));
  const [dobleCenturion, setDobleCenturion] = useState(String(objetivosIniciales.dobleCenturion));
  const [grandCenturion, setGrandCenturion] = useState(String(objetivosIniciales.grandCenturion));
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setMensajeOk(null);
    setCargando(true);

    try {
      const res = await fetch("/api/objetivos-oficina", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          centurion: Number(centurion),
          dobleCenturion: Number(dobleCenturion),
          grandCenturion: Number(grandCenturion),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudieron guardar los objetivos.");
        return;
      }

      setObjetivos(data.objetivos);
      setMensajeOk("Objetivos de oficina guardados correctamente.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800">
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold text-carbon-900 dark:text-gold-50">
          Objetivos anuales de oficina
        </h2>
        <p className="mt-1 text-sm text-carbon-600 dark:text-gold-100/50">
          Define las metas anuales para medir el avance hacia Centurion, Doble Centurion y Grand Centurion.
        </p>
      </div>

      <form onSubmit={guardar} className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <CampoObjetivo
          label="Centurion"
          value={centurion}
          onChange={setCenturion}
          placeholder="2300000"
        />

        <CampoObjetivo
          label="Doble Centurion"
          value={dobleCenturion}
          onChange={setDobleCenturion}
          placeholder="5000000"
        />

        <CampoObjetivo
          label="Grand Centurion"
          value={grandCenturion}
          onChange={setGrandCenturion}
          placeholder="11000000"
        />

        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={cargando}
            className="focus-ring rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-60"
          >
            {cargando ? "Guardando..." : "Guardar objetivos"}
          </button>
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

      <div className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-4 dark:border-carbon-700 dark:bg-carbon-900">
        <p className="text-sm font-semibold text-carbon-900 dark:text-gold-50">
          Objetivos actuales
        </p>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <ObjetivoActual label="Centurion" valor={objetivos.centurion} />
          <ObjetivoActual label="Doble Centurion" valor={objetivos.dobleCenturion} />
          <ObjetivoActual label="Grand Centurion" valor={objetivos.grandCenturion} />
        </div>
      </div>
    </section>
  );
}

function CampoObjetivo({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
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
        inputMode="decimal"
        placeholder={placeholder}
        className="focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 placeholder:text-carbon-400 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50 dark:placeholder:text-gold-100/30"
      />
    </div>
  );
}

function ObjetivoActual({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-lg bg-white px-4 py-3 dark:bg-carbon-800">
      <p className="text-xs uppercase tracking-wide text-carbon-500 dark:text-gold-100/40">
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-semibold text-carbon-900 dark:text-gold-50">
        {formatoBs(valor)}
      </p>
    </div>
  );
}