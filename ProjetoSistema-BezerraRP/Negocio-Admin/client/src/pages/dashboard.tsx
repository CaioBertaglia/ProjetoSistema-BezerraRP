import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ShoppingCart, 
  Truck, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { DashboardStats, OrderWithDetails, DeliveryWithDetails } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  loading,
  color = "primary"
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  loading?: boolean;
  color?: "primary" | "success" | "warning" | "info";
}) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{title}</span>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <span className="text-2xl font-semibold tabular-nums">{value}</span>
            )}
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    pending: { variant: "secondary", label: "Pendente" },
    confirmed: { variant: "default", label: "Confirmado" },
    in_transit: { variant: "outline", label: "Em Rota" },
    delivered: { variant: "default", label: "Entregue" },
    cancelled: { variant: "destructive", label: "Cancelado" },
  };
  const config = variants[status] || { variant: "secondary", label: status };
  return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentOrders, isLoading: ordersLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders/recent"],
  });

  const { data: todayDeliveries, isLoading: deliveriesLoading } = useQuery<DeliveryWithDetails[]>({
    queryKey: ["/api/deliveries/today"],
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu negócio
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pedidos Pendentes"
          value={stats?.pendingOrders ?? 0}
          icon={ShoppingCart}
          loading={statsLoading}
          color="warning"
        />
        <StatCard
          title="Entregas Hoje"
          value={stats?.todayDeliveries ?? 0}
          icon={Truck}
          loading={statsLoading}
          color="info"
        />
        <StatCard
          title="Clientes Ativos"
          value={stats?.activeClients ?? 0}
          icon={Users}
          loading={statsLoading}
          color="success"
        />
        <StatCard
          title="Valor Mensal"
          value={formatCurrency(stats?.monthlyValue ?? 0)}
          icon={DollarSign}
          loading={statsLoading}
          color="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg font-medium">Pedidos Recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/pedidos" data-testid="link-view-all-orders">
                Ver todos
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {ordersLoading ? (
              <div className="flex flex-col gap-3 p-6 pt-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex flex-1 flex-col gap-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
              <div className="flex flex-col">
                {recentOrders.slice(0, 5).map((order, index) => (
                  <div
                    key={order.id}
                    className={`flex items-center gap-4 p-4 ${
                      index !== recentOrders.length - 1 && index !== 4 
                        ? "border-b border-border" 
                        : ""
                    }`}
                    data-testid={`order-item-${order.id}`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="font-medium">Pedido #{order.orderNumber}</span>
                      <span className="text-sm text-muted-foreground">
                        {order.client?.name ?? "Cliente"}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(order.status)}
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(parseFloat(order.totalValue?.toString() ?? "0"))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhum pedido recente encontrado
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/pedidos/novo" data-testid="link-create-first-order">
                    Criar primeiro pedido
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
            <CardTitle className="text-lg font-medium">Entregas de Hoje</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/entregas" data-testid="link-view-all-deliveries">
                Ver todas
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {deliveriesLoading ? (
              <div className="flex flex-col gap-3 p-6 pt-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex flex-1 flex-col gap-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : todayDeliveries && todayDeliveries.length > 0 ? (
              <div className="flex flex-col">
                {todayDeliveries.slice(0, 5).map((delivery, index) => (
                  <div
                    key={delivery.id}
                    className={`flex items-center gap-4 p-4 ${
                      index !== todayDeliveries.length - 1 && index !== 4 
                        ? "border-b border-border" 
                        : ""
                    }`}
                    data-testid={`delivery-item-${delivery.id}`}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      delivery.status === "delivered" 
                        ? "bg-emerald-500/10" 
                        : delivery.status === "in_transit"
                        ? "bg-blue-500/10"
                        : "bg-muted"
                    }`}>
                      {delivery.status === "delivered" ? (
                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      ) : delivery.status === "in_transit" ? (
                        <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="font-medium">
                        Pedido #{delivery.order?.orderNumber ?? "-"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {delivery.scheduledTime || "Horário a definir"}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(delivery.status)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Truck className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Nenhuma entrega programada para hoje
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/entregas" data-testid="link-schedule-delivery">
                    Programar entrega
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
