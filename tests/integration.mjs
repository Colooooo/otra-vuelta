import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const temporary = await mkdtemp(join(tmpdir(), 'otra-vuelta-test-'));
const pg = await PGlite.create();
// Servicios/roles que Supabase incluye y que PGlite no trae por defecto.
await pg.exec(`create role anon; create role authenticated; create schema storage;
  create table storage.buckets (id text primary key, name text not null, public boolean,
  file_size_limit bigint, allowed_mime_types text[]);`);
const dbListener = createServer();
dbListener.listen(0, '127.0.0.1');
await once(dbListener, 'listening');
const dbPort = dbListener.address().port;
await new Promise(resolve => dbListener.close(resolve));
const databaseServer = new PGLiteSocketServer({ db: pg, host: '127.0.0.1', port: dbPort, maxConnections: 3 });
await databaseServer.start();
const env = { ...process.env, NODE_ENV: 'production', VERCEL: '', ADMIN_KEY: 'integration-test-key',
  DATABASE_URL: `postgresql://postgres:postgres@127.0.0.1:${dbPort}/postgres`,
  MIGRATION_DATABASE_URL: '', SUPABASE_URL: '', SUPABASE_SECRET_KEY: '' };
let server, photoId;
try {
  for (let i = 0; i < 2; i++) {
    const migration = spawn(process.execPath, ['scripts/migrate.mjs'], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let errors = '';
    migration.stderr.on('data', data => { errors += data; });
    const [status] = await once(migration, 'exit');
    assert.equal(status, 0, errors);
  }
  const permissions = await pg.query(`select count(*)::int as n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='store' and c.relkind='r' and not c.relrowsecurity`);
  assert.equal(permissions.rows[0].n, 0, 'All store tables must have RLS');
  for (const role of ['anon', 'authenticated']) {
    const access = await pg.query(`select has_schema_privilege($1, 'store', 'usage') as allowed`, [role]);
    assert.equal(access.rows[0].allowed, false, `${role} must not access the store schema`);
    const tables = await pg.query(`select bool_or(has_table_privilege($1, c.oid, 'SELECT,INSERT,UPDATE,DELETE')) as allowed
      from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='store' and c.relkind='r'`, [role]);
    assert.equal(tables.rows[0].allowed, false, `${role} must not access customer records`);
  }
  const bucket = await pg.query(`select public, file_size_limit from storage.buckets where id='otra-vuelta-photos'`);
  assert.equal(bucket.rows[0].public, false);
  const listener = createServer();
  listener.listen(0, '127.0.0.1');
  await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const base = `http://127.0.0.1:${port}`;
  let logs = '';
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', data => { logs += data; });
  server.stderr.on('data', data => { logs += data; });
  const deadline = Date.now() + 30_000;
  while (true) {
    try { if ((await fetch(base)).ok) break; } catch { /* Wait for the server. */ }
    if (Date.now() > deadline || server.exitCode !== null) throw new Error(`Server did not start: ${logs}`);
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  const auth = { Authorization: `Bearer ${env.ADMIN_KEY}` };
  async function action(body, admin = true) {
    return fetch(`${base}/api/store`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(admin ? auth : {}) }, body: JSON.stringify(body) });
  }
  assert.equal((await fetch(`${base}/api/store?admin=1`)).status, 401);
  assert.deepEqual(await (await fetch(`${base}/api/store`)).json(), { products: [], orders: [] });
  assert.equal((await action({ action: 'product' }, false)).status, 401);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5xkAAAAASUVORK5CYII=', 'base64');
  const form = new FormData();
  form.set('photo', new File([png], 'photo.png', { type: 'image/png' }));
  assert.equal((await fetch(`${base}/api/upload`, { method: 'POST', body: form })).status, 401);
  const upload = await fetch(`${base}/api/upload`, { method: 'POST', headers: auth, body: form });
  assert.equal(upload.status, 200);
  const { url } = await upload.json();
  photoId = url.split('/').at(-1);
  const image = await fetch(`${base}${url}`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
  assert.equal((await fetch(`${base}/api/image/${crypto.randomUUID()}`)).status, 404);
  const invalid = new FormData();
  invalid.set('photo', new File(['not an image'], 'bad.png', { type: 'image/png' }));
  assert.equal((await fetch(`${base}/api/upload`, { method: 'POST', headers: auth, body: invalid })).status, 400);
  const oversized = new FormData();
  oversized.set('photo', new File([new Uint8Array(4_000_001)], 'large.png', { type: 'image/png' }));
  assert.equal((await fetch(`${base}/api/upload`, { method: 'POST', headers: auth, body: oversized })).status, 400);
  const product = await action({ action: 'product', title: 'Prueba', description: '', category: 'Ropa', size: 'M', condition: 'Buen estado', price: 12500, images: [url] });
  assert.equal(product.status, 200);
  const { id } = await product.json();
  const order = { action: 'order', ids: [id], name: 'Prueba', phone: '099123456', notes: '', delivery: 'Retiro a coordinar' };
  const reservations = await Promise.all([action(order, false), action(order, false)]);
  assert.deepEqual(reservations.map(r => r.status).sort(), [200, 409], 'Only one customer can reserve a piece');
  const reserved = await reservations.find(r => r.status === 200).json();
  assert.equal(reserved.total, 12500);
  const cancel = await action({ action: 'orderStatus', id: reserved.id, status: 'cancelled' });
  assert.equal(cancel.status, 200);
  assert.equal((await (await fetch(`${base}/api/store`)).json()).products[0].status, 'available');
  const replacement = await (await action(order, false)).json();
  assert.equal((await action({ action: 'orderStatus', id: replacement.id, status: 'completed' })).status, 409);
  assert.equal((await action({ action: 'orderStatus', id: replacement.id, status: 'confirmed' })).status, 200);
  assert.equal((await action({ action: 'orderStatus', id: replacement.id, status: 'completed' })).status, 200);
  assert.equal((await (await fetch(`${base}/api/store`)).json()).products.length, 0);
  const admin = await (await fetch(`${base}/api/store?admin=1`, { headers: auth })).json();
  assert.equal(admin.products[0].status, 'sold');
  assert.equal(admin.orders.length, 2, 'Failed reservation must roll back the entire order');
  console.log('OK: migrations, production pages, authentication, photos, concurrent reservations, rollback, cancellation and completion.');
} finally {
  if (server && server.exitCode === null) {
    const stopped = once(server, 'exit');
    server.kill();
    await stopped;
  }
  if (photoId) {
    await rm(join('.data', 'photos', photoId), { force: true });
    await rm(join('.data', 'photos', `${photoId}.json`), { force: true });
  }
  await databaseServer.stop();
  await pg.close();
  await rm(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
