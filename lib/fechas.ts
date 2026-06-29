const ZONA_HORARIA_BOLIVIA = "America/La_Paz";

export type PeriodoDashboard = "semana" | "mes" | "anio" | "rango";

export function fechaHoraBoliviaISO(fecha = new Date()): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZONA_HORARIA_BOLIVIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return formatter.format(fecha).replace(" ", "T");
}

export function obtenerFechaBolivia(fecha = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: ZONA_HORARIA_BOLIVIA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(fecha);
}

export function obtenerHoraBolivia(fecha = new Date()): string {
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: ZONA_HORARIA_BOLIVIA,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(fecha);
}

export function formatearFechaHoraBolivia(fechaISO?: string): string {
  if (!fechaISO) return "-";

  return new Intl.DateTimeFormat("es-BO", {
    timeZone: ZONA_HORARIA_BOLIVIA,
    dateStyle: "short",
    timeStyle: "short",
    hour12: false,
  }).format(new Date(fechaISO));
}

export function obtenerRangoPeriodoBolivia(
  periodo: PeriodoDashboard,
  fecha = new Date()
): { inicio: string; fin: string; etiqueta: string } {
  const fechaBolivia = fechaHoraBoliviaISO(fecha);
  const [fechaParte] = fechaBolivia.split("T");
  const [anio, mes, dia] = fechaParte.split("-").map(Number);

  let inicio: Date;
  let fin: Date;
  let etiqueta: string;

  if (periodo === "anio") {
    inicio = new Date(Date.UTC(anio, 0, 1, 4, 0, 0));
    fin = new Date(Date.UTC(anio + 1, 0, 1, 4, 0, 0));
    etiqueta = `Año ${anio}`;
  } else if (periodo === "mes") {
    inicio = new Date(Date.UTC(anio, mes - 1, 1, 4, 0, 0));
    fin = new Date(Date.UTC(anio, mes, 1, 4, 0, 0));

    etiqueta = new Intl.DateTimeFormat("es-BO", {
      month: "long",
      year: "numeric",
      timeZone: ZONA_HORARIA_BOLIVIA,
    }).format(inicio);
  } else {
    const diaActualUtcBolivia = new Date(Date.UTC(anio, mes - 1, dia, 4, 0, 0));
    const diaSemana = diaActualUtcBolivia.getUTCDay();
    const diasDesdeLunes = diaSemana === 0 ? 6 : diaSemana - 1;

    inicio = new Date(diaActualUtcBolivia);
    inicio.setUTCDate(inicio.getUTCDate() - diasDesdeLunes);

    fin = new Date(inicio);
    fin.setUTCDate(fin.getUTCDate() + 7);

    etiqueta = `Semana del ${new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: ZONA_HORARIA_BOLIVIA,
    }).format(inicio)}`;
  }

  return {
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    etiqueta,
  };
}

export function estaDentroDelRango(fechaISO: string | undefined, inicioISO: string, finISO: string): boolean {
  if (!fechaISO) return false;

  const fecha = new Date(fechaISO).getTime();
  const inicio = new Date(inicioISO).getTime();
  const fin = new Date(finISO).getTime();

  return fecha >= inicio && fecha < fin;
}

export function obtenerRangoPersonalizadoBolivia(
  desde: string,
  hasta: string
): { inicio: string; fin: string; etiqueta: string } {
  const fechaDesde = normalizarFecha(desde);
  const fechaHasta = normalizarFecha(hasta);

  if (!fechaDesde || !fechaHasta) {
    return obtenerRangoPeriodoBolivia("mes");
  }

  const inicio = new Date(Date.UTC(fechaDesde.anio, fechaDesde.mes - 1, fechaDesde.dia, 4, 0, 0));
  const fin = new Date(Date.UTC(fechaHasta.anio, fechaHasta.mes - 1, fechaHasta.dia + 1, 4, 0, 0));

  if (inicio.getTime() >= fin.getTime()) {
    return obtenerRangoPeriodoBolivia("mes");
  }

  return {
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    etiqueta: `${formatearFechaCortaBolivia(inicio)} - ${formatearFechaCortaBolivia(
      new Date(fin.getTime() - 1)
    )}`,
  };
}

export function esFechaISOValida(fecha: string | undefined): boolean {
  if (!fecha) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !!normalizarFecha(fecha);
}

function normalizarFecha(fecha: string): { anio: number; mes: number; dia: number } | null {
  const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const anio = Number(match[1]);
  const mes = Number(match[2]);
  const dia = Number(match[3]);

  const prueba = new Date(Date.UTC(anio, mes - 1, dia));
  const esValida =
    prueba.getUTCFullYear() === anio &&
    prueba.getUTCMonth() === mes - 1 &&
    prueba.getUTCDate() === dia;

  return esValida ? { anio, mes, dia } : null;
}

function formatearFechaCortaBolivia(fecha: Date): string {
  return new Intl.DateTimeFormat("es-BO", {
    timeZone: ZONA_HORARIA_BOLIVIA,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(fecha);
}