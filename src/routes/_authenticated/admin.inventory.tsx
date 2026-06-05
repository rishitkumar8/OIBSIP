import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Minus, PackagePlus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Forno Admin" }] }),
  component: Inventory,
});

const CATS = ["base", "sauce", "cheese", "veggie", "meat"] as const;
type Cat = (typeof CATS)[number];
type Item = {
  id: string; name: string; category: Cat;
  stock: number; threshold: number; price: number; active: boolean;
};

function Inventory() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["all-inventory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("inventory_items").select("*").order("category").order("name");
      return (data ?? []) as Item[];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("inv-stream")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "inventory_items" },
        () => qc.invalidateQueries({ queryKey: ["all-inventory"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  async function update(id: string, patch: Partial<Item>) {
    const { error } = await supabase.from("inventory_items").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["all-inventory"] }); }
  }

  async function adjustStock(id: string, current: number, delta: number) {
    const next = Math.max(0, current + delta);
    await update(id, { stock: next });
  }

  async function remove(id: string) {
    if (!confirm("Remove this ingredient?")) return;
    const { error } = await supabase.from("inventory_items").update({ active: false }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["all-inventory"] }); }
  }

  const totals = CATS.map((c) => ({
    c, count: items.filter((i) => i.category === c && i.active).length,
    low: items.filter((i) => i.category === c && i.active && i.stock < i.threshold).length,
  }));

  return (
    <div className="min-h-screen">
      <AdminHeader />
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">Inventory</h1>
            <p className="text-sm text-muted-foreground">
              Track and restock pizza base, sauces, cheese, veggies and meats. Updates appear live.
            </p>
          </div>
          <AddItemDialog onCreated={() => qc.invalidateQueries({ queryKey: ["all-inventory"] })} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {totals.map((t) => (
            <Card key={t.c}>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-muted-foreground">{t.c}</div>
                <div className="font-display text-2xl">{t.count}</div>
                {t.low > 0 && <div className="mt-1 text-xs text-primary">{t.low} low</div>}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="base" className="mt-6">
          <TabsList>
            {CATS.map((c) => (
              <TabsTrigger key={c} value={c} className="capitalize">{c}</TabsTrigger>
            ))}
          </TabsList>
          {CATS.map((c) => {
            const rows = items.filter((i) => i.category === c && i.active);
            return (
              <TabsContent key={c} value={c} className="mt-4 space-y-3">
                {rows.length === 0 && (
                  <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
                    No {c} items yet. Click "Add ingredient" to create one.
                  </CardContent></Card>
                )}
                {rows.map((i) => (
                  <Card key={i.id}>
                    <CardContent className="grid grid-cols-1 gap-3 p-4 md:grid-cols-[1.6fr_1.4fr_1fr_1fr_auto_auto] md:items-end">
                      <div>
                        <div className="text-xs text-muted-foreground">Name</div>
                        <div className="font-medium">{i.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Stock</div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-9 w-9"
                            onClick={() => adjustStock(i.id, i.stock, -1)}>
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={i.stock}
                            onChange={(e) => update(i.id, { stock: Number(e.target.value) })}
                            className="h-9 w-20 text-center"
                          />
                          <Button size="icon" variant="outline" className="h-9 w-9"
                            onClick={() => adjustStock(i.id, i.stock, 1)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="secondary" className="ml-1"
                            onClick={() => adjustStock(i.id, i.stock, 10)}>
                            +10
                          </Button>
                        </div>
                      </div>
                      <NumberField label="Threshold" value={i.threshold}
                        onSave={(v) => update(i.id, { threshold: v })} />
                      <NumberField label="Price" value={i.price} step="0.01"
                        onSave={(v) => update(i.id, { price: v })} />
                      <div className={`rounded-full px-3 py-1 text-center text-xs ${
                        i.stock < i.threshold
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {i.stock < i.threshold ? "LOW" : "OK"}
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => remove(i.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
    </div>
  );
}

function NumberField({
  label, value, step = "1", onSave,
}: { label: string; value: number; step?: string; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="flex gap-1">
        <Input type="number" step={step} value={v}
          onChange={(e) => setV(e.target.value)} className="h-9" />
        <Button size="sm" variant="outline" onClick={() => onSave(Number(v))}>Save</Button>
      </div>
    </div>
  );
}

function AddItemDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Cat>("veggie");
  const [stock, setStock] = useState("5");
  const [threshold, setThreshold] = useState("3");
  const [price, setPrice] = useState("0");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    const { error } = await supabase.from("inventory_items").insert({
      name: name.trim(), category,
      stock: Number(stock), threshold: Number(threshold), price: Number(price),
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Ingredient added");
    setOpen(false); setName(""); setStock("5"); setThreshold("3"); setPrice("0");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PackagePlus className="mr-2 h-4 w-4" /> Add ingredient</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add new ingredient</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Jalapeño" />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Cat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATS.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Stock</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
            <div><Label>Threshold</Label>
              <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></div>
            <div><Label>Price</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={create} disabled={saving}>{saving ? "Adding…" : "Add ingredient"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
