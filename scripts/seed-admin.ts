/**
 * Crea el primer usuario administrador del dashboard.
 * Uso: npm run seed:admin -- --username=admin --password=CambiaEsto123 --nombre="Rita Quiroga" --rol=ADMIN
 */
import "dotenv/config";
import { crearUsuarioAdmin } from "@/lib/repositories/usuarios-admin";
import type { RolUsuarioAdmin } from "@/types/domain";

function obtenerArg(nombre: string): string | undefined {
  const arg = process.argv.find((a) => a.startsWith(`--${nombre}=`));
  return arg?.split("=")[1];
}

async function main() {
  const username = obtenerArg("username");
  const password = obtenerArg("password");
  const nombre = obtenerArg("nombre") ?? username;
  const rol = (obtenerArg("rol") ?? "ADMIN") as RolUsuarioAdmin;

  if (!username || !password) {
    console.error(
      "Uso: npm run seed:admin -- --username=admin --password=TuClaveSegura --nombre=\"Nombre Completo\" --rol=ADMIN"
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  const usuario = await crearUsuarioAdmin({ username, password, nombre: nombre!, rol });
  console.log(`✅ Usuario administrador creado: ${usuario.username} (rol: ${usuario.rol})`);
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
