/**
 * Crea el primer usuario administrador.
 * Uso: npm run seed
 * Puedes configurar el correo/contraseña con variables de entorno,
 * o se usarán los valores por defecto de abajo.
 */
import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@empresa.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "cambia-esta-password";
  const name = process.env.SEED_ADMIN_NAME || "Administrador";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Ya existe un usuario con el correo ${email}. No se creó ninguno nuevo.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN" },
  });

  console.log("Usuario administrador creado:");
  console.log(`  Correo:     ${email}`);
  console.log(`  Contraseña: ${password}`);
  console.log("Cámbiala después de tu primer login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
