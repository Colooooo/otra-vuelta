import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const products = sqliteTable('products', {
 id: text('id').primaryKey(), title: text('title').notNull(), description: text('description').notNull(),
 category: text('category').notNull(), size: text('size').notNull(), condition: text('condition').notNull(),
 price: integer('price').notNull(), images: text('images').notNull(), status: text('status').notNull().default('available'),
 created: text('created').notNull()
});
export const orders = sqliteTable('orders', {
 id: text('id').primaryKey(), name: text('name').notNull(), phone: text('phone').notNull(),
 delivery: text('delivery').notNull(), notes: text('notes').notNull(), status: text('status').notNull().default('pending'),
 total: integer('total').notNull(), created: text('created').notNull()
});
export const orderItems = sqliteTable('order_items', {
 id: text('id').primaryKey(), orderId: text('order_id').notNull(), productId: text('product_id').notNull(),
 title: text('title').notNull(), price: integer('price').notNull(),
 reservation: text('reservation').unique()
});
