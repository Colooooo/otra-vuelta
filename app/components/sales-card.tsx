'use client';

import { Check, CheckCheck, Package, Trash2, UserRound } from 'lucide-react';
import type { Product } from '../store';
import type { StoreOrder } from './order-card';

const money = (price: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(price / 100);

function SalePiece({ title, price, product }: { title: string; price: number; product?: Product }) {
  return <div className="sale-piece">
    {product?.images[0] ? <img src={product.images[0]} alt={title} loading="lazy" /> : <span className="sale-photo-placeholder"><Package size={24} /></span>}
    <div><h3>{title}</h3>{product && <p>{product.category}{product.size && ` · ${product.size}`}</p>}<strong>{money(price)}</strong></div>
  </div>;
}

export function SaleOrderCard({ order, products, busy, onDetails, onComplete, onDelete }: {
  order: StoreOrder; products: Product[]; busy: boolean; onDetails: () => void; onComplete: () => void; onDelete: () => void;
}) {
  const completed = order.status === 'completed';
  return <article className={`sale-card ${completed ? 'sale-completed' : 'sale-confirmed'}`}>
    <div className="sale-card-top"><span className={`sale-state ${completed ? 'is-completed' : ''}`}>{completed ? <CheckCheck size={14} /> : <Package size={14} />}{completed ? 'Entregado' : 'Por entregar'}</span><time dateTime={order.created}>{new Date(order.created).toLocaleDateString('es-UY')}</time></div>
    <div className="sale-card-pieces">{order.items.map(item => <SalePiece key={item.id} title={item.title} price={item.price} product={products.find(product => product.id === item.product_id)} />)}</div>
    <div className="sale-card-customer"><span><UserRound size={14} /><span>{order.name}</span></span><small>#{order.id.slice(0, 8).toUpperCase()}</small></div>
    {order.items.length > 1 && <div className="sale-card-total"><span>{order.items.length} piezas</span><strong>{money(order.total)}</strong></div>}
    <div className="sale-card-actions"><button className="sale-detail-button" onClick={onDetails}>Ver pedido</button>{completed ? <button className="sale-delete-button" disabled={busy} onClick={onDelete} aria-label="Eliminar pedido" title="Eliminar pedido"><Trash2 size={17} /></button> : <button className="sale-complete-button" disabled={busy} onClick={onComplete}><Check size={16} />Marcar entregado</button>}</div>
  </article>;
}

export function SoldItemCard({ product }: { product: Product }) {
  return <article className="sale-card sale-completed sale-retained">
    <div className="sale-card-top"><span className="sale-state is-completed"><CheckCheck size={14} />Vendido</span></div>
    <div className="sale-card-pieces"><SalePiece title={product.title} price={product.price} product={product} /></div>
    <div className="sale-retained-note"><Check size={14} />Venta completada</div>
  </article>;
}
