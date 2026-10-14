import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import postgres from 'postgres';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL;
if (!url) throw new Error('Configurá DATABASE_URL o MIGRATION_DATABASE_URL con la conexión de Supabase.');
const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname);
if (process.env.VERCEL && local) throw new Error('Vercel requiere una base remota.');
const sql = postgres(url, { prepare: false, max: 1, ssl: local ? false : 'require' });
try {
  await sql.begin(async transaction => {
    await transaction`select pg_advisory_xact_lock(71809423)`;
    await transaction`create schema if not exists store`;
    await transaction`create table if not exists store.migrations (name text primary key, hash text not null, applied_at timestamptz not null default now())`;
    await transaction`alter table store.migrations enable row level security`;
    const files = (await readdir('supabase/migrations')).filter(file => file.endsWith('.sql')).sort();
    for (const name of files) {
      const source = await readFile(`supabase/migrations/${name}`, 'utf8');
      const hash = createHash('sha256').update(source).digest('hex');
      const previous = await transaction`select hash from store.migrations where name = ${name}`;
      if (previous.length) {
        if (previous[0].hash !== hash) throw new Error(`La migración ${name} ya fue aplicada con otro contenido.`);
        continue;
      }
      await transaction.unsafe(source);
      await transaction`insert into store.migrations (name, hash) values (${name}, ${hash})`;
    }
  });
  console.log('Migraciones aplicadas.');
} finally {
  await sql.end();
}
