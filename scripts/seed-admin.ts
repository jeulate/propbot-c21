/**
 * Crea el primer usuario administrador del dashboard.
 *
 * Uso:
 * npm run seed:admin -- --username=admin --password=CambiaEsto123 --nombre="Rita Quiroga" --cargo="Broker Owner" --email="admin@empresa.com" --celular="70000000" --rol=ADMIN
 */
import "dotenv/config";
import { crearUsuarioAdmin } from "@/lib/repositories/usuarios-admin";
import type { RolUsuarioAdmin } from "@/types/domain";

function obtenerArg(nombre: string): string | undefined {
  const prefijo = `--${nombre}=`;
  const argumento = process.argv.find((item) => item.startsWith(prefijo));

  return argumento?.slice(prefijo.length).trim();
}

async function main() {
  const username = obtenerArg("username");
  const password = obtenerArg("password");
  const nombre = obtenerArg("nombre");
  const cargo = obtenerArg("cargo");
  const email = obtenerArg("email");
  const celular = obtenerArg("celular");
  const rol = (obtenerArg("rol") ?? "ADMIN") as RolUsuarioAdmin;

  if (!username || !password || !nombre || !cargo || !email) {
    console.error(
      'Uso: npm run seed:admin -- --username=admin --password=TuClaveSegura --nombre="Nombre Completo" --cargo="Cargo" --email="correo@empresa.com" --celular="70000000" --rol=ADMIN',
    );
    process.exit(1);
  }

  if (password.length < 8) {
    console.error("❌ La contraseña debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  if (!["ADMIN", "SUPERVISOR", "LECTOR"].includes(rol)) {
    console.error("❌ El rol debe ser ADMIN, SUPERVISOR o LECTOR.");
    process.exit(1);
  }

  const usuario = await crearUsuarioAdmin({
    username,
    password,
    nombre,
    cargo,
    email,
    celular,
    rol,
  });

  console.log(
    `✅ Usuario administrador creado: ${usuario.username} (rol: ${usuario.rol})`,
  );
}

main().catch((error: unknown) => {
  const mensaje =
    error instanceof Error ? error.message : "Ocurrió un error desconocido.";

  console.error("❌ Error:", mensaje);
  process.exit(1);
});
