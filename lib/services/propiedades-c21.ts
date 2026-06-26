export interface PropiedadC21 {
  id: string;
  url: string;
  titulo: string;
}

export async function buscarPropiedadPorId(id: string): Promise<PropiedadC21 | null> {
  const urlBusqueda = `https://c21.com.bo/propiedad/${id}`;

  try {
    const res = await fetch(urlBusqueda, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    const contieneId = html.includes(`ID: ${id}`);
    const tituloMatch = html.match(/<title>(.*?)<\/title>/i);

    if (!contieneId) return null;

    return {
      id,
      url: res.url,
      titulo: tituloMatch?.[1]?.trim() ?? `Propiedad ID ${id}`,
    };
  } catch {
    return null;
  }
}