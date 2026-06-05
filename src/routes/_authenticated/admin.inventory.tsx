import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminHeader } from "@/components/AdminHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Minus, PackagePlus, EyeOff, Eye, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory — Forno Admin" }] }),
  component: Inventory,
});

const CATS = ["base", "sauce", "cheese", "veggie", "meat"] as const;
const CAT_LABELS: Record<string, string> = {
  base: "Pizza Bases",
  sauce: "Sauces",
  cheese: "Cheese",
  veggie: "Veggies",
  meat: "Meats",
};

type Cat = (typeof CATS)[number];
type Item = {
  id: string; name: string; category: Cat;
  stock: number; threshold: number; price: number; active: boolean;
};

function stockStatus(i: Item): { label: string; cls: string } {
  if (!i.active) return { label: "Inactive", cls: "bg-muted text-muted-foreground" };
  if (i.stock === 0) return { label: "Out of Stock", cls: "bg-destructive/15 text-destructive font-semibold" };
  if (i.stock < i.threshold) return { label: "Low Stock", cls: "bg-amber-500/15 text-amber-600 font-semibold" };
  return { label: "In Stock", cls: "bg-green-500/15 text-green-600" };
}

function Inventory() {
  const qc = useQueryClient();
  const [showInactive, setShowInactive] = useState(false);

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
    else qc.invalidateQueries({ queryKey: ["all-inventory"] });
  }

  async function adjustStock(id: string, current: number, delta: number) {
    const next = Math.max(0, current + delta);
    await update(id, { stock: next });
    if (delta > 0) toast.success(`Stocked +${delta} units`);
    else if (delta < 0) toast.success(`Removed ${Math.abs(delta)} units`);
  }

  async function markOutOfStock(id: string) {
    await update(id, { stock: 0 });
    toast.success("Marked as out of stock");
  }

  async function toggleActive(id: string, current: boolean) {
    await update(id, { active: !current });
    toast.success(current ? "Item deactivated from menu" : "Item activated on menu");
  }

  const activeItems = items.filter((i) => i.active);
  const inactiveItems = items.filter((i) => !i.active);

  const totals = CATS.map((c) => {
    const catItems = activeItems.filter((i) => i.category === c);
    return {
      c,
      total: catItems.length,
      out: catItems.filter((i) => i.stock === 0).length,
      low: catItems.filter((i) => i.stock > 0 && i.stock < i.threshold).length,
    };
  });

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminHeader />
      <main className="container mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">Inventory Management</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage pizza bases, sauces, cheese, veggies, and meats. All changes apply live.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowInactive((v) => !v)}>
              {showInactive ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
              {showInactive ? "Hide inactive" : `Show inactive (${inactiveItems.length})`}
            </Button>
            <AddItemDialog onCreated={() => qc.invalidateQueries({ queryKey: ["all-inventory"] })} />
          </div>
        </div>

        {/* Category summary */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {totals.map((t) => (
            <Card key={t.c} className={t.out > 0 ? "border-destructive/40" : t.low > 0 ? "border-amber-400/40" : ""}>
              <CardContent className="p-4">
                <div className="text-xs font-medium uppercase text-muted-foreground">{t.c}</div>
                <div className="mt-1 font-display text-2xl">{t.total}</div>
                <div className="mt-1 space-y-0.5 text-xs">
                  {t.out > 0 && <div className="text-destructive">{t.out} out of stock</div>}
                  {t.low > 0 && <div className="text-amber-600">{t.low} running low</div>}
                  {t.out === 0 && t.low === 0 && t.total > 0 && <div className="text-green-600">All stocked</div>}
                  {t.total === 0 && <div className="text-muted-foreground">No items</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="base" className="mt-6">
          <TabsList className="flex-wrap h-auto gap-1">
            {CATS.map((c) => {
              const t = totals.find((x) => x.c === c)!;
              return (
                <TabsTrigger key={c} value={c} className="gap-1.5">
                  {CAT_LABELS[c]}
                  {t.out > 0 && <span className="h-2 w-2 rounded-full bg-destructive" />}
                  {t.out === 0 && t.low > 0 && <span className="h-2 w-2 rounded-full bg-amber-500" />}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CATS.map((c) => {
            const rows = items.filter(
              (i) => i.category === c && (showInactive ? true : i.active),
            );
            return (
              <TabsContent key={c} value={c} className="mt-4 space-y-3">
                {rows.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      No {CAT_LABELS[c].toLowerCase()} yet. Click "Add ingredient" to create one.
                    </CardContent>
                  </Card>
                )}

                {rows.map((i) => {
                  const status = stockStatus(i);
                  return (
                    <Card key={i.id} className={!i.active ? "opacity-60" : ""}>
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          {/* Name + status */}
                          <div className="min-w-[140px]">
                            <div className="font-semibold">{i.name}</div>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs ${status.cls}`}>
                              {status.label}
                            </span>
                          </div>

                          {/* Stock controls */}
                          <div>
                            <div className="mb-1 text-xs text-muted-foreground">Stock (units)</div>
                            <div className="flex items-center gap-1">
                              <Button size="icon" variant="outline" className="h-8 w-8"
                                onClick={() => adjustStock(i.id, i.stock, -1)}
                                disabled={!i.active || i.stock === 0}
                                title="Remove 1 unit">
                                <Minus className="h-3.5 w-3.5" />
                              </Button>
                              <Input
                                type="number"
                                value={i.stock}
                                min={0}
                                onChange={(e) => {
                                  const v = Math.max(0, Number(e.target.value));
                                  update(i.id, { stock: v });
                                }}
                                className="h-8 w-16 text-center text-sm"
                                disabled={!i.active}
                              />
                              <Button size="icon" variant="outline" className="h-8 w-8"
                                onClick={() => adjustStock(i.id, i.stock, 1)}
                                disabled={!i.active}
                                title="Add 1 unit">
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="secondary" className="h-8 text-xs"
                                onClick={() => adjustStock(i.id, i.stock, 10)}
                                disabled={!i.active}
                                title="Stock +10">
                                +10
                              </Button>
                            </div>
                          </div>

                          {/* Threshold + Price */}
                          <NumberField
                            label="Low threshold"
                            value={i.threshold}
                            onSave={(v) => update(i.id, { threshold: v })}
                            disabled={!i.active}
                          />
                          <NumberField
                            label="Price (₹)"
                            value={i.price}
                            step="0.01"
                            onSave={(v) => update(i.id, { price: v })}
                            disabled={!i.active}
                          />

                          {/* Action buttons */}
                          <div className="flex gap-2">
                            {i.active && i.stock > 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs h-8"
                                onClick={() => markOutOfStock(i.id)}
                                title="Set stock to 0">
                                Mark out of stock
                              </Button>
                            )}
                            {i.active && i.stock === 0 && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-500/40 text-green-600 hover:bg-green-500/10 text-xs h-8"
                                onClick={() => adjustStock(i.id, 0, 10)}
                                title="Quick restock +10">
                                <RefreshCw className="mr-1 h-3 w-3" /> Restock
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant={i.active ? "ghost" : "outline"}
                              className={`text-xs h-8 ${i.active ? "text-muted-foreground hover:text-foreground" : "text-green-600 border-green-500/40 hover:bg-green-500/10"}`}
                              onClick={() => toggleActive(i.id, i.active)}
                              title={i.active ? "Deactivate from menu" : "Reactivate on menu"}>
                              {i.active ? (
                                <><EyeOff className="mr-1 h-3 w-3" /> Deactivate</>
                              ) : (
                                <><Eye className="mr-1 h-3 w-3" /> Activate</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
    </div>
  );
}

function NumberField({
  label, value, step = "1", onSave, disabled,
}: { label: string; value: number; step?: string; onSave: (v: number) => void; disabled?: boolean }) {
  const [v, setV] = useState(String(value));
  useEffect(() => setV(String(value)), [value]);
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="flex gap-1">
        <Input
          type="number" step={step} value={v}
          onChange={(e) => setV(e.target.value)}
          className="h-8 w-24 text-sm"
          disabled={disabled}
        />
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onSave(Number(v))} disabled={disabled}>
          Save
        </Button>
      </div>
    </div>
  );
}

function AddItemDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Cat>("veggie");
  const [stock, setStock] = useState("10");
  const [threshold, setThreshold] = useState("3");
  const [price, setPrice] = useState("0");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) return toast.error("Name is required");
    setSaving(true);
    const { error } = await supabase.from("inventory_items").insert({
      name: name.trim(), category,
      stock: Number(stock), threshold: Number(threshold), price: Number(price),
      active: true,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${name.trim()} added to inventory`);
    setOpen(false); setName(""); setStock("10"); setThreshold("3"); setPrice("0");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PackagePlus className="mr-2 h-4 w-4" /> Add ingredient</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add new ingredient</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jalapeño"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Cat)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATS.map((c) => (
                  <SelectItem key={c} value={c}>{CAT_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Initial stock</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Low threshold</Label>
              <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Price (₹)</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            The "low threshold" is the minimum stock level before an alert is shown.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={create} disabled={saving} className="w-full">
            {saving ? "Adding…" : "Add to inventory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
