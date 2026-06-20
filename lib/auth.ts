import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { RolUsuarioAdmin } from "@/types/domain";

const COOKIE_NAME = "c21_session";
const EXPIRA_EN = "8h";

function obtenerSecreto(): Uint8Array {
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) {
    throw new Error(
      "Falta la variable de entorno AUTH_SECRET. Genérala con: openssl rand -base64 32"
    );
  }
  return new TextEncoder().encode(secreto);
}

export interface SesionPayload {
  sub: string; // username
  nombre: string;
  rol: RolUsuarioAdmin;
}

export async function crearTokenSesion(payload: SesionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRA_EN)
    .sign(obtenerSecreto());
}

export async function verificarTokenSesion(token: string): Promise<SesionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, obtenerSecreto());
    return payload as unknown as SesionPayload;
  } catch {
    return null;
  }
}

export async function establecerCookieSesion(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60, // 8 horas
  });
}

export async function obtenerSesionActual(): Promise<SesionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verificarTokenSesion(token);
}

export async function cerrarSesion() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME };
