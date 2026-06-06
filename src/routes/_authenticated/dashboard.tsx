import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cart } from "@/lib/cart-store";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import heroPizza from "@/assets/hero-pizza.jpg";

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
          {varieties.map((p) => {
            const image = getPizzaImage(p.name, p.image_url);

            return (
              <Card key={p.id} className="overflow-hidden">
                <div className="relative h-44 overflow-hidden bg-muted">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-5">
                  <h3 className="font-display text-xl">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-semibold text-primary">₹{Number(p.base_price).toFixed(2)}</span>
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
            );
          })}
        </div>
      </main>
    </div>
  );
}

function getPizzaImage(name: string, imageUrl: string | null) {
  if (imageUrl) {
    return {
      src: imageUrl,
      alt: `${name} pizza`,
    };
  }

  const key = name.toLowerCase();
  const matches = [
    {
      test: ["margherita", "margarita", "basil"],
      src: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=80",
      alt: "Margherita pizza with tomato sauce, mozzarella, and basil",
    },
    {
      test: ["pepperoni", "salami"],
      src: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=900&q=80",
      alt: "Pepperoni pizza with melted cheese",
    },
    {
      test: ["veggie", "vegetarian", "garden"],
      src: "https://images.unsplash.com/photo-1604917877934-07d8d248d396?auto=format&fit=crop&w=900&q=80",
      alt: "Vegetable pizza with peppers, tomatoes, and olives",
    },
    {
      test: ["bbq", "barbecue", "chicken"],
      src: "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=80",
      alt: "Barbecue chicken pizza with cheese and herbs",
    },
    {
      test: ["cheese", "mozzarella", "four cheese"],
      src: "https://images.unsplash.com/photo-1548369937-47519962c11a?auto=format&fit=crop&w=900&q=80",
      alt: "Cheese pizza with golden melted mozzarella",
    },
    {
      test: ["hawaiian", "pineapple"],
      src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=80",
      alt: "Hawaiian pizza with pineapple and ham",
    },
    {
      test: ["meat", "sausage", "supreme"],
      src: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?auto=format&fit=crop&w=900&q=80",
      alt: "Loaded meat pizza with sausage and vegetables",
    },
  ];

  const match = matches.find((item) => item.test.some((term) => key.includes(term)));

  return match ?? {
    src: heroPizza,
    alt: "Artisan pizza with fresh toppings",
  };
}
