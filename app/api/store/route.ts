import { database } from '@/db';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (data: any, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const categories = ['Ropa', 'Calzado', 'Accesorios', 'Hogar', 'Otros'];
function admin(req: Request) { const key = process.env.ADMIN_KEY; return !!key && req.headers.get('Authorization') === `Bearer ${key}`; }
function str(v: unknown, max: number) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
export async function GET(req: Request) {
 const db = database, isAdmin = new URL(req.url).searchParams.has('admin');
 if (isAdmin && !admin(req)) return json({ error: 'La clave de administración no es correcta.' }, 401);
 const { results: products } = await db.prepare(isAdmin ? 'SELECT * FROM store.products ORDER BY created DESC' : "SELECT * FROM store.products WHERE status IN ('available','reserved') ORDER BY created DESC").all();
 let orders: any[] = [];
 if (isAdmin) { const o = await db.prepare('SELECT * FROM store.orders ORDER BY created DESC LIMIT 300').all(), i = await db.prepare('SELECT * FROM store.order_items').all(); orders = o.results.map((order: any) => ({ ...order, items: i.results.filter((item: any) => item.order_id === order.id) })); }
 return json({ products: products.map((p: any) => ({ ...p, images: JSON.parse(p.images) })), orders });
}
export async function POST(req: Request) {
 const origin = req.headers.get('Origin');
 if (origin && origin !== new URL(req.url).origin) return json({ error: 'Solicitud no permitida.' }, 403);
 const db = database;
 let b: any; try { b = await req.json(); } catch { return json({ error: 'Solicitud inválida.' }, 400); }
 if (b.action !== 'order' && !admin(req)) return json({ error: 'Ingresá al panel para administrar la tienda.' }, 401);
 try {
  if (b.action === 'product') {
   const title = str(b.title,100), description = str(b.description,2000), size = str(b.size,60), condition = str(b.condition,60), price = Number(b.price);
   if (!title || !condition || !categories.includes(b.category) || !Number.isSafeInteger(price) || price < 1 || price > 100000000) return json({ error: 'Revisá el nombre, la categoría, el estado y el precio.' },400);
   if (!Array.isArray(b.images) || b.images.length < 1 || b.images.length > 5 || b.images.some((x: any) => typeof x !== 'string' || !/^\/api\/image\/[a-f0-9-]{36}$/.test(x))) return json({ error: 'Agregá entre una y cinco fotos.' },400);
   const id = b.id || crypto.randomUUID();
   if (b.id) {
    const old: any = await db.prepare('SELECT status FROM store.products WHERE id=?').bind(id).first();
    if (!old || !['available','hidden'].includes(old.status)) return json({ error: 'Este artículo está reservado o vendido. Gestioná su pedido primero.' },409);
    await db.prepare('UPDATE store.products SET title=?,description=?,category=?,size=?,condition=?,price=?,images=? WHERE id=?').bind(title,description,b.category,size,condition,price,JSON.stringify(b.images),id).run();
   } else await db.prepare('INSERT INTO store.products (id,title,description,category,size,condition,price,images,status,created) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(id,title,description,b.category,size,condition,price,JSON.stringify(b.images),'available',new Date().toISOString()).run();
   return json({ id });
  }
  if (b.action === 'visibility') {
   if (!['available','hidden'].includes(b.status)) return json({ error: 'Estado inválido.' },400);
   const r = await db.prepare("UPDATE store.products SET status=? WHERE id=? AND status IN ('available','hidden')").bind(b.status,str(b.id,50)).run();
   return r.meta.changes ? json({ ok: true }) : json({ error: 'No se puede ocultar una pieza reservada o vendida.' },409);
  }
  if (b.action === 'order') {
   const name = str(b.name,100), phone = str(b.phone,40), notes = str(b.notes,1000);
   if (b.website || name.length < 2 || !/^[+\d\s().-]{7,40}$/.test(phone) || !['Retiro a coordinar','Envío a coordinar'].includes(b.delivery)) return json({ error: 'Completá tu nombre, teléfono y forma de entrega.' },400);
   const ids: string[] = Array.isArray(b.ids) ? [...new Set<string>(b.ids)] : [];
   if (!ids.length || ids.length > 10 || ids.some(x => typeof x !== 'string' || x.length > 50)) return json({ error: 'Elegí entre uno y diez artículos.' },400);
   const rate: any = await db.prepare('SELECT COUNT(*) n FROM store.orders WHERE phone=? AND created > ?').bind(phone,new Date(Date.now()-3600000).toISOString()).first();
   if (rate.n >= 5) return json({ error: 'Ya recibimos varios pedidos con este teléfono. Intentá más tarde.' },429);
   const products: any[] = (await db.prepare(`SELECT * FROM store.products WHERE id IN (${ids.map(()=>'?').join(',')}) AND status='available' ORDER BY id`).bind(...ids).all()).results;
   if (products.length !== ids.length) return json({ error: 'Una de las piezas ya no está disponible. Actualizá tu selección.' },409);
   const id = crypto.randomUUID(), total = products.reduce((sum,p)=>sum+p.price,0);
   const stmts = [db.prepare('INSERT INTO store.orders (id,name,phone,delivery,notes,status,total,created) VALUES (?,?,?,?,?,?,?,?)').bind(id,name,phone,b.delivery,notes,'pending',total,new Date().toISOString())];
   for (const p of products) { stmts.push(db.prepare('INSERT INTO store.order_items (id,order_id,product_id,title,price,reservation) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),id,p.id,p.title,p.price,p.id)); stmts.push(db.prepare("UPDATE store.products SET status='reserved' WHERE id=?").bind(p.id)); }
   try { await db.batch(stmts); } catch { return json({ error: 'Una pieza acaba de ser reservada por otra persona. Actualizá tu selección.' },409); }
   return json({ id, total });
  }
  if (b.action === 'orderStatus') {
   if (!['confirmed','completed','cancelled'].includes(b.status)) return json({ error: 'Estado inválido.' },400);
   const order: any = await db.prepare('SELECT * FROM store.orders WHERE id=?').bind(str(b.id,50)).first();
   if (!order || ['completed','cancelled'].includes(order.status)) return json({ error: 'El pedido ya está cerrado.' },409);
   if (b.status === 'completed' && order.status !== 'confirmed') return json({ error: 'Confirmá el pedido antes de marcarlo entregado.' },409);
   const stmts = [db.prepare('UPDATE store.orders SET status=? WHERE id=? AND status=?').bind(b.status,order.id,order.status)];
   if (b.status === 'cancelled') {
    stmts.push(db.prepare("UPDATE store.products SET status='available' WHERE id IN (SELECT product_id FROM store.order_items WHERE order_id=? AND reservation IS NOT NULL) AND EXISTS (SELECT 1 FROM store.orders WHERE id=? AND status='cancelled')").bind(order.id,order.id));
    stmts.push(db.prepare("UPDATE store.order_items SET reservation=NULL WHERE order_id=? AND EXISTS (SELECT 1 FROM store.orders WHERE id=? AND status='cancelled')").bind(order.id,order.id));
   }
   if (b.status === 'completed') stmts.push(db.prepare("UPDATE store.products SET status='sold' WHERE id IN (SELECT product_id FROM store.order_items WHERE order_id=? AND reservation IS NOT NULL) AND EXISTS (SELECT 1 FROM store.orders WHERE id=? AND status='completed')").bind(order.id,order.id));
   const result = await db.batch(stmts);
   return result[0].meta.changes ? json({ok:true}) : json({error:'El pedido cambió mientras lo gestionabas. Actualizá el panel.'},409);
  }
  return json({ error: 'Acción inválida.' },400);
 } catch { return json({ error: 'No pudimos guardar el cambio. Intentá de nuevo.' },500); }
}
