'use client';

import { useEffect, useId, useRef, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Leaf, LoaderCircle, LockKeyhole, ShoppingBag, Trash2, X } from 'lucide-react';
import type { Product } from '../store';

const money = (price: number) => new Intl.NumberFormat('es-UY', { style: 'currency', currency: 'UYU', maximumFractionDigits: 0 }).format(price / 100);
type Props = {
  open: boolean; cart: string[]; products: Product[]; busy: boolean; success: string; error: string;
  onClose: () => void; onRemove: (id: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onExplore: () => void;
};

export default function CartDrawer({ open, cart, products, busy, success, error, onClose, onRemove, onSubmit, onExplore }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const exploreAfterClose = useRef(false);
  const id = useId();
  const reduce = useReducedMotion();
  const duration = reduce ? 0 : .22;
  const selected = cart.map(item => products.find(product => product.id === item));
  const invalid = selected.some(product => !product || product.status !== 'available');
  const total = selected.reduce((sum, product) => sum + (product?.price ?? 0), 0);
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
  }, [open]);
  useEffect(() => { const element = dialog.current; return () => { element?.close(); }; }, []);
  return <dialog ref={dialog} className="cart-dialog" aria-labelledby={`${id}-title`} aria-busy={busy}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]'))
        .filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    }}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <AnimatePresence onExitComplete={() => {
      if (!open) {
        dialog.current?.close();
        if (exploreAfterClose.current) { exploreAfterClose.current = false; onExplore(); }
      }
    }}>
      {open && <motion.div className="cart-shell" key="cart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration }}>
        <div className="cart-shade" aria-hidden="true" onClick={() => { if (!busy) onClose(); }} />
        <motion.section className="cart-panel" initial={{ x: reduce ? 0 : '100%' }} animate={{ x: 0 }} exit={{ x: reduce ? 0 : '100%' }}
          transition={{ type: 'tween', duration: reduce ? 0 : .3, ease: [.22, 1, .36, 1] }}>
          <header className="cart-heading"><div><p className="eyebrow">TUS PRÓXIMOS FAVORITOS</p><h2 id={`${id}-title`}>{success ? 'Pedido recibido' : 'Mi selección'}<span>.</span></h2>{!success && <span className="cart-count">{cart.length} {cart.length === 1 ? 'pieza única' : 'piezas únicas'}</span>}</div><button className="cart-close" disabled={busy} aria-label="Cerrar selección" onClick={onClose}><X size={22} /></button></header>
          <div className="cart-scroll">
            <AnimatePresence mode="wait" initial={false}>
              {success ? <motion.div key="success" className="cart-success" role="status" initial={{ opacity: 0, y: reduce ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration }}>
                <motion.span className="cart-success-mark" initial={{ scale: reduce ? 1 : .6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 17 }}>
                  <svg viewBox="0 0 40 40" aria-hidden="true"><motion.path d="M10 21l7 7 14-16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : .45, delay: reduce ? 0 : .15 }} /></svg>
                </motion.span>
                <p className="eyebrow">UN NUEVO CAPÍTULO</p><h3>¡Recibimos tu pedido!</h3><p>Tus piezas quedaron reservadas. La tienda te contactará al teléfono que dejaste para confirmar el pago y la entrega.</p><div className="cart-success-reference"><Check size={16} />Pedido #{success.slice(0, 8).toUpperCase()}</div><small>No se realizó ningún cobro online.</small><button className="primary" onClick={onClose}>Seguir explorando <ArrowRight size={17} /></button>
              </motion.div> : cart.length ? <motion.div key="selection" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration }}>
                <div className="selection-items"><AnimatePresence initial={false}>
                  {cart.map(item => { const product = products.find(p => p.id === item); return <motion.article key={item} layout={!reduce}
                    initial={{ opacity: 0, y: reduce ? 0 : 12 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: reduce ? 0 : 24, height: 0, marginBottom: 0 }} transition={{ duration }}>
                    <div className="selection-item-content">{product ? <img src={product.images[0]} alt={product.title} /> : <span className="selection-image-placeholder"><ShoppingBag size={23} /></span>}
                    <div><h3>{product?.title || 'Pieza no disponible'}</h3>{product && <p>{product.category}{product.size && ` · ${product.size}`}</p>}<strong>{product ? money(product.price) : 'Quitá esta pieza para continuar'}</strong>{product && product.status !== 'available' && <small>Ya no está disponible</small>}</div>
                    <button type="button" disabled={busy} aria-label={`Quitar ${product?.title || 'artículo'}`} onClick={() => onRemove(item)}><Trash2 size={17} /></button></div>
                  </motion.article>; })}
                </AnimatePresence></div>
                <div className="cart-contact-heading"><span>01</span><div><h3>¿Cómo te contactamos?</h3><p>Dejanos tus datos y coordinamos con vos.</p></div></div>
                <form id={`${id}-form`} className="cart-checkout" onSubmit={onSubmit}>
                  <fieldset disabled={busy}><label>Nombre<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Tu nombre" /></label><label>Teléfono / WhatsApp<input name="phone" type="tel" required minLength={7} maxLength={40} autoComplete="tel" placeholder="Tu número con código de área" /></label><label>Entrega<select name="delivery"><option>Retiro a coordinar</option><option>Envío a coordinar</option></select></label><label>Mensaje para la tienda <span>(opcional)</span><textarea name="notes" maxLength={1000} placeholder="¿Algo que debamos saber?" /></label><input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" /></fieldset>
                  {error && <p className="error" role="alert">{error}</p>}{invalid && <p className="error" role="alert">Quitá las piezas no disponibles antes de enviar tu pedido.</p>}
                  <p className="cart-privacy"><LockKeyhole size={14} />Usaremos tus datos solo para gestionar este pedido.</p>
                </form>
              </motion.div> : <motion.div key="empty" className="cart-empty" initial={{ opacity: 0, y: reduce ? 0 : 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration }}>
                <span className="cart-empty-mark"><ShoppingBag size={36} /><Leaf size={20} /></span><h3>Tu próximo hallazgo te espera</h3><p>Las piezas que elijas van a aparecer acá. Cada una tiene una nueva historia por delante.</p><button className="primary" onClick={() => { exploreAfterClose.current = true; onClose(); }}>Explorar catálogo <ArrowRight size={17} /></button>
              </motion.div>}
            </AnimatePresence>
          </div>
          {!success && cart.length > 0 && <div className="cart-checkout-footer"><div className="cart-total"><span>Total de artículos<small>Envío a coordinar con la tienda</small></span><AnimatePresence mode="wait" initial={false}><motion.strong key={total} initial={{ opacity: 0, y: reduce ? 0 : 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : .12 }}>{money(total)}</motion.strong></AnimatePresence></div><button className="primary" type="submit" form={`${id}-form`} disabled={busy || invalid}>{busy ? <><LoaderCircle className="spin" size={18} />Enviando…</> : <>Enviar pedido <ArrowRight size={18} /></>}</button><p><LockKeyhole size={12} />Sin pago online · Reservás al enviar</p></div>}
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  </dialog>;
}
