import 'server-only';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const directory = join(process.cwd(), '.data', 'photos');

let client: SupabaseClient | undefined;
const bucket = 'otra-vuelta-photos';
function storage() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (url && key) {
    client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
    return client.storage.from(bucket);
  }
  if (process.env.VERCEL || url || key) throw new Error('Configurá SUPABASE_URL y SUPABASE_SECRET_KEY para las fotos.');
  return null;
}

export async function savePhoto(id: string, bytes: Uint8Array, contentType: string) {
  const remote = storage();
  if (remote) {
    const { error } = await remote.upload(id, bytes, { contentType, upsert: false });
    if (error) throw error;
    return;
  }
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, id), bytes);
  await writeFile(join(directory, `${id}.json`), JSON.stringify({ contentType }));
}

export async function readPhoto(id: string) {
  const remote = storage();
  if (remote) {
    const { data, error } = await remote.download(id);
    if (error) {
      if ('statusCode' in error && ['404', '400'].includes(String(error.statusCode)) && /not found|does not exist/i.test(error.message)) return null;
      throw error;
    }
    return { body: data.stream(), contentType: data.type || 'image/jpeg' };
  }
  try {
    const [bytes, metadata] = await Promise.all([
      readFile(join(directory, id)), readFile(join(directory, `${id}.json`), 'utf8'),
    ]);
    return { body: new Uint8Array(bytes), contentType: JSON.parse(metadata).contentType as string };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
