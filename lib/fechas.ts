const ZONA_HORARIA_BOLIVIA = "America/La_Paz";

export type PeriodoDashboard = "semana" | "mes" | "anio";

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