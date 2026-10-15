'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Search, ShoppingBag, X } from 'lucide-react';
import OrderCard, { type StoreOrder } from './order-card';
import { SaleOrderCard, SoldItemCard } from './sales-card';
import type { Product } from '../store';

function SaleDetails({ order, products, busy, onClose, onStatus, onDelete }: {
  order: StoreOrder; products: Product[]; busy: boolean; onClose: () => void;
  onStatus: (status: string) => void; onDelete: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), title = useId();
  useEffect(() => { const element = dialog.current; element?.showModal(); return () => { element?.close(); }; }, []);
  return <dialog ref={dialog} className="sale-details-dialog" aria-labelledby={title}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <div className="sale-details-content"><header><h2 id={title}>Detalle del pedido</h2><button disabled={busy} aria-label="Cerrar detalle del pedido" onClick={onClose}><X size={21} /></button></header>
      <OrderCard order={order} products={products} busy={busy} onStatus={onStatus} onDelete={onDelete} />
    </div>
  </dialog>;
}

export default function SalesPanel({ orders, products, detachedProducts, busy, onStatus, onDelete }: {
  orders: StoreOrder[]; products: Product[]; detachedProducts: Product[]; busy: boolean;
  onStatus: (order: StoreOrder, status: string) => void; onDelete: (order: StoreOrder) => void;
}) {
  const [filter, setFilter] = useState('all'), [query, setQuery] = useState(''), [detailId, setDetailId] = useState<string | null>(null);
  const reduce = useReducedMotion();
  const search = query.trim().toLocaleLowerCase('es');
  const shown = orders.filter(order => (filter === 'all' || order.status === filter) &&
    `${order.id} ${order.name} ${order.items.map(item => item.title).join(' ')}`.toLocaleLowerCase('es').includes(search));
  const detached = filter === 'confirmed' ? [] : detachedProducts.filter(product => `${product.title} ${product.category} ${product.size}`.toLocaleLowerCase('es').includes(search));
  const detail = orders.find(order => order.id === detailId);
  const count = orders.reduce((total, order) => total + order.items.length, 0) + detachedProducts.length;
  return <section className="sales-panel sales-redesign" aria-labelledby="sales-title">
    <div className="sales-intro"><div><h2 id="sales-title">Vendidos</h2><p>Piezas que ya encontraron una nueva historia.</p></div><span>{count} {count === 1 ? 'pieza' : 'piezas'}</span></div>
    <label className="search sales-search"><Search size={18} /><input aria-label="Buscar en vendidos" placeholder="Buscar prenda, cliente o pedido…" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div className="sales-filters">{[['all', 'Todos'], ['confirmed', 'Por entregar'], ['completed', 'Entregados']].map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
    <div className="sales-card-grid"><AnimatePresence initial={false}>
      {shown.map(order => <motion.div key={order.id} layout={!reduce} initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: reduce ? 1 : .98 }} transition={{ duration: reduce ? 0 : .18 }}>
        <SaleOrderCard order={order} products={products} busy={busy} onDetails={() => setDetailId(order.id)} onComplete={() => onStatus(order, 'completed')} onDelete={() => onDelete(order)} />
      </motion.div>)}
      {detached.map(product => <motion.div key={product.id} layout={!reduce} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .18 }}><SoldItemCard product={product} /></motion.div>)}
    </AnimatePresence></div>
    {!shown.length && !detached.length && <div className="sales-blank"><span><ShoppingBag size={29} /></span><h3>{search ? 'No encontramos esa venta' : filter === 'all' ? 'Las próximas historias empiezan acá' : 'Todo al día por acá'}</h3><p>{search ? 'Probá con otro nombre de prenda o cliente.' : filter === 'confirmed' ? 'No tenés piezas pendientes de entrega.' : 'Cuando confirmes un pedido, el artículo aparecerá en esta sección.'}</p></div>}
    {detail && <SaleDetails order={detail} products={products} busy={busy} onClose={() => setDetailId(null)} onStatus={status => onStatus(detail, status)} onDelete={() => onDelete(detail)} />}
  </section>;
}
