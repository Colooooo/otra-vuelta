'use client';

import { Eye, EyeOff, LockKeyhole, Pencil, Trash2 } from 'lucide-react';
import type { Product } from '../store';

type Props = {
  product: Product;
  busy: boolean;
  onEdit: () => void;
  onVisibility: () => void;
  onDelete: () => void;
};
const labels: Record<string, string> = { available: 'Disponible', hidden: 'Oculto', reserved: 'Reservado', sold: 'Vendido' };
const money = (price: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(price / 100);

export default function AdminProductCard({ product, busy, onEdit, onVisibility, onDelete }: Props) {
  const editable = ['available', 'hidden'].includes(product.status);
  const hidden = product.status === 'hidden';
  return <article className="admin-product-card">
    <div className="admin-product-photo"><img src={product.images[0]} alt={product.title} loading="lazy" /></div>
    <div className="admin-product-info">
      <span className={`status ${product.status}`}>{labels[product.status]}</span>
      <h3>{product.title}</h3>
      <p>{product.category}{product.size && ` · ${product.size}`}</p>
      <strong>{money(product.price)}</strong>
    </div>
    {editable ? <div className="admin-card-actions">
      <button className="admin-edit" disabled={busy} onClick={onEdit}><Pencil size={16} />Editar</button>
      <button className="admin-visibility" disabled={busy} onClick={onVisibility}>
        {hidden ? <Eye size={17} /> : <EyeOff size={17} />}{hidden ? 'Publicar' : 'Ocultar'}
      </button>
      <button className="admin-delete" disabled={busy} onClick={onDelete}
        aria-label={`Eliminar ${product.title}`} title="Eliminar artículo"><Trash2 size={18} /></button>
    </div> : <p className="admin-card-note"><LockKeyhole size={14} />Gestioná esta pieza desde su pedido.</p>}
  </article>;
}
