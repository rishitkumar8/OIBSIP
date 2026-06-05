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

  const { data: lowStock = [] } = useQuery({
    queryKey: ["low-stock"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory_items")
        .select("id,name,category,stock,threshold")
        .order("stock");
      return (data ?? []).filter((i) => i.stock < i.threshold);
    },
  });

  const { data: ordersToday = [] } = useQuery({
    queryKey: ["orders-today"],
    enabled: isAdmin,
    queryFn: async () => {
      const since = new Date(); since.setHours(0,0,0,0);
      const { data } = await supabase
        .from("orders").select("id,status,total_amount")
        .gte("created_at", since.toISOString());
      return data ?? [];
    },
  });

  if (checking) return <div className="p-10">Loading…</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen">
        <AdminHeader />
        <main className="container mx-auto max-w-md px-4 py-20 text-center">
          <h1 className="font-display text-3xl">Admin access</h1>
          <p className="mt-2 text-muted-foreground">
            You're not an admin yet. The first user can claim admin to set up inventory.
          </p>
          <Button
            className="mt-6"
            onClick={async () => {
              try { await promote(); toast.success("You're now admin"); qc.invalidateQueries(); setIsAdmin(true); }
              catch (e) { toast.error((e as Error).message); }
            }}
          >
            Claim admin (first user only)
          </Button>
        </main>
      </div>
    );
  }

  const revenue = ordersToday.reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen">
      <AdminHeader />
      <main className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-4xl">Admin Dashboard</h1>
          <div className="flex gap-2">
            <Link to="/admin/inventory"><Button variant="outline">Inventory</Button></Link>
            <Link to="/admin/orders"><Button>Manage Orders</Button></Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Stat label="Orders today" value={ordersToday.length} />
          <Stat label="Revenue today" value={`$${revenue.toFixed(2)}`} />
          <Stat label="Low stock items" value={lowStock.length} accent={lowStock.length > 0} />
        </div>

        <Card className="mt-8">
          <CardContent className="p-5">
            <h2 className="font-display text-xl">Low stock alerts</h2>
            {lowStock.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">All inventory healthy.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {lowStock.map((i) => (
                  <li key={i.id} className="flex items-center justify-between rounded-md border p-3">
                    <span>{i.name} <span className="text-xs text-muted-foreground">({i.category})</span></span>
                    <Badge variant="destructive">{i.stock} / threshold {i.threshold}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className={`mt-1 font-display text-3xl ${accent ? "text-primary" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
