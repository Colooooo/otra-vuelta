import type { Product } from '../app/store';
import type { StoreOrder } from '../app/components/order-card';

export function getStoreSections(products: Product[], orders: StoreOrder[]) {
  const salesOrders = orders.filter(order => ['confirmed', 'completed'].includes(order.status));
  const salesProductIds = new Set(salesOrders.flatMap(order => order.items.map(item => item.product_id)));
  const activeProducts = products.filter(product => product.status !== 'sold' && !salesProductIds.has(product.id));
  const detachedSoldProducts = products.filter(product => product.status === 'sold' && !salesProductIds.has(product.id));
  return {
    activeProducts,
    pendingOrders: orders.filter(order => !['confirmed', 'completed'].includes(order.status)),
    salesOrders,
    detachedSoldProducts,
    soldPieceCount: products.filter(product => product.status === 'sold' || salesProductIds.has(product.id)).length,
  };
}
