import {
  type User,
  type InsertUser,
  type Client,
  type InsertClient,
  type Product,
  type InsertProduct,
  type Supplier,
  type InsertSupplier,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Delivery,
  type InsertDelivery,
  type Invoice,
  type InsertInvoice,
  type OrderWithDetails,
  type DeliveryWithDetails,
  type DashboardStats,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: string): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;

  // Orders
  getOrders(): Promise<OrderWithDetails[]>;
  getOrder(id: string): Promise<OrderWithDetails | undefined>;
  getRecentOrders(limit: number): Promise<OrderWithDetails[]>;
  createOrder(order: Partial<InsertOrder>, items: InsertOrderItem[]): Promise<OrderWithDetails>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;

  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;

  // Deliveries
  getDeliveries(): Promise<DeliveryWithDetails[]>;
  getDelivery(id: string): Promise<DeliveryWithDetails | undefined>;
  getTodayDeliveries(): Promise<DeliveryWithDetails[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: string, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined>;

  // Invoices
  getInvoices(orderId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;

  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private clients: Map<string, Client>;
  private products: Map<string, Product>;
  private suppliers: Map<string, Supplier>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private deliveries: Map<string, Delivery>;
  private invoices: Map<string, Invoice>;
  private orderCounter: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.products = new Map();
    this.suppliers = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.deliveries = new Map();
    this.invoices = new Map();
    this.orderCounter = 1000;

    this.seedData();
  }

  private seedData() {
    // Seed suppliers
    const novaAreiao: Supplier = {
      id: randomUUID(),
      name: "Nova Areião",
      active: true,
    };
    const ferrovia: Supplier = {
      id: randomUUID(),
      name: "Ferrovia",
      active: true,
    };
    this.suppliers.set(novaAreiao.id, novaAreiao);
    this.suppliers.set(ferrovia.id, ferrovia);

    // Seed products
    const productNames = [
      "Areia Média",
      "Areia Fina",
      "Areia Grossa",
      "Areia Média Grossa",
      "Areia Média Fina",
      "Brita 1",
      "Brita 2",
      "Brita 3",
      "Brita 4",
      "Rachão",
      "BGS",
      "Pedrisco Limpo",
      "Pó de Pedra",
      "Rachão Reciclado",
      "Areia Desclassificada",
      "Argila Expandida",
      "Bica Reciclada",
      "Brita Reciclada",
      "Brita 1 Reciclada",
      "Brita 2 Reciclada",
      "Brita 3 Reciclada",
      "Brita 4 Reciclada",
      "Areia De Quadra",
    ];

    const productIds: string[] = [];
    productNames.forEach((name) => {
      const product: Product = {
        id: randomUUID(),
        name,
        unit: "m³",
        active: true,
      };
      this.products.set(product.id, product);
      productIds.push(product.id);
    });

    // Seed sample clients
    const client1: Client = {
      id: randomUUID(),
      type: "PJ",
      name: "Construtora ABC Ltda",
      tradeName: "Construtora ABC",
      document: "12345678000199",
      stateRegistration: "123456789",
      email: "contato@construtorabc.com.br",
      phone: "(11) 3333-4444",
      cellphone: "(11) 99999-8888",
      zipCode: "01310-100",
      street: "Av. Paulista",
      number: "1000",
      complement: "Sala 501",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      notes: "Cliente desde 2020",
      active: true,
    };

    const client2: Client = {
      id: randomUUID(),
      type: "PJ",
      name: "Incorporadora XYZ S/A",
      tradeName: "XYZ Incorporações",
      document: "98765432000188",
      stateRegistration: "987654321",
      email: "comercial@xyz.com.br",
      phone: "(11) 2222-3333",
      cellphone: "(11) 98888-7777",
      zipCode: "04543-011",
      street: "Rua Funchal",
      number: "418",
      complement: "10º andar",
      neighborhood: "Vila Olímpia",
      city: "São Paulo",
      state: "SP",
      notes: "Grande volume mensal",
      active: true,
    };

    const client3: Client = {
      id: randomUUID(),
      type: "PF",
      name: "João da Silva",
      tradeName: null,
      document: "12345678901",
      stateRegistration: null,
      email: "joao.silva@email.com",
      phone: null,
      cellphone: "(11) 97777-6666",
      zipCode: "03102-000",
      street: "Rua das Flores",
      number: "123",
      complement: null,
      neighborhood: "Mooca",
      city: "São Paulo",
      state: "SP",
      notes: null,
      active: true,
    };

    this.clients.set(client1.id, client1);
    this.clients.set(client2.id, client2);
    this.clients.set(client3.id, client3);

    // Seed sample orders
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    this.orderCounter = 1000;

    const order1Id = randomUUID();
    const order1: Order = {
      id: order1Id,
      orderNumber: ++this.orderCounter,
      clientId: client1.id,
      supplierId: novaAreiao.id,
      status: "pending",
      totalValue: "4500.00",
      notes: "Entrega urgente",
      createdAt: today,
    };
    this.orders.set(order1Id, order1);

    const orderItem1: OrderItem = {
      id: randomUUID(),
      orderId: order1Id,
      productId: productIds[0],
      quantity: "30",
      unitPrice: "150.00",
      totalPrice: "4500.00",
    };
    this.orderItems.set(orderItem1.id, orderItem1);

    const order2Id = randomUUID();
    const order2: Order = {
      id: order2Id,
      orderNumber: ++this.orderCounter,
      clientId: client2.id,
      supplierId: ferrovia.id,
      status: "confirmed",
      totalValue: "8750.00",
      notes: null,
      createdAt: yesterday,
    };
    this.orders.set(order2Id, order2);

    const orderItem2a: OrderItem = {
      id: randomUUID(),
      orderId: order2Id,
      productId: productIds[5],
      quantity: "25",
      unitPrice: "200.00",
      totalPrice: "5000.00",
    };
    const orderItem2b: OrderItem = {
      id: randomUUID(),
      orderId: order2Id,
      productId: productIds[6],
      quantity: "15",
      unitPrice: "250.00",
      totalPrice: "3750.00",
    };
    this.orderItems.set(orderItem2a.id, orderItem2a);
    this.orderItems.set(orderItem2b.id, orderItem2b);

    const order3Id = randomUUID();
    const order3: Order = {
      id: order3Id,
      orderNumber: ++this.orderCounter,
      clientId: client1.id,
      supplierId: novaAreiao.id,
      status: "delivered",
      totalValue: "2100.00",
      notes: null,
      createdAt: twoDaysAgo,
    };
    this.orders.set(order3Id, order3);

    const orderItem3: OrderItem = {
      id: randomUUID(),
      orderId: order3Id,
      productId: productIds[1],
      quantity: "14",
      unitPrice: "150.00",
      totalPrice: "2100.00",
    };
    this.orderItems.set(orderItem3.id, orderItem3);

    // Seed sample deliveries
    const delivery1: Delivery = {
      id: randomUUID(),
      orderId: order1Id,
      scheduledDate: today,
      scheduledTime: "14:00",
      status: "pending",
      deliveryAddress: "Av. Paulista, 1000 - Bela Vista, São Paulo/SP",
      driverName: "Carlos Oliveira",
      vehiclePlate: "ABC-1234",
      notes: "Entrar pela portaria de serviço",
      deliveredAt: null,
    };
    this.deliveries.set(delivery1.id, delivery1);

    const delivery2: Delivery = {
      id: randomUUID(),
      orderId: order2Id,
      scheduledDate: today,
      scheduledTime: "09:00",
      status: "in_transit",
      deliveryAddress: "Rua Funchal, 418 - Vila Olímpia, São Paulo/SP",
      driverName: "Roberto Santos",
      vehiclePlate: "XYZ-5678",
      notes: null,
      deliveredAt: null,
    };
    this.deliveries.set(delivery2.id, delivery2);

    const delivery3: Delivery = {
      id: randomUUID(),
      orderId: order3Id,
      scheduledDate: twoDaysAgo,
      scheduledTime: "10:30",
      status: "delivered",
      deliveryAddress: "Av. Paulista, 1000 - Bela Vista, São Paulo/SP",
      driverName: "Carlos Oliveira",
      vehiclePlate: "ABC-1234",
      notes: null,
      deliveredAt: twoDaysAgo,
    };
    this.deliveries.set(delivery3.id, delivery3);

    // Seed sample invoice
    const invoice1: Invoice = {
      id: randomUUID(),
      orderId: order3Id,
      invoiceNumber: "000123",
      series: "1",
      issueDate: twoDaysAgo,
      value: "2100.00",
      notes: null,
    };
    this.invoices.set(invoice1.id, invoice1);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClient(id: string): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = randomUUID();
    const client: Client = { ...insertClient, id };
    this.clients.set(id, client);
    return client;
  }

  async updateClient(
    id: string,
    data: Partial<InsertClient>
  ): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    const updated: Client = { ...client, ...data };
    this.clients.set(id, updated);
    return updated;
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.clients.delete(id);
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  // Orders
  async getOrders(): Promise<OrderWithDetails[]> {
    const orders = Array.from(this.orders.values());
    const result: OrderWithDetails[] = [];

    for (const order of orders) {
      const orderWithDetails = await this.buildOrderWithDetails(order);
      result.push(orderWithDetails);
    }

    return result.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    return this.buildOrderWithDetails(order);
  }

  async getRecentOrders(limit: number): Promise<OrderWithDetails[]> {
    const orders = await this.getOrders();
    return orders.slice(0, limit);
  }

  async createOrder(
    orderData: Partial<InsertOrder>,
    items: InsertOrderItem[]
  ): Promise<OrderWithDetails> {
    const id = randomUUID();
    this.orderCounter++;

    const order: Order = {
      id,
      orderNumber: this.orderCounter,
      clientId: orderData.clientId!,
      supplierId: orderData.supplierId!,
      status: orderData.status || "pending",
      totalValue: orderData.totalValue || "0",
      notes: orderData.notes || null,
      createdAt: new Date(),
    };

    this.orders.set(id, order);

    // Create order items
    for (const item of items) {
      const itemId = randomUUID();
      const orderItem: OrderItem = {
        id: itemId,
        orderId: id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      };
      this.orderItems.set(itemId, orderItem);
    }

    return this.buildOrderWithDetails(order);
  }

  async updateOrder(
    id: string,
    data: Partial<InsertOrder>
  ): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated: Order = { ...order, ...data };
    this.orders.set(id, updated);
    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    // Delete related items
    const items = Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === id
    );
    items.forEach((item) => this.orderItems.delete(item.id));

    // Delete related deliveries
    const deliveries = Array.from(this.deliveries.values()).filter(
      (d) => d.orderId === id
    );
    deliveries.forEach((d) => this.deliveries.delete(d.id));

    // Delete related invoices
    const invoices = Array.from(this.invoices.values()).filter(
      (i) => i.orderId === id
    );
    invoices.forEach((i) => this.invoices.delete(i.id));

    return this.orders.delete(id);
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }

  // Deliveries
  async getDeliveries(): Promise<DeliveryWithDetails[]> {
    const deliveries = Array.from(this.deliveries.values());
    const result: DeliveryWithDetails[] = [];

    for (const delivery of deliveries) {
      const deliveryWithDetails = await this.buildDeliveryWithDetails(delivery);
      result.push(deliveryWithDetails);
    }

    return result.sort(
      (a, b) =>
        new Date(b.scheduledDate).getTime() -
        new Date(a.scheduledDate).getTime()
    );
  }

  async getDelivery(id: string): Promise<DeliveryWithDetails | undefined> {
    const delivery = this.deliveries.get(id);
    if (!delivery) return undefined;
    return this.buildDeliveryWithDetails(delivery);
  }

  async getTodayDeliveries(): Promise<DeliveryWithDetails[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const deliveries = Array.from(this.deliveries.values()).filter((d) => {
      const scheduledDate = new Date(d.scheduledDate);
      return scheduledDate >= today && scheduledDate < tomorrow;
    });

    const result: DeliveryWithDetails[] = [];
    for (const delivery of deliveries) {
      const deliveryWithDetails = await this.buildDeliveryWithDetails(delivery);
      result.push(deliveryWithDetails);
    }

    return result;
  }

  async createDelivery(insertDelivery: InsertDelivery): Promise<Delivery> {
    const id = randomUUID();
    const delivery: Delivery = {
      id,
      orderId: insertDelivery.orderId,
      scheduledDate: insertDelivery.scheduledDate,
      scheduledTime: insertDelivery.scheduledTime || null,
      status: insertDelivery.status || "pending",
      deliveryAddress: insertDelivery.deliveryAddress || null,
      driverName: insertDelivery.driverName || null,
      vehiclePlate: insertDelivery.vehiclePlate || null,
      notes: insertDelivery.notes || null,
      deliveredAt: null,
    };
    this.deliveries.set(id, delivery);
    return delivery;
  }

  async updateDelivery(
    id: string,
    data: Partial<InsertDelivery>
  ): Promise<Delivery | undefined> {
    const delivery = this.deliveries.get(id);
    if (!delivery) return undefined;

    const updated: Delivery = {
      ...delivery,
      ...data,
      deliveredAt:
        data.status === "delivered" && !delivery.deliveredAt
          ? new Date()
          : delivery.deliveredAt,
    };
    this.deliveries.set(id, updated);
    return updated;
  }

  // Invoices
  async getInvoices(orderId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(
      (invoice) => invoice.orderId === orderId
    );
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const id = randomUUID();
    const invoice: Invoice = {
      id,
      orderId: insertInvoice.orderId,
      invoiceNumber: insertInvoice.invoiceNumber,
      series: insertInvoice.series || null,
      issueDate: insertInvoice.issueDate,
      value: insertInvoice.value || null,
      notes: insertInvoice.notes || null,
    };
    this.invoices.set(id, invoice);
    return invoice;
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const orders = Array.from(this.orders.values());
    const clients = Array.from(this.clients.values());

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDeliveries = Array.from(this.deliveries.values()).filter((d) => {
      const scheduledDate = new Date(d.scheduledDate);
      return scheduledDate >= today && scheduledDate < tomorrow;
    });

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = orders.filter(
      (o) => new Date(o.createdAt) >= startOfMonth
    );

    return {
      pendingOrders: orders.filter((o) => o.status === "pending").length,
      todayDeliveries: todayDeliveries.length,
      activeClients: clients.filter((c) => c.active).length,
      monthlyValue: monthlyOrders.reduce(
        (sum, o) => sum + parseFloat(o.totalValue?.toString() || "0"),
        0
      ),
    };
  }

  // Helper methods
  private async buildOrderWithDetails(order: Order): Promise<OrderWithDetails> {
    const client = await this.getClient(order.clientId);
    const supplier = await this.getSupplier(order.supplierId);
    const items = await this.getOrderItems(order.id);
    const deliveries = Array.from(this.deliveries.values()).filter(
      (d) => d.orderId === order.id
    );
    const invoices = await this.getInvoices(order.id);

    const itemsWithProducts = await Promise.all(
      items.map(async (item) => {
        const product = await this.getProduct(item.productId);
        return { ...item, product: product! };
      })
    );

    return {
      ...order,
      client: client!,
      supplier: supplier!,
      items: itemsWithProducts,
      deliveries,
      invoices,
    };
  }

  private async buildDeliveryWithDetails(
    delivery: Delivery
  ): Promise<DeliveryWithDetails> {
    const order = this.orders.get(delivery.orderId);
    const client = order ? await this.getClient(order.clientId) : undefined;
    const supplier = order ? await this.getSupplier(order.supplierId) : undefined;

    return {
      ...delivery,
      order: order
        ? {
            ...order,
            client: client!,
            supplier: supplier!,
          }
        : undefined as any,
    };
  }
}

export const storage = new MemStorage();
