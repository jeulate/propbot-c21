import { redirect } from "next/navigation";
import { obtenerSesionActual } from "@/lib/auth";

export default async function HomePage() {
  const sesion = await obtenerSesionActual();
  redirect(sesion ? "/dashboard" : "/login");
}
