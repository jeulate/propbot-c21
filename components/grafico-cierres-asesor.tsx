"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DatoGrafico {
  nombre: string;
  valor: number;
}

export function GraficoRanking({
  datos,
  etiqueta = "Valor",
  tooltipLabel,
}: {
  datos: DatoGrafico[];
  etiqueta?: string;
  tooltipLabel?: string;
}) {
  if (datos.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-carbon-500 dark:text-gold-100/40">
        Todavía no hay datos registrados para graficar.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={datos} margin={{ top: 16, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#A19276" vertical={false} opacity={0.35} />
        <XAxis dataKey="nombre" stroke="#A19276" tick={{ fontSize: 11, fill: "#A19276" }} />
        <YAxis stroke="#A19276" tick={{ fontSize: 11, fill: "#A19276" }} allowDecimals={false} />
        <Tooltip
          formatter={(value) => [value, tooltipLabel ?? etiqueta]}
          contentStyle={{
            background: "#252526",
            border: "1px solid #BEAF87",
            borderRadius: 8,
            color: "#F9F8F3",
          }}
        />
        <Bar dataKey="valor" fill="#BEAF87" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GraficoCierresPorAsesor({ datos }: { datos: { nombre: string; cierres: number }[] }) {
  return (
    <GraficoRanking
      datos={datos.map((item) => ({
        nombre: item.nombre,
        valor: item.cierres,
      }))}
      etiqueta="Cierres"
    />
  );
}
