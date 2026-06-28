"use client";

import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function GraficoLineaRegistros({
  datos,
}: {
  datos: { etiqueta: string; cierres: number }[];
}) {
  if (datos.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-carbon-500 dark:text-gold-100/40">
        Todavía no hay registros en este período.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={datos} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
        <defs>
          <linearGradient id="colorCierres" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#BEAF87" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#BEAF87" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="#A19276" opacity={0.25} vertical={false} />

        <XAxis
          dataKey="etiqueta"
          stroke="#A19276"
          tick={{ fontSize: 11, fill: "#A19276" }}
        />

        <YAxis
          allowDecimals={false}
          stroke="#A19276"
          tick={{ fontSize: 11, fill: "#A19276" }}
        />

        <Tooltip
          formatter={(value) => [value, "Cierres registrados"]}
          contentStyle={{
            background: "#252526",
            border: "1px solid #BEAF87",
            borderRadius: 8,
            color: "#F9F8F3",
          }}
        />

        <Area
          type="monotone"
          dataKey="cierres"
          stroke="#BEAF87"
          strokeWidth={2}
          fill="url(#colorCierres)"
        />

        <Brush
          dataKey="etiqueta"
          height={24}
          stroke="#BEAF87"
          travellerWidth={8}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}