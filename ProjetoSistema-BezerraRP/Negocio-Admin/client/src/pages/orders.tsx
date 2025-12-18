import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  ShoppingCart,
  FileText,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  Client,
  Supplier,
  Product,
  Order,
  OrderWithDetails,
  InsertOrder,
  InsertOrderItem,
  InsertInvoice,
} from "@shared/schema";

const orderFormSchema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  supplierId: z.string().min(1, "Selecione um representado"),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, "Selecione um produto"),
    quantity: z.number().min(0.01, "Quantidade deve ser maior que zero"),
    unitPrice: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  })).min(1, "Adicione pelo menos um item"),
});

const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Número da NF é obrigatório"),
  series: z.string().optional(),
  issueDate: z.string().min(1, "Data de emissão é obrigatória"),
  value: z.string().optional(),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;
type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

function formatCurrency(value: number | string): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue || 0);
}

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    pending: { variant: "secondary", label: "Pendente" },
    confirmed: { variant: "default", label: "Confirmado" },
    delivered: { variant: "default", label: "Entregue" },
    cancelled: { variant: "destructive", label: "Cancelado" },
  };
  const config = variants[status] || { variant: "secondary", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function Orders() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [orderItems, setOrderItems] = useState<{ productId: string; quantity: number; unitPrice: number }[]>([
    { productId: "", quantity: 1, unitPrice: 0 },
  ]);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      clientId: "",
      supplierId: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const invoiceForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: "",
      series: "",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      value: "",
      notes: "",
    },
  });

  const { data: orders, isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const createMutation = useMutation({
    mutationFn: (data: { order: Partial<InsertOrder>; items: InsertOrderItem[] }) =>
      apiRequest("POST", "/api/orders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Pedido criado com sucesso!" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Erro ao criar pedido", variant: "destructive" });
    },
  });

  const addInvoiceMutation = useMutation({
    mutationFn: (data: InsertInvoice) => apiRequest("POST", "/api/invoices", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Nota fiscal adicionada com sucesso!" });
      setInvoiceDialogOpen(false);
      invoiceForm.reset();
    },
    onError: () => {
      toast({ title: "Erro ao adicionar nota fiscal", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/orders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Pedido excluído com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir pedido", variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    form.reset();
    setOrderItems([{ productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const addItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);
  };

  const onSubmit = (data: OrderFormData) => {
    const validItems = orderItems.filter((item) => item.productId && item.quantity > 0);
    if (validItems.length === 0) {
      toast({ title: "Adicione pelo menos um item válido", variant: "destructive" });
      return;
    }

    const orderData: Partial<InsertOrder> = {
      clientId: data.clientId,
      supplierId: data.supplierId,
      notes: data.notes,
      status: "pending",
      totalValue: calculateTotal().toFixed(2),
    };

    const itemsData: InsertOrderItem[] = validItems.map((item) => ({
      orderId: "",
      productId: item.productId,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      totalPrice: (item.quantity * item.unitPrice).toFixed(2),
    }));

    createMutation.mutate({ order: orderData, items: itemsData });
  };

  const onSubmitInvoice = (data: InvoiceFormData) => {
    if (!selectedOrder) return;

    const invoiceData: InsertInvoice = {
      orderId: selectedOrder.id,
      invoiceNumber: data.invoiceNumber,
      series: data.series || undefined,
      issueDate: new Date(data.issueDate),
      value: data.value || undefined,
      notes: data.notes || undefined,
    };

    addInvoiceMutation.mutate(invoiceData);
  };

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.orderNumber.toString().includes(search) ||
      order.client?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie os pedidos de compra
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} data-testid="button-new-order">
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-medium">Lista de Pedidos</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-orders"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Representado</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>NF</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} data-testid={`order-row-${order.id}`}>
                      <TableCell>
                        <span className="font-medium">#{order.orderNumber}</span>
                      </TableCell>
                      <TableCell>{order.client?.name ?? "-"}</TableCell>
                      <TableCell>{order.supplier?.name ?? "-"}</TableCell>
                      <TableCell>
                        {order.createdAt
                          ? format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })
                          : "-"}
                      </TableCell>
                      <TableCell className="font-medium tabular-nums">
                        {formatCurrency(order.totalValue)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.invoices && order.invoices.length > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            {order.invoices.length} NF
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedOrder(order);
                              setViewDialogOpen(true);
                            }}
                            data-testid={`button-view-order-${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedOrder(order);
                              invoiceForm.reset({
                                invoiceNumber: "",
                                series: "",
                                issueDate: format(new Date(), "yyyy-MM-dd"),
                                value: order.totalValue?.toString() ?? "",
                                notes: "",
                              });
                              setInvoiceDialogOpen(true);
                            }}
                            data-testid={`button-add-invoice-${order.id}`}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(order.id)}
                            data-testid={`button-delete-order-${order.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">Nenhum pedido encontrado</p>
                <p className="text-sm text-muted-foreground">
                  {search || statusFilter !== "all"
                    ? "Tente ajustar seus filtros"
                    : "Comece criando seu primeiro pedido"}
                </p>
              </div>
              {!search && statusFilter === "all" && (
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Pedido
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Pedido</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo pedido de compra
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-order-client">
                            <SelectValue placeholder="Selecione o cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients?.filter((c) => c.active).map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Representado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-order-supplier">
                            <SelectValue placeholder="Selecione o representado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers?.filter((s) => s.active).map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h4 className="font-medium">Itens do Pedido</h4>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="mr-1 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>
                <div className="flex flex-col gap-3">
                  {orderItems.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 rounded-lg border p-3"
                    >
                      <div className="col-span-12 sm:col-span-5">
                        <label className="mb-1 block text-sm font-medium">Produto</label>
                        <Select
                          value={item.productId}
                          onValueChange={(value) => updateItem(index, "productId", value)}
                        >
                          <SelectTrigger data-testid={`select-item-product-${index}`}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.filter((p) => p.active).map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-5 sm:col-span-2">
                        <label className="mb-1 block text-sm font-medium">Qtd</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                          }
                          data-testid={`input-item-quantity-${index}`}
                        />
                      </div>
                      <div className="col-span-5 sm:col-span-3">
                        <label className="mb-1 block text-sm font-medium">Preço Unit.</label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)
                          }
                          data-testid={`input-item-price-${index}`}
                        />
                      </div>
                      <div className="col-span-2 flex items-end justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={orderItems.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end border-t pt-4">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">Total do Pedido:</span>
                    <p className="text-2xl font-semibold tabular-nums">
                      {formatCurrency(calculateTotal())}
                    </p>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações do pedido..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="textarea-order-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2">
                <Button type="button" variant="ghost" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar Pedido"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedido #{selectedOrder?.orderNumber}</DialogTitle>
            <DialogDescription>Detalhes do pedido</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Cliente</span>
                  <p className="font-medium">{selectedOrder.client?.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Representado</span>
                  <p className="font-medium">{selectedOrder.supplier?.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Data</span>
                  <p className="font-medium">
                    {selectedOrder.createdAt
                      ? format(new Date(selectedOrder.createdAt), "dd/MM/yyyy HH:mm", {
                          locale: ptBR,
                        })
                      : "-"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 font-medium">Itens do Pedido</h4>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product?.name ?? "-"}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {formatCurrency(item.totalPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum item</p>
                )}
                <div className="mt-4 flex justify-end border-t pt-4">
                  <div className="text-right">
                    <span className="text-sm text-muted-foreground">Total:</span>
                    <p className="text-xl font-semibold tabular-nums">
                      {formatCurrency(selectedOrder.totalValue)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedOrder.invoices && selectedOrder.invoices.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="mb-3 font-medium">Notas Fiscais</h4>
                  <div className="flex flex-col gap-2">
                    {selectedOrder.invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <span className="font-medium">NF {invoice.invoiceNumber}</span>
                          {invoice.series && (
                            <span className="text-muted-foreground"> - Série {invoice.series}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.issueDate
                            ? format(new Date(invoice.issueDate), "dd/MM/yyyy")
                            : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOrder.notes && (
                <div className="border-t pt-4">
                  <h4 className="mb-2 font-medium">Observações</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nota Fiscal</DialogTitle>
            <DialogDescription>
              Registre a nota fiscal para o pedido #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <Form {...invoiceForm}>
            <form
              onSubmit={invoiceForm.handleSubmit(onSubmitInvoice)}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={invoiceForm.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da NF *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000000"
                          {...field}
                          data-testid="input-invoice-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={invoiceForm.control}
                  name="series"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Série</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="1"
                          {...field}
                          data-testid="input-invoice-series"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={invoiceForm.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Emissão *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-invoice-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={invoiceForm.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          data-testid="input-invoice-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={invoiceForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações..."
                        className="resize-none"
                        rows={2}
                        {...field}
                        data-testid="textarea-invoice-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setInvoiceDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={addInvoiceMutation.isPending}>
                  {addInvoiceMutation.isPending ? "Adicionando..." : "Adicionar NF"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
