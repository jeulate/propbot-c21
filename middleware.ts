import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@/lib/auth";

/**
 * Protege todas las rutas bajo /dashboard. La verificación del JWT se hace
 * aquí mismo (Edge runtime) con `jose`, sin pasar por la capa de Redis,
 * para mantener el middleware rápido y sin dependencias de red.
 */
export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirigirALogin(request);
  }

  try {
    const secreto = new TextEncoder().encode(process.env.AUTH_SECRET);
    await jwtVerify(token, secreto);
    return NextResponse.next();
  } catch {
    return redirigirALogin(request);
  }
}

function redirigirALogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/cierres/:path*",
    "/api/asesores/:path*",
    "/api/usuarios/:path*",
    "/api/categorias/:path*",
  ],
};
