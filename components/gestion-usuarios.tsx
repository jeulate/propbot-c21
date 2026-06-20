"use client";

import { useState } from "react";
import type { RolUsuarioAdmin } from "@/types/domain";

interface UsuarioSinHash {
  id: string;
  username: string;
  nombre: string;
  rol: RolUsuarioAdmin;
  activo: boolean;
  creadoEn: string;
}

export function GestionUsuarios({ usuariosIniciales }: { usuariosIniciales: UsuarioSinHash[] }) {
  const [usuarios, setUsuarios] = useState(usuariosIniciales);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<RolUsuarioAdmin>("LECTOR");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, nombre, rol }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el usuario.");
        return;
      }
      setUsuarios((prev) => [data.usuario, ...prev]);
      setUsername("");
      setPassword("");
      setNombre("");
      setRol("LECTOR");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={crearUsuario} className="shadow-panel grid grid-cols-1 gap-4 rounded-xl border border-carbon-700 bg-carbon-800 p-6 sm:grid-cols-2 lg:grid-cols-5">
        <Campo label="Usuario" value={username} onChange={setUsername} placeholder="ej. supervisor1" />
        <Campo label="Nombre completo" value={nombre} onChange={setNombre} placeholder="ej. María López" />
        <Campo label="Contraseña" value={password} onChange={setPassword} type="password" placeholder="mín. 8 caracteres" />
        <div>
          <label className="text-sm font-medium text-gold-100/80">Rol</label>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as RolUsuarioAdmin)}
            className="focus-ring mt-1.5 w-full rounded-md border border-carbon-600 bg-carbon-900 px-3.5 py-2.5 text-gold-50"
          >
            <option value="ADMIN">Administrador</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="LECTOR">Solo lectura</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={cargando}
          className="focus-ring self-end rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 hover:bg-gold-300 disabled:opacity-60"
        >
          {cargando ? "Creando..." : "Crear usuario"}
        </button>
      </form>

      {error && (
        <p className="rounded-md border border-signal-danger/40 bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}

      <div className="shadow-panel overflow-x-auto rounded-xl border border-carbon-700 bg-carbon-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-carbon-700 text-xs uppercase tracking-wide text-gold-100/40">
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-carbon-700/50 text-gold-100/80">
                <td className="px-4 py-3 font-mono text-xs">{u.username}</td>
                <td className="px-4 py-3">{u.nombre}</td>
                <td className="px-4 py-3">{u.rol}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.activo ? "bg-signal-ok/15 text-signal-ok" : "bg-signal-danger/15 text-signal-danger"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-gold-100/80">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        placeholder={placeholder}
        className="focus-ring mt-1.5 w-full rounded-md border border-carbon-600 bg-carbon-900 px-3.5 py-2.5 text-gold-50 placeholder:text-gold-100/30"
      />
    </div>
  );
}
