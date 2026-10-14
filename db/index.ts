import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "La base de datos local no está disponible. Ejecutá npm run db:migrate y revisá el binding DB en wrangler.jsonc."
    );
  }

  return drizzle(env.DB, { schema });
}
