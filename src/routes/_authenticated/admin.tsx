import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { promoteSelfToAdmin } from "@/lib/orders.functions";
import { ClipboardList, Boxes, TrendingUp, AlertTriangle, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Forno" }] }),
  component: AdminHome,
});

function AdminHome() {
  const qc = useQueryClient();
  const promote = useServerFn(promoteSelfToAdmin);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: r } = await supabase
          .from("user_roles").select("role")
          .eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
        setIsAdmin(!!r);
      }
      setChecking(false);
    });
  }, []);

  const { data: activeOrders = [] } = useQuery({
    queryKey: ["admin-active-orders-count"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,status,total_amount,created_at")
        .eq("archived_for_admin", false)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  const { data: lowStock = [] } = useQuery({
    queryKey: ["low-stock"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory_items")
        .select("id,name,category,stock,threshold")
        .eq("active", true)
        .order("stock");
      return (data ?? []).filter((i) => i.stock < i.threshold);
    },
  });

  const { data: inventorySummary = [] } = useQuery({
    queryKey: ["inventory-summary"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory_items")
        .select("category,stock,threshold,active");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!isAdmin) return;
    const ch = supabase.channel("admin-home-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-active-orders-count"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_items" }, () => {
        qc.invalidateQueries({ queryKey: ["low-stock"] });
        qc.invalidateQueries({ queryKey: ["inventory-summary"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAdmin, qc]);

  if (checking) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl">Admin access required</h1>
            <p className="mt-2 text-muted-foreground">
              You are not registered as an admin. The first user can claim admin to set up the system.
            </p>
          </div>
          <Button
            onClick={async () => {
              try {
                await promote();
                toast.success("You are now an admin");
                qc.invalidateQueries();
                setIsAdmin(true);
              } catch (e) { toast.error((e as Error).message); }
            }}
          >
            Claim admin (first user only)
          </Button>
        </div>
      </div>
    );
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ordersToday = activeOrders.filter(
    (o) => new Date(o.created_at) >= today,
  );
  const revenue = ordersToday.reduce((s, o) => s + Number(o.total_amount), 0);

  const CATS = ["base", "sauce", "cheese", "veggie", "meat"] as const;
  const catStats = CATS.map((c) => {
    const items = inventorySummary.filter((i) => i.category === c && i.active);
    return {
      c,
      total: items.length,
      out: items.filter((i) => i.stock === 0).length,
      low: items.filter((i) => i.stock > 0 && i.stock < i.threshold).length,
    };
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminHeader />
      <main className="container mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-display text-4xl">Admin Control Panel</h1>
          <p className="mt-1 text-muted-foreground">Manage orders and kitchen inventory from here.</p>
        </div>

        {/* Stats bar */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard icon={<ClipboardList className="h-5 w-5" />} label="Active orders" value={activeOrders.length} />
          <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Revenue today" value={`₹${revenue.toFixed(2)}`} />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Low / out of stock"
            value={lowStock.length}
            accent={lowStock.length > 0}
          />
        </div>

        {/* Primary action cards */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Link to="/admin/orders">
            <Card className="group cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20">
                    <ClipboardList className="h-7 w-7 text-primary" />
                  </div>
                  {activeOrders.length > 0 && (
                    <Badge className="text-sm">{activeOrders.length} pending</Badge>
                  )}
                </div>
                <h2 className="mt-4 font-display text-2xl">Order Queue</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  View all incoming orders and update their status — Received → In Kitchen → Out for Delivery → Delivered.
                </p>
                <div className="mt-4 text-sm font-medium text-primary group-hover:underline">Manage orders →</div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/inventory">
            <Card className="group cursor-pointer border-2 border-transparent transition-all hover:border-primary hover:shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20">
                    <Boxes className="h-7 w-7 text-primary" />
                  </div>
                  {lowStock.length > 0 && (
                    <Badge variant="destructive" className="text-sm">{lowStock.length} alerts</Badge>
                  )}
                </div>
                <h2 className="mt-4 font-display text-2xl">Inventory</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Stock and unstock pizza bases, sauces, cheese, veggies, and meats. Keep track of available ingredients.
                </p>
                <div className="mt-4 text-sm font-medium text-primary group-hover:underline">Manage inventory →</div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Inventory quick view */}
        <div className="mt-8">
          <h2 className="mb-3 font-display text-xl">Inventory at a glance</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {catStats.map((t) => (
              <Card key={t.c} className={t.out > 0 || t.low > 0 ? "border-primary/40" : ""}>
                <CardContent className="p-4">
                  <div className="text-xs font-medium uppercase text-muted-foreground">{t.c}</div>
                  <div className="mt-1 font-display text-2xl">{t.total}</div>
                  <div className="mt-1 space-y-0.5 text-xs">
                    {t.out > 0 && <div className="text-destructive">{t.out} out of stock</div>}
                    {t.low > 0 && <div className="text-amber-600">{t.low} running low</div>}
                    {t.out === 0 && t.low === 0 && <div className="text-green-600">All stocked</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Low stock alerts */}
        {lowStock.length > 0 && (
          <Card className="mt-6 border-destructive/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <h3 className="font-semibold">Stock alerts</h3>
              </div>
              <ul className="mt-3 space-y-2">
                {lowStock.map((i) => (
                  <li key={i.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                    <span className="font-medium">{i.name}
                      <span className="ml-2 text-xs text-muted-foreground capitalize">({i.category})</span>
                    </span>
                    <Badge variant={i.stock === 0 ? "destructive" : "outline"}>
                      {i.stock === 0 ? "Out of stock" : `${i.stock} left (min ${i.threshold})`}
                    </Badge>
                  </li>
                ))}
              </ul>
              <Link to="/admin/inventory">
                <Button size="sm" variant="outline" className="mt-3">Go to Inventory</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, accent }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accent ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
          {icon}
        </div>
        <div>
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className={`font-display text-2xl ${accent ? "text-destructive" : ""}`}>{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
