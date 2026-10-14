import { existsSync, copyFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';

const config = 'dist/server/wrangler.json';
if (!existsSync(config)) throw new Error('Primero ejecutá npm run build.');
// Wrangler lee las variables junto a la configuración generada.
// Sincronizar la clave actual permite cambiarla sin volver a compilar.
copyFileSync('.dev.vars', join(dirname(config), '.dev.vars'));
process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= 'false';
process.env.WRANGLER_SEND_METRICS ??= 'false';
const child = spawn(process.execPath, [
  'node_modules/wrangler/bin/wrangler.js', 'dev', '--config', config,
  '--local', '--persist-to', '.wrangler/state', '--ip', '127.0.0.1', '--port', '5173', '--inspector-port', '0'
], { stdio: 'inherit', env: process.env });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 0; });
