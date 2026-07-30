import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  actualizarPorcentajeOficinaNacional,
  actualizarPorcentajesTeam,
  actualizarNombreOficina,
  obtenerConfiguracionComisiones,
} from "@/lib/repositories/configuracion-comisiones";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";

const normalizarNumero = (valor: unknown) => {
  if (typeof valor !== "string") return valor;

  const valorLimpio = valor.trim();
  if (valorLimpio === "") return undefined;

  return Number(valorLimpio.replace(",", "."));
};

const porcentaje = z.preprocess(
  normalizarNumero,
  z
    .number({
      invalid_type_error: "El porcentaje debe ser un número válido.",
    })
    .finite("El porcentaje debe ser un número válido.")
    .min(0, "El porcentaje no puede ser negativo.")
    .max(100, "El porcentaje no puede superar 100.")
    .refine((valor) => {
      const valorRedondeado = Math.round(valor * 100) / 100;
      return Math.abs(valor - valorRedondeado) < Number.EPSILON * 100;
    }, "El porcentaje admite hasta dos decimales."),
);

const esquemaActualizar = z
  .object({
    porcentajeOficinaNacional: porcentaje.optional(),
    porcentajeOficinaTeam: porcentaje.optional(),
    porcentajeTeamLeader: porcentaje.optional(),
    nombreOficina: z.string().trim().min(2).max(120).optional(),
  })
  .superRefine((datos, ctx) => {
    const incluyeOficinaTeam = datos.porcentajeOficinaTeam !== undefined;
    const incluyeTeamLeader = datos.porcentajeTeamLeader !== undefined;

    if (incluyeOficinaTeam !== incluyeTeamLeader) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debes enviar juntos los dos porcentajes de Team.",
      });
      return;
    }

    if (
      incluyeOficinaTeam &&
      incluyeTeamLeader &&
      datos.porcentajeOficinaTeam! + datos.porcentajeTeamLeader! > 100
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La suma de los porcentajes de Team no puede superar 100.",
      });
    }
  });

export async function GET() {
  const sesion = await obtenerSesionActual();
  if (!sesion)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const configuracion = await obtenerConfiguracionComisiones();
  return NextResponse.json({ configuracion });
}

export async function PATCH(req: NextRequest) {
  const sesion = await obtenerSesionActual();
  if (!sesion)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!PERMISOS[sesion.rol].gestionarAsesores) {
    return NextResponse.json(
      { error: "No tienes permiso para gestionar configuracion." },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = esquemaActualizar.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      {
        error:
          parsed.error?.issues[0]?.message ??
          "Datos invalidos. Revisa los valores enviados.",
      },
      { status: 400 },
    );
  }

  try {
    let configuracion = await obtenerConfiguracionComisiones();
    if (parsed.data.porcentajeOficinaNacional !== undefined) {
      configuracion = await actualizarPorcentajeOficinaNacional(
        parsed.data.porcentajeOficinaNacional,
      );
    }
    if (
      parsed.data.porcentajeOficinaTeam !== undefined &&
      parsed.data.porcentajeTeamLeader !== undefined
    ) {
      configuracion = await actualizarPorcentajesTeam(
        parsed.data.porcentajeOficinaTeam,
        parsed.data.porcentajeTeamLeader,
      );
    }
    if (parsed.data.nombreOficina !== undefined) {
      configuracion = await actualizarNombreOficina(parsed.data.nombreOficina);
    }
    return NextResponse.json({ ok: true, configuracion });
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }
}
