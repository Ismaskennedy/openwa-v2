import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 ya no carga automáticamente los archivos .env por ti.
// Cargamos .env primero, y .env.local después (con override), igual que hace Next.js,
// para que funcione tanto con tu .env manual como con el que descargas vía
// `vercel env pull .env.local`.
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
