import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { listarTodosLosCierres } from "@/lib/repositories/cierres";
import { obtenerSesionActual } from "@/lib/auth";
import { PERMISOS } from "@/types/domain";
import { obtenerAsesor } from "@/lib/repositories/asesores";
import { obtenerConfiguracionComisiones } from "@/lib/repositories/configuracion-comisiones";

/**
 * Genera un .xlsx con el mismo layout que el formato original
 * "CONTROL DE CIERRES" de Century 21 Rita Quiroga, para que los
 * administrativos puedan exportar y seguir trabajando con el archivo
 * tal como lo conocen.
 */
export async function GET() {
  const sesion = await obtenerSesionActual();
  if (!sesion)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (!PERMISOS[sesion.rol].exportar) {
    return NextResponse.json(
      { error: "No tienes permiso para exportar." },
      { status: 403 },
    );
  }

  const cierres = await listarTodosLosCierres();
  const configuracion = await obtenerConfiguracionComisiones();
  const cierresExportables = await Promise.all(
    cierres.map(async (cierre) => {
      const [captador, colocador] = await Promise.all([
        cierre.asesorCaptadorId.startsWith("externo:")
          ? null
          : obtenerAsesor(cierre.asesorCaptadorId),
        cierre.asesorColocadorId.startsWith("externo:")
          ? null
          : obtenerAsesor(cierre.asesorColocadorId),
      ]);
      return {
        ...cierre,
        asesorCaptadorOficina:
          cierre.asesorCaptadorOficina ||
          (captador ? configuracion.nombreOficina : "") ||
          "",
        asesorCaptadorTelefono:
          cierre.asesorCaptadorTelefono || captador?.celular || "",
        asesorColocadorOficina:
          cierre.asesorColocadorOficina ||
          (colocador ? configuracion.nombreOficina : "") ||
          "",
        asesorColocadorTelefono:
          cierre.asesorColocadorTelefono || colocador?.celular || "",
      };
    }),
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Century 21 Rita Quiroga - Sistema de Control de Cierres";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Control de Cierres");

  sheet.mergeCells("A1:W2");
  sheet.getCell("A1").value = "CENTURY 21 RITA QUIROGA - CONTROL DE CIERRES";
  sheet.getCell("A1").font = { bold: true, size: 14 };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };

  const encabezados = [
    "FECHA CIERRE",
    "ID",
    "ASESOR CAPTADOR",
    "ASESOR COLOCADOR",
    "DIRECCIÓN DEL INMUEBLE",
    "TIPO DE TRANSACCIÓN",
    "MONTO TRANSACCIÓN",
    "% BASE COMISIÓN",
    "% OFICINA NACIONAL",
    "PAGO OFICINA NACIONAL",
    "% OFICINA LOCAL",
    "PAGO OFICINA LOCAL",
    "% CATEGORÍA",
    "PAGO REAL ASESOR",
    "MONTO COMISIÓN (TOTAL A PAGAR)",
    "T.C.",
    "NOMBRE PROPIETARIO",
    "TEL. PROPIETARIO",
    "NOMBRE CLIENTE",
    "TEL. CLIENTE",
    "OFICINA CAPTADOR",
    "TEL. CAPTADOR",
    "OFICINA COLOCADOR",
    "TEL. COLOCADOR",
    "EXCLUSIVA (SI/NO)",
    "ESTADO",
  ];

  const filaEncabezado = sheet.getRow(4);
  encabezados.forEach((texto, i) => {
    const cell = filaEncabezado.getCell(i + 1);
    cell.value = texto;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB8860B" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
  });

  cierresExportables.forEach((c, i) => {
    const row = sheet.getRow(5 + i);
    row.values = [
      c.fechaCierre,
      c.id,
      c.asesorCaptadorNombre,
      c.asesorColocadorNombre,
      c.direccionInmueble,
      c.tipoTransaccion,
      c.montoTransaccion,
      c.asesorCaptadorId === c.registradoPorTelegramId &&
      c.asesorColocadorId === c.registradoPorTelegramId
        ? 4
        : 2,
      c.porcentajeOficinaNacionalAplicado,
      c.montoPagoOficinaNacional,
      c.porcentajeOficinaLocalAplicado,
      c.montoPagoOficinaLocal,
      c.porcentajeCategoriaAplicado,
      c.montoPagoRealAsesor,
      c.montoComision,
      c.tipoCambio,
      c.nombrePropietario,
      c.telPropietario,
      c.nombreCliente,
      c.telCliente,
      c.asesorCaptadorOficina ?? "",
      c.asesorCaptadorTelefono ?? "",
      c.asesorColocadorOficina ?? "",
      c.asesorColocadorTelefono ?? "",
      c.exclusiva ? "SI" : "NO",
      c.estado,
    ];
  });

  sheet.columns.forEach((col, i) => {
    col.width = i === 4 ? 35 : 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const nombreArchivo = `control-cierres-c21-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
