"use client";

import { useState } from "react";

export function GestionOficina({ nombreInicial }: { nombreInicial: string }) {
  const [nombre, setNombre] = useState(nombreInicial);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(event: React.FormEvent) {
    event.preventDefault();
    setGuardando(true);
    setMensaje("");
    const respuesta = await fetch("/api/configuracion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombreOficina: nombre }),
    });
    const data = await respuesta.json();
    setMensaje(
      respuesta.ok
        ? "Oficina actualizada."
        : (data.error ?? "No se pudo actualizar."),
    );
    setGuardando(false);
  }

  return (
    <form
      onSubmit={guardar}
      className="rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800"
    >
      <h2 className="font-display text-lg font-semibold">Oficina global</h2>
      <p className="mt-1 text-sm text-carbon-500">
        Se aplicará a todos los asesores internos y a los nuevos cierres.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          minLength={2}
          maxLength={120}
          className="flex-1 rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 text-carbon-900 dark:border-carbon-600 dark:bg-carbon-900 dark:text-gold-50"
          placeholder="Ej. Century 21 Rita Quiroga"
        />
        <button
          disabled={guardando}
          className="rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar oficina"}
        </button>
      </div>
      {mensaje && <p className="mt-3 text-sm">{mensaje}</p>}
    </form>
  );
}
