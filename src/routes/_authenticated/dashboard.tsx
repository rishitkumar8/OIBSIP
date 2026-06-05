import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cart } from "@/lib/cart-store";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Menu — Forno" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: varieties = [] } = useQuery({
    queryKey: ["varieties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pizza_varieties")
        .select("*")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl">Our Menu</h1>
            <p className="mt-1 text-muted-foreground">Pick a signature or build your own.</p>
          </div>
          <Link to="/build">
            <Button size="lg">Build your own</Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {varieties.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-secondary/40 to-primary/20" />
              <CardContent className="p-5">
                <h3 className="font-display text-xl">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold text-primary">${Number(p.base_price).toFixed(2)}</span>
                  <Button
                    size="sm"
                    onClick={() => {
                      cart.add({
                        pizza_name: p.name,
                        base_id: null,
                        sauce_id: null,
                        cheese_id: null,
                        veggie_ids: [],
                        meat_ids: [],
                        quantity: 1,
                        price: Number(p.base_price),
                      });
                      toast.success(`${p.name} added to cart`);
                    }}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
