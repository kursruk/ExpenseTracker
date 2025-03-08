import { pgTable, text, uuid, integer, real, timestamp } from 'drizzle-orm/pg-core';

export const shops = pgTable('shops', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const checks = pgTable('checks', {
  id: uuid('id').primaryKey(),
  checkNumber: integer('check_number').notNull(),
  date: text('date').notNull(),
  shopId: uuid('shop_id').notNull().references(() => shops.id),
  total: real('total').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

export const checkItems = pgTable('check_items', {
  id: uuid('id').primaryKey(),
  checkId: uuid('check_id').notNull().references(() => checks.id),
  serialNumber: integer('serial_number').notNull(),
  productName: text('product_name').notNull(),
  price: real('price').notNull(),
  count: real('count').notNull(),
  unitOfMeasure: text('unit_of_measure').notNull(),
  total: real('total').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});