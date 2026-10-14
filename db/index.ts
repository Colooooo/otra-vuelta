import 'server-only';
import postgres from 'postgres';

let client: ReturnType<typeof postgres> | undefined;

export function getClient() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('Configurá DATABASE_URL con la conexión Postgres de Supabase.');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname);
    if (process.env.VERCEL && local) throw new Error('Vercel requiere una base Supabase remota.');
    client = postgres(url, { prepare: false, max: 1, idle_timeout: 20, connect_timeout: 10, ssl: local ? false : 'require' });
  }
  return client;
}

// Los valores siempre viajan como parámetros; solo se traduce la sintaxis de placeholders.
type Value = string | number | null;
class Statement {
  constructor(readonly sql: string, readonly args: Value[] = []) {}
  get text() { let index = 0; return this.sql.replace(/\?/g, () => `$${++index}`); }
  bind(...args: Value[]) { return new Statement(this.sql, args); }
  async all() { return { results: await getClient().unsafe(this.text, this.args) }; }
  async first() { return (await getClient().unsafe(this.text, this.args))[0] ?? null; }
  async run() { return { meta: { changes: (await getClient().unsafe(this.text, this.args)).count } }; }
}

export const database = {
  prepare(sql: string) { return new Statement(sql); },
  async batch(statements: Statement[]) {
    return getClient().begin(async transaction => {
      const results = [];
      for (const statement of statements) {
        const result = await transaction.unsafe(statement.text, statement.args);
        results.push({ meta: { changes: result.count } });
      }
      return results;
    });
  },
};
