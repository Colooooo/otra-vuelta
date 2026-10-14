import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= 'false';
process.env.WRANGLER_SEND_METRICS ??= 'false';
process.env.WRANGLER_WRITE_LOGS ??= 'false';
process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';

if (!existsSync('.dev.vars')) {
  writeFileSync('.dev.vars', `ADMIN_KEY=${randomBytes(24).toString('base64url')}\n`, { flag: 'wx' });
  console.log('Se creó .dev.vars con la clave del panel de administración.');
}
if (!/^ADMIN_KEY=\S+/m.test(readFileSync('.dev.vars', 'utf8'))) {
  throw new Error('Definí ADMIN_KEY en .dev.vars antes de abrir la tienda.');
}

const result = spawnSync(process.execPath, [
  'node_modules/wrangler/bin/wrangler.js', 'd1', 'migrations', 'apply', 'DB',
  '--local', '--config', 'wrangler.jsonc', '--persist-to', '.wrangler/state',
], { cwd: root, stdio: ['ignore', 'inherit', 'inherit'], env: process.env });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log('Base de datos local lista. La clave del panel está en .dev.vars (ADMIN_KEY).');
