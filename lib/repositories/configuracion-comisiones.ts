import { kv, KEYS } from "@/lib/redis";
import { listarCategoriasAsesor } from "@/lib/repositories/categorias-asesor";
import type {
  ConfiguracionComisiones,
  ConfiguracionComisionTeamCategoria,
} from "@/types/domain";

const PORCENTAJE_OFICINA_NACIONAL_POR_DEFECTO = 8;

function completarConfiguracionPorCategorias(
  configuracion: Partial<ConfiguracionComisiones>,
  categoriaIds: string[],
): ConfiguracionComisiones {
  const guardadas = configuracion.comisionesTeamPorCategoria ?? [];

  return {
    porcentajeOficinaNacional:
      configuracion.porcentajeOficinaNacional ??
      PORCENTAJE_OFICINA_NACIONAL_POR_DEFECTO,
    comisionesTeamPorCategoria: categoriaIds.map(
      (categoriaId) =>
        guardadas.find((item) => item.categoriaId === categoriaId) ?? {
          categoriaId,
          porcentajeOficina: 0,
          porcentajeTeamLeader: 0,
        },
    ),
    nombreOficina: configuracion.nombreOficina ?? "",
    actualizadoEn: configuracion.actualizadoEn ?? new Date().toISOString(),
  };
}

function validarPorcentaje(porcentaje: number): number {
  if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
    throw new Error("Los porcentajes deben estar entre 0 y 100.");
  }

  const normalizado = Math.round(porcentaje * 100) / 100;
  if (Math.abs(porcentaje - normalizado) >= 1e-9) {
    throw new Error("Los porcentajes admiten hasta dos decimales.");
  }

  return normalizado;
}

export async function obtenerConfiguracionComisiones(): Promise<ConfiguracionComisiones> {
  const [guardada, categorias] = await Promise.all([
    kv.get<Partial<ConfiguracionComisiones>>(KEYS.configuracionComisiones),
    listarCategoriasAsesor(),
  ]);

  const configuracion = completarConfiguracionPorCategorias(
    guardada ?? {},
    categorias.map((categoria) => categoria.id),
  );

  const idsGuardados = new Set(
    guardada?.comisionesTeamPorCategoria?.map((item) => item.categoriaId) ?? [],
  );
  const requiereSincronizacion =
    !guardada ||
    !Array.isArray(guardada.comisionesTeamPorCategoria) ||
    idsGuardados.size !== categorias.length ||
    categorias.some((categoria) => !idsGuardados.has(categoria.id));

  if (requiereSincronizacion) {
    await kv.set(KEYS.configuracionComisiones, configuracion);
  }

  return configuracion;
}

export async function actualizarPorcentajeOficinaNacional(
  porcentajeOficinaNacional: number,
): Promise<ConfiguracionComisiones> {
  const actual = await obtenerConfiguracionComisiones();
  const configuracion = {
    ...actual,
    porcentajeOficinaNacional: validarPorcentaje(porcentajeOficinaNacional),
    actualizadoEn: new Date().toISOString(),
  };
  await kv.set(KEYS.configuracionComisiones, configuracion);
  return configuracion;
}

export async function actualizarComisionesTeamPorCategoria(
  comisiones: ConfiguracionComisionTeamCategoria[],
): Promise<ConfiguracionComisiones> {
  const categorias = await listarCategoriasAsesor();
  const idsCategorias = new Set(categorias.map((categoria) => categoria.id));
  const idsRecibidos = new Set<string>();

  const normalizadas = comisiones.map((item) => {
    if (!idsCategorias.has(item.categoriaId)) {
      throw new Error("Una de las categorías seleccionadas no existe.");
    }
    if (idsRecibidos.has(item.categoriaId)) {
      throw new Error("No se puede repetir una categoría.");
    }
    idsRecibidos.add(item.categoriaId);

    const porcentajeOficina = validarPorcentaje(item.porcentajeOficina);
    const porcentajeTeamLeader = validarPorcentaje(item.porcentajeTeamLeader);
    if (porcentajeOficina + porcentajeTeamLeader > 100) {
      throw new Error(
        "La suma de Oficina y Team Leader no puede superar 100 %.",
      );
    }
    return {
      categoriaId: item.categoriaId,
      porcentajeOficina,
      porcentajeTeamLeader,
    };
  });

  if (normalizadas.length !== categorias.length) {
    throw new Error("Debes enviar la configuración de todas las categorías.");
  }

  const actual = await obtenerConfiguracionComisiones();
  const configuracion = {
    ...actual,
    comisionesTeamPorCategoria: normalizadas,
    actualizadoEn: new Date().toISOString(),
  };
  await kv.set(KEYS.configuracionComisiones, configuracion);
  return configuracion;
}

export async function actualizarNombreOficina(
  nombreOficina: string,
): Promise<ConfiguracionComisiones> {
  const nombre = nombreOficina.trim();
  if (nombre.length < 2 || nombre.length > 120) {
    throw new Error(
      "El nombre de la oficina debe tener entre 2 y 120 caracteres.",
    );
  }

  const actual = await obtenerConfiguracionComisiones();
  const configuracion = {
    ...actual,
    nombreOficina: nombre,
    actualizadoEn: new Date().toISOString(),
  };
  await kv.set(KEYS.configuracionComisiones, configuracion);
  return configuracion;
}
