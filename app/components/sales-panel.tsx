'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CheckCheck, Search, ShoppingBag } from 'lucide-react';
import OrderCard, { type StoreOrder } from './order-card';
import type { Product } from '../store';

const money = (price: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(price / 100);

export default function SalesPanel({ orders, products, detachedProducts, busy, onStatus, onDelete }: {
  orders: StoreOrder[]; products: Product[]; detachedProducts: Product[]; busy: boolean;
  onStatus: (order: StoreOrder, status: string) => void; onDelete: (order: StoreOrder) => void;
}) {
  const [filter, setFilter] = useState('all'), [query, setQuery] = useState('');
  const reduce = useReducedMotion();
  const search = query.trim().toLocaleLowerCase('es');
  const shown = orders.filter(order => (filter === 'all' || order.status === filter) &&
    `${order.id} ${order.name} ${order.items.map(item => item.title).join(' ')}`.toLocaleLowerCase('es').includes(search));
  const detached = filter === 'confirmed' ? [] : detachedProducts.filter(product => `${product.title} ${product.category} ${product.size}`.toLocaleLowerCase('es').includes(search));
  return <section className="sales-panel" aria-labelledby="sales-title">
    <div className="sales-heading"><div><p className="eyebrow">CADA PIEZA, UNA NUEVA HISTORIA</p><h2 id="sales-title">Tus piezas vendidas.</h2><p>Pedidos confirmados y entregados, con los artículos de cada venta.</p></div><span className="sales-heading-icon"><CheckCheck size={26} /></span></div>
    <div className="sales-summary"><div><small>Por entregar</small><strong>{orders.filter(order => order.status === 'confirmed').length}</strong></div><div><small>Entregados</small><strong>{orders.filter(order => order.status === 'completed').length}</strong></div><div><small>Piezas vendidas</small><strong>{orders.reduce((total, order) => total + order.items.length, 0) + detachedProducts.length}</strong></div></div>
    <div className="sales-toolbar"><div className="chips">{[['all', 'Todos'], ['confirmed', 'Por entregar'], ['completed', 'Entregados']].map(([value, label]) => <button key={value} className={filter === value ? 'active' : ''} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><label className="search"><Search size={18} /><input aria-label="Buscar en vendidos" placeholder="Buscar cliente o artículo…" value={query} onChange={event => setQuery(event.target.value)} /></label></div>
    <div className="orders"><AnimatePresence initial={false}>{shown.map(order => <motion.div key={order.id} layout={!reduce} initial={{ opacity: 0, y: reduce ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: reduce ? 1 : .98 }} transition={{ duration: reduce ? 0 : .2 }}>
      <OrderCard order={order} products={products} busy={busy} onStatus={status => onStatus(order, status)} onDelete={() => onDelete(order)} />
    </motion.div>)}</AnimatePresence></div>
    {detached.length > 0 && <div className="sold-retained"><h3>Artículos vendidos</h3><p>Estas piezas conservan su estado vendido aunque hayas eliminado su pedido.</p><div className="sold-product-grid">{detached.map(product => <article key={product.id} className="sold-product-card"><img src={product.images[0]} alt={product.title} loading="lazy" /><div><span className="status sold">Vendido</span><h4>{product.title}</h4><p>{product.category}{product.size && ` · ${product.size}`}</p><strong>{money(product.price)}</strong></div></article>)}</div></div>}
    {!shown.length && !detached.length && <div className="empty sales-empty"><ShoppingBag size={36} /><h3>{search ? 'No encontramos esa venta' : filter === 'all' ? 'Las nuevas historias aparecerán acá' : 'No hay ventas con este estado'}</h3><p>{search ? 'Probá con otro cliente o nombre de artículo.' : 'Al confirmar un pedido, sus piezas y datos pasan a esta sección.'}</p></div>}
  </section>;
}
