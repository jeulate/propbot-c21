"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FormularioLogin({ destino }: { destino: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarEnvio(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }

      router.push(destino);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={manejarEnvio} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-medium text-gold-100/80">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="focus-ring rounded-md border border-carbon-600 bg-carbon-900 px-3.5 py-2.5 text-gold-50 placeholder:text-gold-100/30"
          placeholder="ej. administracion"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-gold-100/80">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="focus-ring rounded-md border border-carbon-600 bg-carbon-900 px-3.5 py-2.5 text-gold-50 placeholder:text-gold-100/30"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="focus-ring mt-1 rounded-md bg-gold-500 px-4 py-2.5 font-semibold text-carbon-950 transition-colors hover:bg-gold-300 disabled:opacity-60"
      >
        {cargando ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
