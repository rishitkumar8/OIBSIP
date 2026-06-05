import { createFileRoute, Link } from "@tanstack/react-router";
import heroPizza from "@/assets/hero-pizza.jpg";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/Header";
import { Pizza, Sparkles, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Forno — Artisan Pizza, Delivered" },
      { name: "description", content: "Build your custom pizza from scratch or choose from our signature varieties." },
      { property: "og:title", content: "Forno — Artisan Pizza" },
      { property: "og:description", content: "Build your custom pizza, delivered hot." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <section className="relative overflow-hidden">
        <div className="container mx-auto grid gap-12 px-4 py-16 md:grid-cols-2 md:py-24 md:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary/30 px-3 py-1 text-xs font-medium text-foreground">
              <Sparkles className="h-3 w-3" /> Hand-crafted, fired hot
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] md:text-7xl">
              Pizza, your way.
              <span className="block text-primary">Delivered fast.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              Choose a signature or build your own — pick your base, sauce, cheese, and toppings.
              We fire it, we deliver it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="text-base">Start ordering</Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-base">Sign in</Button>
              </Link>
            </div>
            <div className="mt-12 flex gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 30-min delivery</div>
              <div className="flex items-center gap-2"><Pizza className="h-4 w-4 text-primary" /> Fresh daily</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-secondary/20 blur-3xl" />
            <img
              src={heroPizza}
              alt="Artisan margherita pizza with fresh basil and cherry tomatoes"
              width={1536}
              height={1024}
              className="relative rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
