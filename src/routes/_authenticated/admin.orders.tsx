import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminHeader } from "@/components/AdminHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { updateOrderStatus } from "@/lib/orders.functions";
import { toast } from "sonner";
import { Pizza } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "Order Queue — Forno" }] }),
  component: AdminOrders,
});

const STATUSES = ["received", "in_kitchen", "sent_to_delivery", "delivered"] as const;
const STATUS_LABEL: Record<string, string> = {
  received: "Order Received",
  in_kitchen: "In the Kitchen",
  sent_to_delivery: "Out for Delivery",
  delivered: "Delivered",
};

function AdminOrders() {
  const qc = useQueryClient();
  const update = useServerFn(updateOrderStatus);

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders").select("*, order_items(*)")
        .eq("archived_for_admin", false)
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("admin-orders-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function setStatus(orderId: string, status: typeof STATUSES[number]) {
    try {
      await update({ data: { orderId, status } });
      toast.success(status === "delivered" ? "Order delivered — archived" : "Status updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div className="min-h-screen">
      <AdminHeader />
      <main className="container mx-auto px-4 py-10">
        <div className="flex items-center gap-3">
          <Pizza className="h-8 w-8 text-primary" />
          <h1 className="font-display text-4xl">Order Queue</h1>
          <Badge variant="outline" className="ml-2">{orders.length} active</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Delivered orders disappear from this list but remain in the customer's order history.
        </p>
        <div className="mt-6 space-y-3">
          {orders.map((o: { id: string; customer_name: string | null; total_amount: number; created_at: string; delivery_address: string; phone: string | null; status: typeof STATUSES[number]; order_items?: { id: string; pizza_name: string; quantity: number }[] | null }) => (
            <Card key={o.id} className="border-l-4 border-l-primary transition hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-semibold">{o.customer_name}</span>
                      <Badge variant="outline">${Number(o.total_amount).toFixed(2)}</Badge>
                      <Badge className="capitalize">{STATUS_LABEL[o.status]}</Badge>
                      <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{o.delivery_address} · {o.phone}</div>
                    <ul className="mt-2 text-sm">
                      {(o.order_items ?? []).map((it) => (
                        <li key={it.id}>🍕 {it.pizza_name} × {it.quantity}</li>
                      ))}
                    </ul>
                  </div>
                  <Select value={o.status} onValueChange={(v) => setStatus(o.id, v as typeof STATUSES[number])}>
                    <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
          {orders.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                🎉 No active orders. Everything's been delivered.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
