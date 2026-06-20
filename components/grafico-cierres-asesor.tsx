"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DatoAsesor {
  nombre: string;
  cierres: number;
}

export function GraficoCierresPorAsesor({ datos }: { datos: DatoAsesor[] }) {
  if (datos.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-gold-100/40">
        Todavía no hay cierres registrados para graficar.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={datos} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2e2b26" vertical={false} />
        <XAxis dataKey="nombre" stroke="#dfc06b" tick={{ fontSize: 11, fill: "#dfc06b" }} />
        <YAxis stroke="#dfc06b" tick={{ fontSize: 11, fill: "#dfc06b" }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "#211f1c",
            border: "1px solid #454039",
            borderRadius: 8,
            color: "#fbf6ea",
          }}
        />
        <Bar dataKey="cierres" fill="#b8860b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
