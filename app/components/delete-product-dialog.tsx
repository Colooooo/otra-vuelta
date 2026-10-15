'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import type { Product } from '../store';

export function DeleteConfirmationDialog({ title, description, children, cancelLabel, busy, error, onCancel, onConfirm }: {
  title: string; description: string; children: ReactNode; cancelLabel: string;
  busy: boolean; error: string; onCancel: () => void; onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); };
  }, []);
  return <dialog ref={dialog} className="delete-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
    onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }}
    onClick={event => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <div className="delete-dialog-content">
      <div className="sheet-grip" aria-hidden="true" />
      <span className="delete-dialog-icon"><Trash2 size={24} /></span>
      <h2 id={`${id}-title`}>{title}</h2>
      <p id={`${id}-description`}>{description}</p>
      {children}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="delete-dialog-actions">
        <button autoFocus className="delete-cancel" disabled={busy} onClick={onCancel}>{cancelLabel}</button>
        <button className="delete-confirm" disabled={busy} onClick={onConfirm}>
          {busy ? <LoaderCircle size={17} className="spin" /> : <Trash2 size={17} />}{busy ? 'Eliminando…' : 'Sí, eliminar'}
        </button>
      </div>
    </div>
  </dialog>;
}

export default function DeleteProductDialog({ product, ...props }: {
  product: Product; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void;
}) {
  return <DeleteConfirmationDialog {...props} title="¿Eliminar este artículo?" cancelLabel="Conservar artículo"
    description="Se quitará de tu tienda de forma permanente. Esta acción no se puede deshacer.">
    <div className="delete-product-preview"><img src={product.images[0]} alt="" /><div><strong>{product.title}</strong><span>{product.category}{product.size && ` · ${product.size}`}</span></div></div>
  </DeleteConfirmationDialog>;
}
