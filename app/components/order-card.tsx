'use client';

import { Check, CheckCheck, MapPin, MessageSquare, Phone, ReceiptText, Trash2, Truck } from 'lucide-react';
import type { Product } from '../store';

export type StoreOrder = {
  id: string; name: string; phone: string; status: string; total: number;
  created: string; delivery: string; notes: string;
  items: { id: string; product_id: string; title: string; price: number }[];
};
const labels: Record<string, string> = { pending: 'Pendiente', confirmed: 'Confirmado', completed: 'Entregado', cancelled: 'Cancelado' };
const money = (price: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(price / 100);

export default function OrderCard({ order, busy, onStatus, onDelete, products }: {
  order: StoreOrder; busy: boolean; onStatus: (status: string) => void; onDelete: () => void; products?: Product[];
}) {
  const completed = order.status === 'completed';
  return <article className={`order order-card ${completed ? 'order-delivered' : ''}`}>
    <div className="order-card-heading"><span><ReceiptText size={15} />#{order.id.slice(0, 8).toUpperCase()}</span><span className={`status ${order.status}`}>{labels[order.status]}</span></div>
    <div className="order-customer"><h3>{order.name}</h3><a href={`tel:${order.phone.replace(/[^+\d]/g, '')}`}><Phone size={14} />{order.phone}</a><time dateTime={order.created}>{new Date(order.created).toLocaleDateString('es-UY')}</time></div>
    <ul className={`order-pieces ${products ? 'sold-order-pieces' : ''}`}>{order.items.map(item => {
      const product = products?.find(product => product.id === item.product_id);
      return <li key={item.id}>
        {product?.images[0] && <img src={product.images[0]} alt={item.title} loading="lazy" />}
        <span className="order-piece-description">{item.title}{product && <small>{product.category}{product.size && ` · ${product.size}`}</small>}</span><b>{money(item.price)}</b>
      </li>;
    })}</ul>
    <div className="order-card-total"><span>Total del pedido<small>{order.items.length} {order.items.length === 1 ? 'pieza' : 'piezas'}</small></span><strong>{money(order.total)}</strong></div>
    <p className="order-delivery">{order.delivery === 'Retiro a coordinar' ? <MapPin size={16} /> : <Truck size={16} />}{order.delivery}</p>
    {order.notes && <p className="order-message"><MessageSquare size={15} /><span>{order.notes}</span></p>}
    <div className={`order-card-footer ${completed ? 'completed-footer' : ''}`}>
      {completed ? <><span className="order-finished"><CheckCheck size={16} />Pedido finalizado</span><button className="order-delete-button" disabled={busy} onClick={onDelete}><Trash2 size={16} />Eliminar pedido</button></> : <>
        {order.status === 'pending' && <button className="primary order-next" disabled={busy} onClick={() => onStatus('confirmed')}><Check size={17} />Confirmar pedido</button>}
        {order.status === 'confirmed' && <button className="primary order-next" disabled={busy} onClick={() => onStatus('completed')}><CheckCheck size={17} />Marcar entregado</button>}
        {['pending', 'confirmed'].includes(order.status) && <button className="order-cancel-button" disabled={busy} onClick={() => { if (window.confirm('¿Cancelar este pedido y volver a ofrecer sus piezas?')) onStatus('cancelled'); }}>Cancelar</button>}
        {order.status === 'cancelled' && <span className="order-finished">Pedido cancelado · piezas liberadas</span>}
      </>}
    </div>
  </article>;
}
