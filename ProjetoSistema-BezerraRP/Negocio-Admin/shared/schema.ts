import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Suppliers (representados) table
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(true),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  unit: text("unit").notNull().default("m³"),
  active: boolean("active").notNull().default(true),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'PF' or 'PJ'
  name: text("name").notNull(),
  tradeName: text("trade_name"), // nome fantasia
  document: text("document").notNull(), // CPF or CNPJ
  stateRegistration: text("state_registration"), // inscrição estadual
  email: text("email"),
  phone: text("phone"),
  cellphone: text("cellphone"),
  zipCode: text("zip_code"),
  street: text("street"),
  number: text("number"),
  complement: text("complement"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// Orders table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: integer("order_number").notNull(),
  clientId: varchar("client_id").notNull(),
  supplierId: varchar("supplier_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, delivered, cancelled
  totalValue: decimal("total_value", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order items table
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Deliveries table
export const deliveries = pgTable("deliveries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  scheduledTime: text("scheduled_time"),
  status: text("status").notNull().default("pending"), // pending, in_transit, delivered, cancelled
  deliveryAddress: text("delivery_address"),
  driverName: text("driver_name"),
  vehiclePlate: text("vehicle_plate"),
  notes: text("notes"),
  deliveredAt: timestamp("delivered_at"),
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({ id: true });
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveries.$inferSelect;

// Invoices table (Notas Fiscais)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  series: text("series"),
  issueDate: timestamp("issue_date").notNull(),
  value: decimal("value", { precision: 12, scale: 2 }),
  notes: text("notes"),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Extended types for frontend with relations
export type OrderWithDetails = Order & {
  client: Client;
  supplier: Supplier;
  items: (OrderItem & { product: Product })[];
  deliveries: Delivery[];
  invoices: Invoice[];
};

export type DeliveryWithDetails = Delivery & {
  order: Order & {
    client: Client;
    supplier: Supplier;
  };
};

// Dashboard stats type
export type DashboardStats = {
  pendingOrders: number;
  todayDeliveries: number;
  activeClients: number;
  monthlyValue: number;
};
