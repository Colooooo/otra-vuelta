'use client';

import { useEffect, useRef } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import type { Product } from '../store';

export default function DeleteProductDialog({ product, busy, error, onCancel, onConfirm }: {
  product: Product; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); };
  }, []);
  return <dialog ref={dialog} className="delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-description"
    onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <div className="delete-dialog-content">
      <div className="sheet-grip" aria-hidden="true" />
      <span className="delete-dialog-icon"><Trash2 size={24} /></span>
      <h2 id="delete-title">¿Eliminar este artículo?</h2>
      <p id="delete-description">Se quitará de tu tienda de forma permanente. Esta acción no se puede deshacer.</p>
      <div className="delete-product-preview"><img src={product.images[0]} alt="" /><div><strong>{product.title}</strong><span>{product.category}{product.size && ` · ${product.size}`}</span></div></div>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="delete-dialog-actions">
        <button autoFocus className="delete-cancel" disabled={busy} onClick={onCancel}>Conservar artículo</button>
        <button className="delete-confirm" disabled={busy} onClick={onConfirm}>
          {busy ? <LoaderCircle size={17} className="spin" /> : <Trash2 size={17} />}{busy ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
      </div>
    </div>
  </dialog>;
}
