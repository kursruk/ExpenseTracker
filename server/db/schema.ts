import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const shops = sqliteTable('shops', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
});

export const checks = sqliteTable('checks', {
  id: text('id').primaryKey(),
  checkNumber: integer('check_number').notNull(),
  date: text('date').notNull(),
  shopId: text('shop_id').notNull().references(() => shops.id),
  total: real('total').notNull().default(0),
});

export const checkItems = sqliteTable('check_items', {
  id: text('id').primaryKey(),
  checkId: text('check_id').notNull().references(() => checks.id),
  serialNumber: integer('serial_number').notNull(),
  productName: text('product_name').notNull(),
  price: real('price').notNull(),
  count: real('count').notNull(),
  unitOfMeasure: text('unit_of_measure').notNull(),
  total: real('total').notNull(),
});