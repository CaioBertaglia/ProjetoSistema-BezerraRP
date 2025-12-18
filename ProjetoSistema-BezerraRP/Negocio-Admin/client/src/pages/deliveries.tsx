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
  Pencil,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  MapPin,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DeliveryWithDetails, OrderWithDetails, InsertDelivery } from "@shared/schema";

const deliveryFormSchema = z.object({
  orderId: z.string().min(1, "Selecione um pedido"),
  scheduledDate: z.string().min(1, "Data é obrigatória"),
  scheduledTime: z.string().optional(),
  status: z.enum(["pending", "in_transit", "delivered", "cancelled"]),
  deliveryAddress: z.string().optional(),
  driverName: z.string().optional(),
  vehiclePlate: z.string().optional(),
  notes: z.string().optional(),
});

type DeliveryFormData = z.infer<typeof deliveryFormSchema>;

function getStatusBadge(status: string) {
  const variants: Record<
    string,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: React.ElementType }
  > = {
    pending: { variant: "secondary", label: "Pendente", icon: Clock },
    in_transit: { variant: "outline", label: "Em Rota", icon: Truck },
    delivered: { variant: "default", label: "Entregue", icon: CheckCircle },
    cancelled: { variant: "destructive", label: "Cancelado", icon: XCircle },
  };
  const config = variants[status] || { variant: "secondary", label: status, icon: Clock };
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function Deliveries() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryWithDetails | null>(null);

  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliveryFormSchema),
    defaultValues: {
      orderId: "",
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
      scheduledTime: "",
      status: "pending",
      deliveryAddress: "",
      driverName: "",
      vehiclePlate: "",
      notes: "",
    },
  });

  const { data: deliveries, isLoading } = useQuery<DeliveryWithDetails[]>({
    queryKey: ["/api/deliveries"],
  });

  const { data: orders } = useQuery<OrderWithDetails[]>({
    queryKey: ["/api/orders"],
  });

  const pendingOrders = orders?.filter(
    (o) => o.status === "pending" || o.status === "confirmed"
  );

  const createMutation = useMutation({
    mutationFn: (data: InsertDelivery) => apiRequest("POST", "/api/deliveries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Entrega programada com sucesso!" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Erro ao programar entrega", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertDelivery> }) =>
      apiRequest("PATCH", `/api/deliveries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Entrega atualizada com sucesso!" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar entrega", variant: "destructive" });
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingDelivery(null);
    form.reset();
  };

  const openCreateDialog = () => {
    form.reset({
      orderId: "",
      scheduledDate: format(new Date(), "yyyy-MM-dd"),
      scheduledTime: "",
      status: "pending",
      deliveryAddress: "",
      driverName: "",
      vehiclePlate: "",
      notes: "",
    });
    setDialogOpen(true);
  };

  const openEditDialog = (delivery: DeliveryWithDetails) => {
    setEditingDelivery(delivery);
    form.reset({
      orderId: delivery.orderId,
      scheduledDate: delivery.scheduledDate
        ? format(new Date(delivery.scheduledDate), "yyyy-MM-dd")
        : "",
      scheduledTime: delivery.scheduledTime ?? "",
      status: delivery.status as "pending" | "in_transit" | "delivered" | "cancelled",
      deliveryAddress: delivery.deliveryAddress ?? "",
      driverName: delivery.driverName ?? "",
      vehiclePlate: delivery.vehiclePlate ?? "",
      notes: delivery.notes ?? "",
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: DeliveryFormData) => {
    const payload: InsertDelivery = {
      orderId: data.orderId,
      scheduledDate: new Date(data.scheduledDate),
      scheduledTime: data.scheduledTime || undefined,
      status: data.status,
      deliveryAddress: data.deliveryAddress || undefined,
      driverName: data.driverName || undefined,
      vehiclePlate: data.vehiclePlate || undefined,
      notes: data.notes || undefined,
    };

    if (editingDelivery) {
      updateMutation.mutate({ id: editingDelivery.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredDeliveries = deliveries?.filter((delivery) => {
    const matchesSearch =
      delivery.order?.orderNumber.toString().includes(search) ||
      delivery.order?.client?.name.toLowerCase().includes(search.toLowerCase()) ||
      delivery.driverName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || delivery.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">Entregas</h1>
          <p className="text-muted-foreground">
            Gerencie as programações de entrega
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-new-delivery">
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrega
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-medium">Programação de Entregas</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-deliveries"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-delivery-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_transit">Em Rota</SelectItem>
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
          ) : filteredDeliveries && filteredDeliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id} data-testid={`delivery-row-${delivery.id}`}>
                      <TableCell>
                        <span className="font-medium">
                          #{delivery.order?.orderNumber ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell>{delivery.order?.client?.name ?? "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            {delivery.scheduledDate
                              ? format(new Date(delivery.scheduledDate), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })
                              : "-"}
                          </span>
                          {delivery.scheduledTime && (
                            <span className="text-sm text-muted-foreground">
                              {delivery.scheduledTime}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {delivery.deliveryAddress ? (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="max-w-[200px] truncate">
                              {delivery.deliveryAddress}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {delivery.driverName ? (
                          <div className="flex flex-col">
                            <span>{delivery.driverName}</span>
                            {delivery.vehiclePlate && (
                              <span className="text-sm text-muted-foreground">
                                {delivery.vehiclePlate}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(delivery)}
                            data-testid={`button-edit-delivery-${delivery.id}`}
                          >
                            <Pencil className="h-4 w-4" />
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
                <Truck className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">Nenhuma entrega encontrada</p>
                <p className="text-sm text-muted-foreground">
                  {search || statusFilter !== "all"
                    ? "Tente ajustar seus filtros"
                    : "Comece programando sua primeira entrega"}
                </p>
              </div>
              {!search && statusFilter === "all" && (
                <Button variant="outline" onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Programar Entrega
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDelivery ? "Editar Entrega" : "Nova Entrega"}
            </DialogTitle>
            <DialogDescription>
              {editingDelivery
                ? "Atualize as informações da entrega"
                : "Preencha os dados para programar uma nova entrega"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="orderId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pedido *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!editingDelivery}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-delivery-order">
                          <SelectValue placeholder="Selecione o pedido" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pendingOrders?.map((order) => (
                          <SelectItem key={order.id} value={order.id}>
                            #{order.orderNumber} - {order.client?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          data-testid="input-delivery-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="scheduledTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          data-testid="input-delivery-time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-delivery-status">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_transit">Em Rota</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço de Entrega</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Endereço completo para entrega..."
                        className="resize-none"
                        rows={2}
                        {...field}
                        data-testid="textarea-delivery-address"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="driverName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motorista</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nome do motorista"
                          {...field}
                          data-testid="input-delivery-driver"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehiclePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placa do Veículo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABC-1234"
                          {...field}
                          data-testid="input-delivery-plate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações da entrega..."
                        className="resize-none"
                        rows={2}
                        {...field}
                        data-testid="textarea-delivery-notes"
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
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Salvando..."
                    : editingDelivery
                    ? "Atualizar"
                    : "Programar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
