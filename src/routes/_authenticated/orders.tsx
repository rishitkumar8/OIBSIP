import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChefHat, Truck, Clock } from "lucide-react";

const STEPS = [
  { key: "received",         label: "Order Received",    icon: Clock,         color: "text-blue-500" },
  { key: "in_kitchen",       label: "In the Kitchen",    icon: ChefHat,       color: "text-amber-500" },
  { key: "sent_to_delivery", label: "Out for Delivery",  icon: Truck,         color: "text-purple-500" },
  { key: "delivered",        label: "Delivered",         icon: CheckCircle2,  color: "text-green-500" },
] as const;

type StatusKey = (typeof STEPS)[number]["key"];

const BADGE_VARIANT: Record<StatusKey, "default" | "secondary" | "outline"> = {
  received: "outline",
  in_kitchen: "secondary",
  sent_to_delivery: "secondary",
  delivered: "default",
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

  useEffect(() => {
    const channel = supabase
      .channel("user-orders-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => qc.invalidateQueries({ queryKey: ["my-orders"] }),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => qc.invalidateQueries({ queryKey: ["my-orders"] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl">My Orders</h1>
        <p className="mt-1 text-muted-foreground">Your order status updates in real time.</p>

        {orders.length === 0 && (
          <Card className="mt-8">
            <CardContent className="p-12 text-center text-muted-foreground">
              No orders yet — head to the menu to place your first order!
            </CardContent>
          </Card>
        )}

        <div className="mt-6 space-y-4">
          {orders.map((o: any) => {
            const status = o.status as StatusKey;
            const stepIdx = STEPS.findIndex((s) => s.key === status);
            const currentStep = STEPS[stepIdx];
            const Icon = currentStep?.icon ?? Clock;

            return (
              <Card key={o.id} className={`overflow-hidden transition-shadow hover:shadow-md ${status === "delivered" ? "border-green-200" : "border-l-4 border-l-primary"}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-lg">₹{Number(o.total_amount).toFixed(2)}</span>
                        <Badge variant={BADGE_VARIANT[status] ?? "outline"} className="gap-1">
                          <Icon className={`h-3.5 w-3.5 ${currentStep?.color ?? ""}`} />
                          {currentStep?.label ?? status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Placed {new Date(o.created_at).toLocaleString()}
                      </div>
                      <ul className="mt-2 text-sm text-muted-foreground">
                        {(o.order_items ?? []).map((it: any) => (
                          <li key={it.id}>• {it.pizza_name} × {it.quantity}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Status track */}
                  <div className="mt-4">
                    <div className="flex gap-1">
                      {STEPS.map((s, i) => (
                        <div
                          key={s.key}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                            i <= stepIdx ? "bg-primary" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between">
                      {STEPS.map((s, i) => {
                        const StepIcon = s.icon;
                        const done = i < stepIdx;
                        const active = i === stepIdx;
                        return (
                          <div key={s.key} className="flex flex-col items-center gap-0.5" style={{ width: "25%" }}>
                            <StepIcon
                              className={`h-4 w-4 ${
                                active ? s.color : done ? "text-primary" : "text-muted-foreground/40"
                              }`}
                            />
                            <span className={`text-center text-[10px] leading-tight ${
                              active ? "font-semibold text-foreground" : done ? "text-primary" : "text-muted-foreground/50"
                            }`}>
                              {s.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
