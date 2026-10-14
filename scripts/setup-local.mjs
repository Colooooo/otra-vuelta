import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
if (process.env.VERCEL) throw new Error('La preparación local no debe ejecutarse en Vercel.');
mkdirSync('.data', { recursive: true });
nextEnv.loadEnvConfig(root);

if (!process.env.ADMIN_KEY) {
  const current = existsSync('.env.local') ? readFileSync('.env.local', 'utf8') : '';
  const key = randomBytes(24).toString('base64url');
  writeFileSync('.env.local', `${current}\nADMIN_KEY=${key}\n`);
  console.log('Clave de administración guardada en .env.local.');
}

console.log('La clave del panel está en .env.local (ADMIN_KEY). Configurá DATABASE_URL para conectar Supabase.');
