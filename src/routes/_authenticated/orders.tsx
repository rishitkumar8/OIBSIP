import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  received: "Order Received",
  in_kitchen: "In the Kitchen",
  sent_to_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My Orders — Forno" }] }),
  component: Orders,
});

function Orders() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Realtime: refresh on any update to my orders
  useEffect(() => {
    const channel = supabase
      .channel("user-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["my-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl">My Orders</h1>
        {orders.length === 0 && <p className="mt-6 text-muted-foreground">No orders yet.</p>}
        <div className="mt-6 space-y-4">
          {orders.map((o: any) => (
            <Card key={o.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                    <div className="mt-1 font-semibold">${Number(o.total_amount).toFixed(2)}</div>
                  </div>
                  <Badge variant={o.status === "delivered" ? "default" : "secondary"} className="text-sm">
                    {STATUS_LABEL[o.status]}
                  </Badge>
                </div>
                <ul className="mt-3 text-sm text-muted-foreground">
                  {(o.order_items ?? []).map((it: any) => (
                    <li key={it.id}>• {it.pizza_name} × {it.quantity}</li>
                  ))}
                </ul>
                <StatusTrack status={o.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatusTrack({ status }: { status: string }) {
  const steps = ["received", "in_kitchen", "sent_to_delivery", "delivered"];
  const idx = steps.indexOf(status);
  return (
    <div className="mt-4 flex gap-2">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}
