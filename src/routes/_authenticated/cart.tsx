import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cart, useCart } from "@/lib/cart-store";
import { placeOrder, createRazorpayOrder } from "@/lib/orders.functions";
import { toast } from "sonner";
import { Trash2, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/cart")({
  head: () => ({ meta: [{ title: "Cart — Forno" }] }),
  component: CartPage,
});

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function CartPage() {
  const nav = useNavigate();
  const items = useCart();
  const place = useServerFn(placeOrder);
  const createRzp = useServerFn(createRazorpayOrder);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
        if (p) {
          setName(p.full_name ?? "");
          setPhone(p.phone ?? "");
          setAddress(p.address ?? "");
        }
      }
    });
  }, []);

  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

  async function pay() {
    if (!name || !phone || !address) { toast.error("Fill in delivery info"); return; }
    if (items.length === 0) return;
    setPaying(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load Razorpay checkout");

      const rzpOrder = await createRzp({ data: { amount: Number(total.toFixed(2)) } });

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          order_id: rzpOrder.orderId,
          name: "Forno Pizza",
          description: "Hand-crafted pizza order",
          theme: { color: "#c0392b" },
          prefill: { name, contact: phone },
          handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await place({
                data: {
                  items: items.map((i) => ({
                    pizza_name: i.pizza_name,
                    base_id: i.base_id,
                    sauce_id: i.sauce_id,
                    cheese_id: i.cheese_id,
                    veggie_ids: i.veggie_ids,
                    meat_ids: i.meat_ids,
                    quantity: i.quantity,
                    price: i.price,
                  })),
                  delivery_address: address,
                  phone,
                  customer_name: name,
                  total_amount: Number(total.toFixed(2)),
                  razorpay_order_id: resp.razorpay_order_id,
                  razorpay_payment_id: resp.razorpay_payment_id,
                  razorpay_signature: resp.razorpay_signature,
                },
              });
              cart.clear();
              toast.success("Order placed! 🍕");
              nav({ to: "/orders" });
              resolve();
            } catch (err) {
              reject(err);
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled")),
          },
        });
        rzp.open();
      });
    } catch (e) {
      const msg = (e as Error).message;
      if (msg !== "Payment cancelled") toast.error(msg);
    } finally {
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[2fr_1fr]">
        <div>
          <h1 className="font-display text-4xl">Your Cart 🛒</h1>
          {items.length === 0 ? (
            <p className="mt-6 text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="mt-6 space-y-3">
              {items.map((i) => (
                <Card key={i.id} className="transition hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🍕</span>
                      <div>
                        <div className="font-medium">{i.pizza_name}</div>
                        <div className="text-sm text-muted-foreground">Qty: {i.quantity}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">${(Number(i.price) * i.quantity).toFixed(2)}</span>
                      <Button variant="ghost" size="icon" onClick={() => cart.remove(i.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card className="h-fit sticky top-20 border-primary/20">
          <CardContent className="space-y-4 p-5">
            <h2 className="font-display text-xl">Delivery & Payment</h2>
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
            <div className="flex justify-between border-t pt-3 font-semibold">
              <span>Total</span><span className="text-primary">${total.toFixed(2)}</span>
            </div>
            <Button className="w-full" disabled={paying || items.length === 0} onClick={pay}>
              <CreditCard className="mr-2 h-4 w-4" />
              {paying ? "Processing…" : "Pay with Razorpay"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Secure checkout powered by Razorpay. In test mode, use card 4111 1111 1111 1111.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
