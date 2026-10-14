'use client';
import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowRight, ShoppingBag, X, Plus, Camera, Search, Leaf, RefreshCw, Check, Package, Lock, SlidersHorizontal, LogOut, Trash2 } from 'lucide-react';
type Product = {
    id: string;
    title: string;
    description: string;
    category: string;
    size: string;
    condition: string;
    price: number;
    images: string[];
    status: string;
};
const cats = ['Todo', 'Ropa', 'Calzado', 'Accesorios', 'Hogar', 'Otros'];
const money = (c: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(c / 100);
const statuses: Record<string, string> = { available: 'Disponible', reserved: 'Reservado', hidden: 'Oculto', sold: 'Vendido', pending: 'Pendiente', confirmed: 'Confirmado', completed: 'Entregado', cancelled: 'Cancelado' };
const blank = { title: '', description: '', category: 'Ropa', size: '', condition: 'Muy buen estado', price: '', images: [] as string[], id: '' };
export default function Store() {
    const [products, setProducts] = useState<Product[]>([]), [orders, setOrders] = useState<any[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
    const [admin, setAdmin] = useState(false), [key, setKey] = useState(''), [login, setLogin] = useState(false), [password, setPassword] = useState(''), [tab, setTab] = useState('products');
    const [category, setCategory] = useState('Todo'), [query, setQuery] = useState(''), [sort, setSort] = useState('new'), [cart, setCart] = useState<string[]>([]), [drawer, setDrawer] = useState(false);
    const [detail, setDetail] = useState<Product | null>(null), [photo, setPhoto] = useState(0), [editor, setEditor] = useState(false), [draft, setDraft] = useState(blank), [busy, setBusy] = useState(false), [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(''), [orderFilter, setOrderFilter] = useState('all'), [toast, setToast] = useState('');
    async function load(k = '') { setLoading(true); setError(''); try {
        const r = await fetch('/api/store' + (k ? '?admin=1' : ''), { headers: k ? { Authorization: `Bearer ${k}` } : {} });
        const d: any = await r.json();
        if (!r.ok)
            throw Error(d.error);
        setProducts(d.products);
        setOrders(d.orders || []);
        return true;
    }
    catch (e: any) {
        setError(e.message || 'No pudimos cargar el catálogo.');
        return false;
    }
    finally {
        setLoading(false);
    } }
    useEffect(() => { const k = sessionStorage.getItem('ov-admin') || ''; if (k) {
        setKey(k);
        load(k).then(ok => { if (ok)
            setAdmin(true);
        else {
            sessionStorage.removeItem('ov-admin');
            setKey('');
            load();
        } });
    }
    else
        load(); try {
        const c = JSON.parse(localStorage.getItem('ov-cart') || '[]');
        if (Array.isArray(c))
            setCart(c.filter(x => typeof x === 'string'));
    }
    catch { } }, []);
    useEffect(() => { localStorage.setItem('ov-cart', JSON.stringify(cart)); }, [cart]);
    useEffect(() => { if (!toast)
        return; const t = setTimeout(() => setToast(''), 4000); return () => clearTimeout(t); }, [toast]);
    useEffect(() => { document.body.style.overflow = drawer || detail || editor || login ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [drawer, detail, editor, login]);
    useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy && !uploading) {
        setDrawer(false);
        setDetail(null);
        setEditor(false);
        setLogin(false);
    } }; window.addEventListener('keydown', esc); return () => window.removeEventListener('keydown', esc); }, [busy, uploading]);
    async function action(data: any) { const r = await fetch('/api/store', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify(data) }); const d: any = await r.json(); if (!r.ok)
        throw Error(d.error); return d; }
    async function change(data: any) { setBusy(true); setError(''); try {
        await action(data);
        await load(key);
        setToast('Cambio guardado');
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function signIn(e: React.FormEvent) { e.preventDefault(); setBusy(true); const ok = await load(password); if (ok) {
        sessionStorage.setItem('ov-admin', password);
        setKey(password);
        setAdmin(true);
        setLogin(false);
        setPassword('');
    } setBusy(false); }
    function signOut() { sessionStorage.removeItem('ov-admin'); setKey(''); setAdmin(false); load(); }
    function add(p: Product) { if (!cart.includes(p.id)) {
        if (cart.length >= 10) {
            setToast('Podés reservar hasta 10 piezas por pedido.');
            return;
        }
        setCart([...cart, p.id]);
        setToast('Pieza agregada a tu selección');
    } setDetail(null); }
    async function upload(files: FileList | null) { if (!files?.length)
        return; if (draft.images.length + files.length > 5) {
        setError('Podés agregar hasta 5 fotos.');
        return;
    } setUploading(true); setError(''); const urls: string[] = []; try {
        for (const file of Array.from(files)) {
            let photo = file;
            try {
                const bitmap = await createImageBitmap(file);
                const canvas = document.createElement('canvas'), scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
                canvas.width = Math.round(bitmap.width * scale);
                canvas.height = Math.round(bitmap.height * scale);
                canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
                bitmap.close();
                const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', .86));
                if (blob)
                    photo = new File([blob], 'foto.jpg', { type: 'image/jpeg' });
            }
            catch { }
            if (photo.size > 4_000_000) throw Error('La foto debe pesar menos de 4 MB.');
            const form = new FormData();
            form.append('photo', photo);
            const r = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form });
            const d: any = await r.json();
            if (!r.ok)
                throw Error(d.error);
            urls.push(d.url);
        }
    }
    catch (e: any) {
        setError(e.message || 'No pudimos subir la foto.');
    }
    finally {
        setDraft(d => ({ ...d, images: [...d.images, ...urls] }));
        setUploading(false);
    } }
    async function save(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(''); try {
        await action({ ...draft, action: 'product', price: Math.round(Number(draft.price) * 100) });
        setEditor(false);
        await load(key);
        setToast(draft.id ? 'Artículo actualizado' : 'Artículo publicado en el catálogo');
    }
    catch (e: any) {
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    async function submitOrder(e: React.FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); setError(''); try {
        const d = await action({ action: 'order', ids: cart, ...Object.fromEntries(f) });
        setSuccess(d.id);
        setCart([]);
        await load();
    }
    catch (e: any) {
        setError(e.message);
        await load();
        setError(e.message);
    }
    finally {
        setBusy(false);
    } }
    const selected = cart.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[], invalid = selected.length !== cart.length || selected.some(p => p.status !== 'available');
    let shown = products.filter(p => (category === 'Todo' || p.category === category) && (`${p.title} ${p.description} ${p.size}`.toLowerCase().includes(query.toLowerCase())));
    if (sort === 'low')
        shown = [...shown].sort((a, b) => a.price - b.price);
    if (sort === 'high')
        shown = [...shown].sort((a, b) => b.price - a.price);
    const modalError = error ? <p className="error" role="alert">{error}</p> : null;
    return <>
  <div className="announcement bg-forest text-cream text-center">UNA SEGUNDA VIDA. UN NUEVO FAVORITO. <span>♻</span></div>
  <header className="header wrap"><a className="brand" href="/" aria-label="Otra Vuelta inicio"><RefreshCw size={28} strokeWidth={1.5}/><span>otra vuelta<span className="brand-dot">.</span><small>SEGUNDA MANO, NUEVAS HISTORIAS</small></span></a><nav>{admin ? <><button onClick={() => { setAdmin(false); load(); }}>Ver catálogo <ArrowUpRight size={15}/></button><button onClick={signOut} aria-label="Cerrar sesión"><LogOut size={18}/></button></> : <><a className="nav-catalog" href="#catalogo">Explorar catálogo</a><button className="bag" aria-label={`Mi selección: ${cart.length} piezas`} onClick={() => { setSuccess(''); setDrawer(true); setError(''); }}><ShoppingBag size={19}/><span>Mi selección</span><b>{cart.length}</b></button></>}</nav></header>
  {admin ? <main className="wrap admin-main"><div className="admin-heading"><div><p className="eyebrow">TU TIENDA, EN TUS MANOS</p><h1>Hola, nuevas historias.</h1><p>Publicá tus piezas y acompañá cada pedido.</p></div><button className="primary" onClick={() => { setDraft(blank); setEditor(true); setError(''); }}><Plus size={18}/> Nuevo artículo</button></div><div className="stats"><div><small>Disponibles</small><strong>{products.filter(p => p.status === 'available').length}</strong></div><div><small>Pedidos pendientes</small><strong>{orders.filter(o => o.status === 'pending').length}</strong></div><div><small>Piezas reservadas</small><strong>{products.filter(p => p.status === 'reserved').length}</strong></div><div><small>Pedidos entregados</small><strong>{orders.filter(o => o.status === 'completed').length}</strong></div></div><div className="admin-tabs"><button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Artículos <span>{products.length}</span></button><button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Pedidos <span>{orders.length}</span></button><button className="refresh" onClick={() => load(key)} aria-label="Actualizar"><RefreshCw size={18}/></button></div>{modalError}
  {tab === 'products' ? <><div className="toolbar"><label className="search"><Search size={18}/><input aria-label="Buscar artículos" placeholder="Buscar un artículo…" value={query} onChange={e => setQuery(e.target.value)}/></label></div>{loading ? <p className="empty">Cargando tus artículos…</p> : shown.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8">{shown.map(p => <article className="product" key={p.id}><div className="product-image"><img src={p.images[0]} alt={p.title}/><span className={'status ' + p.status}>{statuses[p.status]}</span></div><div className="product-meta"><small>{p.category} {p.size && ` · ${p.size}`}</small><h3>{p.title}</h3><b>{money(p.price)}</b></div>{['available', 'hidden'].includes(p.status) ? <div className="product-actions"><button onClick={() => { setDraft({ ...p, price: String(p.price / 100) }); setEditor(true); setError(''); }}>Editar</button><button disabled={busy} onClick={() => change({ action: 'visibility', id: p.id, status: p.status === 'hidden' ? 'available' : 'hidden' })}>{p.status === 'hidden' ? 'Publicar' : 'Ocultar'}</button></div> : <p className="muted">Gestioná esta pieza desde su pedido.</p>}</article>)}</div> : <div className="empty"><Camera size={38}/><h3>{query ? 'No encontramos ese artículo' : 'Tu primera pieza empieza con una foto'}</h3><p>Agregá fotos, un precio y los detalles. Aparecerá en tu catálogo al publicarla.</p><button className="primary" onClick={() => { setDraft(blank); setEditor(true); }}>Crear un artículo <Plus size={17}/></button></div>}</> : <><div className="chips">{['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => <button key={s} className={orderFilter === s ? 'active' : ''} onClick={() => setOrderFilter(s)}>{s === 'all' ? 'Todos' : statuses[s]}</button>)}</div><div className="orders">{orders.filter(o => orderFilter === 'all' || o.status === orderFilter).map(o => <article className="order" key={o.id}><div className="order-top"><div><small>#{o.id.slice(0, 8).toUpperCase()} · {new Date(o.created).toLocaleDateString('es-UY')}</small><h3>{o.name}</h3><a href={'tel:' + o.phone.replace(/[^+\d]/g, '')}>{o.phone}</a></div><span className={'status ' + o.status}>{statuses[o.status]}</span></div><ul>{o.items.map((i: any) => <li key={i.id}><span>{i.title}</span><b>{money(i.price)}</b></li>)}</ul><div className="order-total"><span>Total de artículos</span><b>{money(o.total)}</b></div><p>{o.delivery}</p>{o.notes && <p className="order-note">{o.notes}</p>}<div className="product-actions">{o.status === 'pending' && <button className="primary" disabled={busy} onClick={() => change({ action: 'orderStatus', id: o.id, status: 'confirmed' })}>Confirmar pedido</button>}{o.status === 'confirmed' && <button className="primary" disabled={busy} onClick={() => change({ action: 'orderStatus', id: o.id, status: 'completed' })}>Marcar entregado</button>}{['pending', 'confirmed'].includes(o.status) && <button disabled={busy} onClick={() => { if (window.confirm('¿Cancelar este pedido y volver a ofrecer sus piezas?'))
            change({ action: 'orderStatus', id: o.id, status: 'cancelled' }); }}>Cancelar</button>}</div></article>)}{!orders.filter(o => orderFilter === 'all' || o.status === orderFilter).length && <div className="empty"><Package size={38}/><h3>No hay pedidos en esta sección</h3><p>Los pedidos de tus clientes aparecerán acá.</p></div>}</div></>}
  </main> : <main>
   <section className="hero wrap grid items-center gap-6 md:grid-cols-2 md:gap-8"><div className="hero-copy"><p className="eyebrow"><span /> OBJETOS CON PASADO. ESTILO CON FUTURO.</p><h1>Lo bueno merece<br />otra <em>vuelta.</em></h1><p className="hero-description">Piezas únicas, elegidas con cariño.<br />Encontrá eso que buscabas y dale una nueva historia.</p><a className="primary" href="#catalogo">Encontrá tu próxima pieza <ArrowUpRight size={20}/></a><div className="hero-foot"><span className="little-icon"><Leaf size={18}/></span><span>Comprar de segunda mano<br /><strong>también es elegir diferente.</strong></span></div></div><div className="hero-art" aria-label="Ilustración de prendas y accesorios de segunda mano"><div className="art-orbit"/><div className="art-label">SELECCIÓN CON HISTORIA <ArrowUpRight size={16}/></div><svg viewBox="0 0 600 540" role="img" aria-label="Sweater verde, bolso y lámpara vintage"><defs><pattern id="knit" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M0 0l6 6 6-6M0 6l6 6 6-6" fill="none" stroke="#365545" opacity=".19"/></pattern><filter id="shadow"><feDropShadow dx="3" dy="10" stdDeviation="9" floodOpacity=".12"/></filter></defs><g transform="translate(94 45) rotate(-12 140 140)" filter="url(#shadow)"><path d="M112 58l-60 25-44 110 54 22 32-67-4 145h174l-4-145 32 67 54-22-44-110-60-25z" fill="#54745d"/><path d="M112 58l-60 25-44 110 54 22 32-67-4 145h174l-4-145 32 67 54-22-44-110-60-25z" fill="url(#knit)"/><path d="M112 58q62 72 130 0" fill="none" stroke="#3c5946" strokeWidth="15"/><path d="M96 271h164" stroke="#3c5946" strokeWidth="20"/><path d="M170 51v-15q0-21 20-21" fill="none" stroke="#ae7f53" strokeWidth="5"/><path d="M170 34L93 59h153z" fill="none" stroke="#ae7f53" strokeWidth="6"/></g><g transform="translate(270 281) rotate(12 115 100)" filter="url(#shadow)"><path d="M53 75V40a60 60 0 01120 0v35" fill="none" stroke="#693e28" strokeWidth="14"/><path d="M23 69h180l15 142q-95 40-209 0z" fill="#aa7048"/><path d="M23 69q92 35 180 0" fill="none" stroke="#c99363" strokeWidth="5"/><rect x="102" y="92" width="23" height="38" rx="5" fill="#d9b974"/><path d="M25 89l-6 106m177-106 10 107" stroke="#73482e" fill="none" strokeWidth="3"/></g><g transform="translate(397 67) rotate(8)" filter="url(#shadow)"><path d="M35 62h71l24 109H8z" fill="#e0b774"/><path d="M11 158h115" stroke="#b18b54" strokeWidth="4"/><path d="M68 173v102" stroke="#715e44" strokeWidth="8"/><ellipse cx="68" cy="276" rx="49" ry="10" fill="#715e44"/></g></svg><div className="circle-stamp">UNA PIEZA.<br /><strong>MIL HISTORIAS.</strong><RefreshCw size={22}/></div><div className="art-note">Hallazgos que vale la pena volver a querer.</div></div></section>
   <div className="values"><div className="wrap"><span><RefreshCw size={19}/> Segunda mano, primera elección</span><span><ShoppingBag size={19}/> Piezas únicas</span><span><Leaf size={19}/> Más vida, menos desperdicio</span></div></div>
   <section id="catalogo" className="catalog wrap"><div className="section-heading"><div><p className="eyebrow">EL PRÓXIMO CAPÍTULO LO ESCRIBÍS VOS</p><h2>El catálogo<span>.</span></h2></div><p>Una sola de cada una.<br />Elegí tus favoritas y hacé tu pedido.</p></div><div className="toolbar"><div className="chips">{cats.map(c => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div><label className="search"><Search size={18}/><input aria-label="Buscar en el catálogo" placeholder="Buscá tu próximo hallazgo" value={query} onChange={e => setQuery(e.target.value)}/></label></div><div className="catalog-count"><span>{shown.length} {shown.length === 1 ? 'pieza' : 'piezas'}</span><label><SlidersHorizontal size={15}/><select aria-label="Ordenar artículos" value={sort} onChange={e => setSort(e.target.value)}><option value="new">Más recientes</option><option value="low">Menor precio</option><option value="high">Mayor precio</option></select></label></div>{modalError}{error && <button onClick={() => load()}>Volver a intentar</button>}{loading ? <div className="empty">Estamos buscando tus próximos favoritos…</div> : shown.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8">{shown.map(p => <article className="product" key={p.id}><button className="product-image" onClick={() => { setDetail(p); setPhoto(0); setError(''); }}><img src={p.images[0]} alt={p.title} loading="lazy"/><span className={'status ' + p.status}>{p.status === 'available' ? 'Pieza única' : 'Reservado'}</span><span className="image-arrow"><ArrowUpRight size={22}/></span></button><div className="product-meta"><small>{p.category}{p.size && ` · ${p.size}`}</small><div><h3><button onClick={() => { setDetail(p); setPhoto(0); }}>{p.title}</button></h3><b>{money(p.price)}</b></div><p>{p.condition}</p></div></article>)}</div> : <div className="empty catalog-empty"><div className="empty-icon"><ShoppingBag size={30}/><Leaf size={18}/></div><h3>{query || category !== 'Todo' ? 'No encontramos piezas con esos filtros' : 'Cada historia tiene un comienzo'}</h3><p>{query || category !== 'Todo' ? 'Probá otra categoría o una búsqueda diferente.' : 'Estamos preparando nuestros primeros hallazgos. Pronto vas a poder descubrirlos acá.'}</p>{(query || category !== 'Todo') && <button onClick={() => { setQuery(''); setCategory('Todo'); }}>Ver todo el catálogo <ArrowRight size={15}/></button>}</div>}</section>
   <section className="how wrap"><div><p className="eyebrow">ASÍ DE SIMPLE</p><h2>De un hallazgo<br />a tu casa.</h2></div><article><b>01</b><h3>Encontrá tu pieza</h3><p>Explorá las fotos, el estado y los detalles de cada artículo.</p></article><article><b>02</b><h3>Hacé tu pedido</h3><p>Sumá tus favoritas a la selección y dejá tus datos de contacto.</p></article><article><b>03</b><h3>Coordinamos con vos</h3><p>La tienda te contactará para confirmar la entrega y la forma de pago.</p></article></section>
  </main>}
  <footer className="wrap"><div className="brand">otra vuelta<span className="brand-dot">.</span></div><p>Menos nuevo. Más tuyo.</p><button onClick={() => { if (key) {
        setAdmin(true);
        load(key);
    }
    else {
        setLogin(true);
        setError('');
    } }}><Lock size={14}/> Administrar tienda</button></footer>
  {toast && <div className="toast" role="status"><Check size={17}/>{toast}</div>}
  {login && <div className="overlay" onClick={() => { if (!busy)
        setLogin(false); }}><section className="modal login" role="dialog" aria-modal="true" aria-labelledby="login-title" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setLogin(false)} aria-label="Cerrar"><X /></button><Lock size={28}/><p className="eyebrow">SOLO PARA LA TIENDA</p><h2 id="login-title">Tu espacio de gestión.</h2><p>Ingresá con tu clave de administración.</p><form onSubmit={signIn}><label>Clave<input type="password" autoFocus autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/></label>{modalError}<button className="primary" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar al panel'} <ArrowRight size={17}/></button></form></section></div>}
  {detail && <div className="overlay" onClick={() => setDetail(null)}><section className="modal detail" role="dialog" aria-modal="true" aria-labelledby="detail-title" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setDetail(null)} aria-label="Cerrar"><X /></button><div><img className="detail-photo" src={detail.images[photo]} alt={detail.title}/><div className="thumbs">{detail.images.map((im, i) => <button key={im} aria-label={'Ver foto ' + (i + 1)} className={i === photo ? 'active' : ''} onClick={() => setPhoto(i)}><img src={im} alt=""/></button>)}</div></div><div className="detail-copy"><p className="eyebrow">{detail.category} · PIEZA ÚNICA</p><h2 id="detail-title">{detail.title}</h2><strong className="detail-price">{money(detail.price)}</strong><dl><div><dt>Estado</dt><dd>{detail.condition}</dd></div>{detail.size && <div><dt>Talle / medidas</dt><dd>{detail.size}</dd></div>}</dl><p className="preserve">{detail.description}</p><button className="primary" disabled={detail.status !== 'available'} onClick={() => add(detail)}><ShoppingBag size={18}/>{detail.status !== 'available' ? 'Esta pieza está reservada' : cart.includes(detail.id) ? 'Ya está en tu selección' : 'Agregar a mi selección'}</button><small>Reservás al enviar tu pedido. Luego coordinamos entrega y pago.</small></div></section></div>}
  {drawer && <div className="overlay drawer-overlay" onClick={() => { if (!busy)
        setDrawer(false); }}><section className="drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setDrawer(false)} aria-label="Cerrar"><X /></button>{success ? <div className="order-success"><span><Check size={35}/></span><p className="eyebrow">UN NUEVO CAPÍTULO</p><h2 id="cart-title">¡Recibimos tu pedido!</h2><p>Tus piezas quedaron reservadas. La tienda te contactará al teléfono que dejaste para confirmar el pago y la entrega.</p><b>Pedido #{success.slice(0, 8).toUpperCase()}</b><p>No se realizó ningún cobro online.</p><button className="primary" onClick={() => setDrawer(false)}>Seguir explorando <ArrowRight size={17}/></button></div> : <><p className="eyebrow">TUS PRÓXIMOS FAVORITOS</p><h2 id="cart-title">Mi selección<span>.</span></h2>{cart.length ? <><div className="cart-items">{cart.map(id => { const p = products.find(p => p.id === id); return <article key={id}>{p && <img src={p.images[0]} alt={p.title}/>}<div><h3>{p?.title || 'Pieza no disponible'}</h3><p>{p ? money(p.price) : 'Quitá esta pieza para continuar'}</p>{p && p.status !== 'available' && <small>Ya no está disponible</small>}</div><button aria-label={'Quitar ' + (p?.title || 'artículo')} onClick={() => setCart(cart.filter(x => x !== id))}><Trash2 size={17}/></button></article>; })}</div><div className="order-total"><span>Total de artículos</span><b>{money(selected.reduce((s, p) => s + p.price, 0))}</b></div><p className="muted">El costo de envío y la forma de pago se coordinan con la tienda.</p><form onSubmit={submitOrder}><h3>¿Cómo te contactamos?</h3><label>Nombre<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Tu nombre"/></label><label>Teléfono / WhatsApp<input name="phone" type="tel" required minLength={7} maxLength={40} autoComplete="tel" placeholder="Tu número con código de área"/></label><label>Entrega<select name="delivery"><option>Retiro a coordinar</option><option>Envío a coordinar</option></select></label><label>Mensaje para la tienda <span>(opcional)</span><textarea name="notes" maxLength={1000} placeholder="Contanos si necesitás coordinar algo en particular"/></label><input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"/>{modalError}{invalid && <p className="error">Quitá las piezas no disponibles antes de enviar tu pedido.</p>}<p className="muted">Usaremos tus datos para gestionar este pedido y contactarte.</p><button className="primary" disabled={busy || invalid}>{busy ? 'Enviando…' : 'Enviar pedido'} <ArrowRight size={18}/></button><small>Sin pago online. Tu selección se reserva al enviar el pedido.</small></form></> : <div className="empty"><ShoppingBag size={40}/><h3>Tu próximo hallazgo te espera</h3><p>Agregá una pieza del catálogo para hacer tu pedido.</p><button className="primary" onClick={() => { setDrawer(false); document.getElementById('catalogo')?.scrollIntoView(); }}>Explorar catálogo <ArrowRight size={16}/></button></div>}</>}</section></div>}
  {editor && <div className="overlay" onClick={() => { if (!busy && !uploading)
        setEditor(false); }}><section className="modal editor" role="dialog" aria-modal="true" aria-labelledby="editor-title" onClick={e => e.stopPropagation()}><button className="close" disabled={busy || uploading} onClick={() => setEditor(false)} aria-label="Cerrar"><X /></button><p className="eyebrow">DALE UNA NUEVA HISTORIA</p><h2 id="editor-title">{draft.id ? 'Editar artículo' : 'Nueva pieza'}.</h2><form onSubmit={save}><label>Fotos <span>Hasta 5 · JPG, PNG o WebP</span></label><div className="upload-actions"><label className="upload"><Camera size={24}/><span>{uploading ? 'Subiendo…' : 'Tomar foto'}</span><input type="file" accept="image/*" capture="environment" disabled={uploading} onChange={e => { upload(e.target.files); e.target.value = ''; }}/></label><label className="upload"><Plus size={24}/><span>Elegir de la galería</span><input type="file" accept="image/*" multiple disabled={uploading} onChange={e => { upload(e.target.files); e.target.value = ''; }}/></label></div><div className="thumbs upload-thumbs">{draft.images.map((im, i) => <div key={im}><img src={im} alt={'Foto ' + (i + 1)}/>{i === 0 && <small>Portada</small>}<button type="button" aria-label={'Quitar foto ' + (i + 1)} onClick={() => setDraft(d => ({ ...d, images: d.images.filter(x => x !== im) }))}><X size={14}/></button></div>)}</div><label>Nombre del artículo<input required maxLength={100} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Ej. Camisa de lino color natural"/></label><div className="form-row"><label>Categoría<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}>{cats.slice(1).map(c => <option key={c}>{c}</option>)}</select></label><label>Precio en UYU<input type="number" required min="1" max="1000000" step="0.01" value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} placeholder="0"/></label></div><div className="form-row"><label>Talle / medidas<input maxLength={60} value={draft.size} onChange={e => setDraft({ ...draft, size: e.target.value })} placeholder="Ej. M / 50 cm"/></label><label>Estado<select value={draft.condition} onChange={e => setDraft({ ...draft, condition: e.target.value })}>{['Como nuevo', 'Muy buen estado', 'Buen estado', 'Con detalles'].map(c => <option key={c}>{c}</option>)}</select></label></div><label>Descripción y detalles<textarea maxLength={2000} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="Material, medidas, marcas de uso y todo lo que ayude a elegir."/></label>{modalError}<button className="primary" disabled={busy || uploading || !draft.images.length}>{busy ? 'Guardando…' : draft.id ? 'Guardar cambios' : 'Publicar en el catálogo'} <ArrowUpRight size={18}/></button></form></section></div>}
 </>;
}
