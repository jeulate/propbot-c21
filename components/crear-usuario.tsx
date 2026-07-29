"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import type { RolUsuarioAdmin } from "@/types/domain";
import type { UsuarioPublico } from "@/types/usuario";

const VACIO = {
  username: "",
  password: "",
  nombre: "",
  cargo: "",
  email: "",
  celular: "",
  rol: "LECTOR" as RolUsuarioAdmin,
};

export function CrearUsuario() {
  const router = useRouter();
  const [formulario, setFormulario] = useState(VACIO);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  function cambiar(campo: keyof typeof VACIO, valor: string) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function crearUsuario(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });
      const contenido = await respuesta.text();
      const data = contenido
        ? (JSON.parse(contenido) as {
            error?: string;
            usuario?: UsuarioPublico;
          })
        : {};

      if (!respuesta.ok || !data.usuario) {
        setError(data.error ?? "No se pudo crear el usuario.");
        return;
      }

      router.push("/dashboard/usuarios?creado=1");
      router.refresh();
    } catch {
      setError("No se pudo procesar la respuesta del servidor.");
    } finally {
      setCargando(false);
    }
  }

  const inputClass =
    "focus-ring mt-1.5 w-full rounded-md border border-gold-300 bg-gold-50 px-3.5 py-2.5 dark:border-carbon-600 dark:bg-carbon-900";

  return (
    <form
      onSubmit={crearUsuario}
      className="shadow-panel rounded-xl border border-gold-200 bg-white p-6 dark:border-carbon-700 dark:bg-carbon-800"
    >
      <div className="flex items-center gap-2">
        <UserPlus size={20} />
        <h2 className="text-lg font-semibold">Datos del usuario</h2>
      </div>
      <p className="mt-1 text-sm text-carbon-500 dark:text-gold-100/50">
        La fotografía podrá cargarla el usuario posteriormente desde Mi perfil.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Campo
          label="Nombre completo"
          value={formulario.nombre}
          onChange={(valor) => cambiar("nombre", valor)}
          className={inputClass}
        />
        <Campo
          label="Cargo"
          value={formulario.cargo}
          onChange={(valor) => cambiar("cargo", valor)}
          className={inputClass}
        />
        <Campo
          label="Correo electrónico"
          type="email"
          value={formulario.email}
          onChange={(valor) => cambiar("email", valor)}
          className={inputClass}
        />
        <Campo
          label="Celular (opcional)"
          type="tel"
          required={false}
          value={formulario.celular}
          onChange={(valor) => cambiar("celular", valor)}
          className={inputClass}
        />
        <Campo
          label="Usuario"
          value={formulario.username}
          onChange={(valor) => cambiar("username", valor)}
          className={inputClass}
        />
        <Campo
          label="Contraseña temporal"
          type="password"
          value={formulario.password}
          onChange={(valor) => cambiar("password", valor)}
          className={inputClass}
        />
        <label className="text-sm font-medium">
          Rol
          <select
            value={formulario.rol}
            onChange={(evento) => cambiar("rol", evento.target.value)}
            className={inputClass}
          >
            <option value="ADMIN">Administrador</option>
            <option value="SUPERVISOR">Supervisor</option>
            <option value="LECTOR">Solo lectura</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-signal-danger/10 px-3 py-2 text-sm text-signal-danger">
          {error}
        </p>
      )}

      <button
        disabled={cargando}
        className="mt-5 rounded-md bg-gold-500 px-5 py-2.5 font-medium text-carbon-950 disabled:opacity-60"
      >
        {cargando ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}

function Campo({
  label,
  value,
  onChange,
  className,
  type = "text",
  required = true,
}: {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  className: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input
        type={type}
        value={value}
        onChange={(evento) => onChange(evento.target.value)}
        required={required}
        className={className}
      />
    </label>
  );
}
