import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  TrendingUp,
  Users,
  ShoppingCart,
  Truck,
  Download,
  Calendar,
  DollarSign,
  Package,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { OrderWithDetails, DeliveryWithDetails, Client, Supplier } from "@shared/schema";

function formatCurrency(value: number | string): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue || 0);
}

type ReportType = "orders" | "deliveries" | "clients" | "sales";

export default function Reports() {
  const [reportType, setReportType] = useState<ReportType>("orders");
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const [supplierFilter, setSupplierFilter] = useState<string>("all");

  const { data: orders, isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const { data: deliveries, isLoading: deliveriesLoading } = useQuery<DeliveryWithDetails[]>({
    queryKey: ["/api/deliveries"],
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const isLoading = ordersLoading || deliveriesLoading || clientsLoading;

  const filteredOrders = orders?.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    
    const matchesDate = orderDate >= from && orderDate <= to;
    const matchesSupplier = supplierFilter === "all" || order.supplierId === supplierFilter;
    
    return matchesDate && matchesSupplier;
  }) || [];

  const filteredDeliveries = deliveries?.filter((delivery) => {
    const deliveryDate = new Date(delivery.scheduledDate);
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    
    return deliveryDate >= from && deliveryDate <= to;
  }) || [];

  const orderStats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter((o) => o.status === "pending").length,
    confirmed: filteredOrders.filter((o) => o.status === "confirmed").length,
    delivered: filteredOrders.filter((o) => o.status === "delivered").length,
    totalValue: filteredOrders.reduce(
      (sum, o) => sum + parseFloat(o.totalValue?.toString() || "0"),
      0
    ),
  };

  const deliveryStats = {
    total: filteredDeliveries.length,
    pending: filteredDeliveries.filter((d) => d.status === "pending").length,
    inTransit: filteredDeliveries.filter((d) => d.status === "in_transit").length,
    delivered: filteredDeliveries.filter((d) => d.status === "delivered").length,
  };

  const clientStats = {
    total: clients?.length || 0,
    active: clients?.filter((c) => c.active).length || 0,
    pj: clients?.filter((c) => c.type === "PJ").length || 0,
    pf: clients?.filter((c) => c.type === "PF").length || 0,
  };

  const salesBySupplier = suppliers?.map((supplier) => {
    const supplierOrders = filteredOrders.filter((o) => o.supplierId === supplier.id);
    return {
      supplier: supplier.name,
      orders: supplierOrders.length,
      value: supplierOrders.reduce(
        (sum, o) => sum + parseFloat(o.totalValue?.toString() || "0"),
        0
      ),
    };
  }) || [];

  const setQuickDateRange = (range: "thisMonth" | "lastMonth" | "last3Months") => {
    const today = new Date();
    switch (range) {
      case "thisMonth":
        setDateFrom(format(startOfMonth(today), "yyyy-MM-dd"));
        setDateTo(format(endOfMonth(today), "yyyy-MM-dd"));
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        setDateFrom(format(startOfMonth(lastMonth), "yyyy-MM-dd"));
        setDateTo(format(endOfMonth(lastMonth), "yyyy-MM-dd"));
        break;
      case "last3Months":
        setDateFrom(format(startOfMonth(subMonths(today, 2)), "yyyy-MM-dd"));
        setDateTo(format(endOfMonth(today), "yyyy-MM-dd"));
        break;
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Relatórios</h1>
        <p className="text-muted-foreground">
          Visualize dados e estatísticas do seu negócio
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                <SelectTrigger className="w-full sm:w-48" data-testid="select-report-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orders">Pedidos</SelectItem>
                  <SelectItem value="deliveries">Entregas</SelectItem>
                  <SelectItem value="clients">Clientes</SelectItem>
                  <SelectItem value="sales">Vendas por Representado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">De</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full sm:w-40"
                data-testid="input-date-from"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Até</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full sm:w-40"
                data-testid="input-date-to"
              />
            </div>

            {(reportType === "orders" || reportType === "sales") && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Representado</label>
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-supplier-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {suppliers?.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange("thisMonth")}
                data-testid="button-this-month"
              >
                Este mês
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange("lastMonth")}
                data-testid="button-last-month"
              >
                Mês passado
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange("last3Months")}
                data-testid="button-last-3-months"
              >
                Últimos 3 meses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {reportType === "orders" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <ShoppingCart className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                        <p className="text-2xl font-semibold tabular-nums">{orderStats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                        <Package className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pendentes</p>
                        <p className="text-2xl font-semibold tabular-nums">{orderStats.pending}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                        <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entregues</p>
                        <p className="text-2xl font-semibold tabular-nums">{orderStats.delivered}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                        <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="text-2xl font-semibold tabular-nums">
                          {formatCurrency(orderStats.totalValue)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Pedidos no Período</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredOrders.length > 0 ? (
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
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-medium">
                                #{order.orderNumber}
                              </TableCell>
                              <TableCell>{order.client?.name ?? "-"}</TableCell>
                              <TableCell>{order.supplier?.name ?? "-"}</TableCell>
                              <TableCell>
                                {format(new Date(order.createdAt), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </TableCell>
                              <TableCell className="tabular-nums">
                                {formatCurrency(order.totalValue)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    order.status === "delivered"
                                      ? "default"
                                      : order.status === "cancelled"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {order.status === "pending"
                                    ? "Pendente"
                                    : order.status === "confirmed"
                                    ? "Confirmado"
                                    : order.status === "delivered"
                                    ? "Entregue"
                                    : "Cancelado"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-12">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Nenhum pedido encontrado no período selecionado
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {reportType === "deliveries" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Entregas</p>
                        <p className="text-2xl font-semibold tabular-nums">
                          {deliveryStats.total}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                        <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pendentes</p>
                        <p className="text-2xl font-semibold tabular-nums">
                          {deliveryStats.pending}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                        <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Em Rota</p>
                        <p className="text-2xl font-semibold tabular-nums">
                          {deliveryStats.inTransit}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                        <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entregues</p>
                        <p className="text-2xl font-semibold tabular-nums">
                          {deliveryStats.delivered}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Entregas no Período</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredDeliveries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Pedido</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Motorista</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDeliveries.map((delivery) => (
                            <TableRow key={delivery.id}>
                              <TableCell className="font-medium">
                                #{delivery.order?.orderNumber ?? "-"}
                              </TableCell>
                              <TableCell>{delivery.order?.client?.name ?? "-"}</TableCell>
                              <TableCell>
                                {format(new Date(delivery.scheduledDate), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </TableCell>
                              <TableCell>{delivery.driverName || "-"}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    delivery.status === "delivered"
                                      ? "default"
                                      : delivery.status === "cancelled"
                                      ? "destructive"
                                      : delivery.status === "in_transit"
                                      ? "outline"
                                      : "secondary"
                                  }
                                >
                                  {delivery.status === "pending"
                                    ? "Pendente"
                                    : delivery.status === "in_transit"
                                    ? "Em Rota"
                                    : delivery.status === "delivered"
                                    ? "Entregue"
                                    : "Cancelado"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-12">
                      <Truck className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Nenhuma entrega encontrada no período selecionado
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {reportType === "clients" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Clientes</p>
                        <p className="text-2xl font-semibold tabular-nums">{clientStats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                        <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Ativos</p>
                        <p className="text-2xl font-semibold tabular-nums">{clientStats.active}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                        <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pessoa Jurídica</p>
                        <p className="text-2xl font-semibold tabular-nums">{clientStats.pj}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                        <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pessoa Física</p>
                        <p className="text-2xl font-semibold tabular-nums">{clientStats.pf}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {reportType === "sales" && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="text-2xl font-semibold tabular-nums">
                          {formatCurrency(orderStats.totalValue)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                        <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                        <p className="text-2xl font-semibold tabular-nums">{orderStats.total}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Vendas por Representado</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {salesBySupplier.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Representado</TableHead>
                            <TableHead className="text-right">Pedidos</TableHead>
                            <TableHead className="text-right">Valor Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salesBySupplier.map((row) => (
                            <TableRow key={row.supplier}>
                              <TableCell className="font-medium">{row.supplier}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {row.orders}
                              </TableCell>
                              <TableCell className="text-right tabular-nums font-medium">
                                {formatCurrency(row.value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 p-12">
                      <TrendingUp className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Nenhum dado de vendas no período selecionado
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
