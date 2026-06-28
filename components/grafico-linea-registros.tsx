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

  const anchoMinimo = Math.max(1000, datos.length * 80);

  return (
    <div className="custom-scrollbar max-w-full overflow-x-auto">
      <div style={{ minWidth: anchoMinimo, minHeight: 390 }}>
        <ResponsiveContainer width="100%" height={390}>
          <AreaChart data={datos} margin={{ top: 20, right: 24, left: 0, bottom: 36 }}>
            <defs>
              <linearGradient id="colorCierres" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#BEAF87" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#BEAF87" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#A19276" opacity={0.25} vertical={false} />

            <XAxis
              dataKey="etiqueta"
              tick={{ fontSize: 12, fill: "#A19276" }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#A19276" }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip
              formatter={(value) => [value, "Cierres registrados"]}
              labelFormatter={(label) => `Fecha: ${label}`}
              contentStyle={{
                background: "#252526",
                border: "1px solid #BEAF87",
                borderRadius: 12,
                color: "#F9F8F3",
              }}
            />

            <Area
              type="monotone"
              dataKey="cierres"
              stroke="#BEAF87"
              strokeWidth={2}
              fill="url(#colorCierres)"
              activeDot={{
                r: 5,
                stroke: "#BEAF87",
                strokeWidth: 2,
                fill: "#252526",
              }}
            />

            <Brush
              dataKey="etiqueta"
              height={28}
              travellerWidth={10}
              stroke="#BEAF87"
              fill="#F9F8F3"
              startIndex={Math.max(0, datos.length - 12)}
              endIndex={datos.length - 1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}