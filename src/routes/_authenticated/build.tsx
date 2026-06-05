import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cart } from "@/lib/cart-store";
import { toast } from "sonner";
import { Check, AlertTriangle } from "lucide-react";
import { PizzaPlate } from "@/components/PizzaPlate";

export const Route = createFileRoute("/_authenticated/build")({
  head: () => ({ meta: [{ title: "Build your pizza — Forno" }] }),
  component: Build,
});

type Item = { id: string; name: string; category: "base" | "sauce" | "cheese" | "veggie" | "meat"; price: number; stock: number };

const STEPS = ["base", "sauce", "cheese", "toppings"] as const;

function Build() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [base, setBase] = useState<Item | null>(null);
  const [sauce, setSauce] = useState<Item | null>(null);
  const [cheese, setCheese] = useState<Item | null>(null);
  const [veggies, setVeggies] = useState<Item[]>([]);
  const [meats, setMeats] = useState<Item[]>([]);

  const { data: inv = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("id,name,category,price,stock")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data as Item[];
    },
  });

  // Items with stock <= 3 are considered too low to order (would breach the floor).
  const isLow = (i: Item) => i.stock <= 3;

  const bases = inv.filter((i) => i.category === "base");
  const sauces = inv.filter((i) => i.category === "sauce");
  const cheeses = inv.filter((i) => i.category === "cheese");
  const vList = inv.filter((i) => i.category === "veggie");
  const mList = inv.filter((i) => i.category === "meat");

  const total =
    (base?.price ?? 0) +
    (sauce?.price ?? 0) +
    (cheese?.price ?? 0) +
    veggies.reduce((s, v) => s + Number(v.price), 0) +
    meats.reduce((s, v) => s + Number(v.price), 0) +
    5; // build fee

  function toggle<T extends Item>(list: T[], item: T, set: (l: T[]) => void) {
    if (isLow(item) && !list.find((x) => x.id === item.id)) {
      toast.error(`${item.name} is running low and can't be added.`);
      return;
    }
    set(list.find((x) => x.id === item.id) ? list.filter((x) => x.id !== item.id) : [...list, item]);
  }
  function pickSingle(item: Item, set: (v: Item) => void) {
    if (isLow(item)) {
      toast.error(`${item.name} is running low and can't be selected.`);
      return;
    }
    set(item);
  }

  function addToCart() {
    if (!base || !sauce || !cheese) { toast.error("Pick base, sauce, and cheese"); return; }
    cart.add({
      pizza_name: `Custom (${base.name} + ${sauce.name} + ${cheese.name})`,
      base_id: base.id,
      sauce_id: sauce.id,
      cheese_id: cheese.id,
      veggie_ids: veggies.map((v) => v.id),
      meat_ids: meats.map((m) => m.id),
      quantity: 1,
      price: Number(total.toFixed(2)),
    });
    toast.success("Custom pizza added to cart 🍕");
    nav({ to: "/cart" });
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <h1 className="font-display text-4xl">Build your pizza 🍕</h1>
        <p className="mt-2 text-muted-foreground">Watch your pizza come together as you build it.</p>

        <div className="mt-6 flex gap-2">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              className={`flex-1 rounded-full py-2 text-center text-sm capitalize transition ${
                i === step ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : i < step ? "bg-secondary" : "bg-muted hover:bg-muted/70"
              }`}>{s}</button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            {step === 0 && (
              <Section title="Choose your base" items={bases} selected={base ? [base] : []}
                onPick={(i) => pickSingle(i, setBase)} lowFn={isLow} />
            )}
            {step === 1 && (
              <Section title="Choose your sauce" items={sauces} selected={sauce ? [sauce] : []}
                onPick={(i) => pickSingle(i, setSauce)} lowFn={isLow} />
            )}
            {step === 2 && (
              <Section title="Choose cheese" items={cheeses} selected={cheese ? [cheese] : []}
                onPick={(i) => pickSingle(i, setCheese)} lowFn={isLow} />
            )}
            {step === 3 && (
              <>
                <Section title="Add veggies" items={vList} selected={veggies} multi
                  onPick={(i) => toggle(veggies, i, setVeggies)} lowFn={isLow} />
                <div className="mt-6">
                  <Section title="Add meats (optional)" items={mList} selected={meats} multi
                    onPick={(i) => toggle(meats, i, setMeats)} lowFn={isLow} />
                </div>
              </>
            )}

            <div className="mt-8 flex justify-between">
              <Button variant="outline" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Button>
              {step < 3 ? (
                <Button
                  disabled={(step === 0 && !base) || (step === 1 && !sauce) || (step === 2 && !cheese)}
                  onClick={() => setStep(step + 1)}
                >Next</Button>
              ) : (
                <Button onClick={addToCart} className="shadow-lg">Add to cart — ${total.toFixed(2)}</Button>
              )}
            </div>
          </div>

          <div className="lg:sticky lg:top-20 h-fit">
            <Card className="border-primary/20 bg-gradient-to-b from-background to-secondary/10">
              <CardContent className="p-5">
                <PizzaPlate base={base} sauce={sauce} cheese={cheese} veggies={veggies} meats={meats} />
                <h3 className="mt-4 font-display text-xl">Your pizza</h3>
                <ul className="mt-3 space-y-1 text-sm">
                  <Line label="Base" value={base?.name} price={base?.price} />
                  <Line label="Sauce" value={sauce?.name} price={sauce?.price} />
                  <Line label="Cheese" value={cheese?.name} price={cheese?.price} />
                  {veggies.length > 0 && <Line label="Veggies" value={veggies.map((v) => v.name).join(", ")} price={veggies.reduce((s, v) => s + Number(v.price), 0)} />}
                  {meats.length > 0 && <Line label="Meats" value={meats.map((m) => m.name).join(", ")} price={meats.reduce((s, v) => s + Number(v.price), 0)} />}
                  <Line label="Build fee" value="—" price={5} />
                </ul>
                <div className="mt-4 flex justify-between border-t pt-3 font-semibold">
                  <span>Total</span><span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function Line({ label, value, price }: { label: string; value?: string; price?: number }) {
  return (
    <li className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}: {value ?? "—"}</span>
      <span>{price ? `$${Number(price).toFixed(2)}` : ""}</span>
    </li>
  );
}

function Section({ title, items, selected, onPick, multi, lowFn }: {
  title: string; items: Item[]; selected: Item[]; onPick: (i: Item) => void; multi?: boolean; lowFn: (i: Item) => boolean;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {items.map((i) => {
          const sel = selected.some((s) => s.id === i.id);
          const low = lowFn(i);
          return (
            <button
              key={i.id}
              onClick={() => onPick(i)}
              disabled={low && !sel}
              className={`group relative rounded-xl border-2 p-4 text-left transition hover-scale ${
                sel ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                : low ? "border-dashed border-muted bg-muted/30 cursor-not-allowed opacity-60"
                : "border-border hover:border-primary/50 hover:shadow-md"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{i.name}</span>
                {sel && <Check className="h-4 w-4 text-primary" />}
                {low && !sel && <AlertTriangle className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                +${Number(i.price).toFixed(2)}
                {low && <span className="ml-2 text-xs text-destructive">Out of stock</span>}
              </div>
            </button>
          );
        })}
      </div>
      {multi && <p className="mt-2 text-xs text-muted-foreground">Tap to toggle.</p>}
    </div>
  );
}
