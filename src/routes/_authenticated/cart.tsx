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
import { Trash2, CreditCard, Info, CheckCircle2, AlertCircle } from "lucide-react";

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

type PayStep = "idle" | "loading-sdk" | "creating-order" | "checkout" | "confirming" | "done" | "error";

function CartPage() {
  const nav = useNavigate();
  const items = useCart();
  const place = useServerFn(placeOrder);
  const createRzp = useServerFn(createRazorpayOrder);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [step, setStep] = useState<PayStep>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase
          .from("profiles").select("*").eq("id", data.user.id).maybeSingle();
        if (p) {
          setName((p as any).full_name ?? "");
          setPhone((p as any).phone ?? "");
          setAddress((p as any).address ?? "");
        }
      }
    });
  }, []);

  const total = items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const paying = step !== "idle" && step !== "error";

  const STEP_LABEL: Record<PayStep, string> = {
    "idle": "Pay with Razorpay",
    "loading-sdk": "Loading Razorpay…",
    "creating-order": "Creating order…",
    "checkout": "Complete payment in popup…",
    "confirming": "Confirming payment…",
    "done": "Order placed!",
    "error": "Try again",
  };

  async function pay() {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please fill in your name, phone, and delivery address.");
      return;
    }
    if (items.length === 0) return;
    if (total < 1) {
      toast.error("Order total must be at least ₹1.");
      return;
    }

    setErrorMsg("");
    setStep("loading-sdk");

    try {
      // Step 1: Load Razorpay JS SDK
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load Razorpay checkout script. Check your internet connection.");

      // Step 2: Create a Razorpay order on the server
      setStep("creating-order");
      let rzpOrder: { orderId: string; amount: number; currency: string; keyId: string };
      try {
        rzpOrder = await createRzp({ data: { amount: Number(total.toFixed(2)) } });
      } catch (e) {
        const msg = (e as Error).message ?? String(e);
        if (msg.includes("keys not configured") || msg.includes("RAZORPAY")) {
          throw new Error("Razorpay is not configured. Ask the admin to add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the Vercel environment variables.");
        }
        if (msg.includes("Unauthorized") || msg.includes("auth")) {
          throw new Error("Session expired. Please refresh the page and log in again.");
        }
        throw new Error(`Order creation failed: ${msg}`);
      }

      // Step 3: Open Razorpay checkout modal
      setStep("checkout");
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: rzpOrder.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          order_id: rzpOrder.orderId,
          name: "Forno Pizza",
          description: "Hand-crafted pizza order",
          theme: { color: "#c0392b" },
          prefill: { name: name.trim(), contact: phone.trim() },
          handler: async (resp: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            // Step 4: Verify payment & save order
            setStep("confirming");
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
                  delivery_address: address.trim(),
                  phone: phone.trim(),
                  customer_name: name.trim(),
                  total_amount: Number(total.toFixed(2)),
                  razorpay_order_id: resp.razorpay_order_id,
                  razorpay_payment_id: resp.razorpay_payment_id,
                  razorpay_signature: resp.razorpay_signature,
                },
              });
              cart.clear();
              setStep("done");
              toast.success("Order placed successfully! 🍕");
              nav({ to: "/orders" });
              resolve();
            } catch (err) {
              const msg = (err as Error).message ?? String(err);
              if (msg.includes("Payment verification failed")) {
                reject(new Error("Payment verified but signature check failed. Make sure RAZORPAY_KEY_SECRET in Vercel matches your Razorpay test secret exactly."));
              } else if (msg.includes("Razorpay not configured")) {
                reject(new Error("RAZORPAY_KEY_SECRET is missing in Vercel environment variables."));
              } else if (msg.includes("OUT_OF_STOCK")) {
                const item = msg.split("OUT_OF_STOCK:")[1]?.trim() ?? "an ingredient";
                reject(new Error(`"${item}" went out of stock. Please remove it from your order.`));
              } else {
                reject(new Error(`Order save failed: ${msg}`));
              }
            }
          },
          modal: {
            ondismiss: () => {
              setStep("idle");
              resolve(); // don't show error when user closes modal
            },
          },
        });
        rzp.open();
      });
    } catch (e) {
      const msg = (e as Error).message ?? "Something went wrong. Please try again.";
      setErrorMsg(msg);
      setStep("error");
      toast.error(msg, { duration: 8000 });
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[2fr_1fr]">

        {/* Cart items */}
        <div>
          <h1 className="font-display text-4xl">Your Cart</h1>
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
                      <span className="font-semibold">₹{(Number(i.price) * i.quantity).toFixed(2)}</span>
                      <Button variant="ghost" size="icon" onClick={() => cart.remove(i.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Test mode instructions */}
          <Card className="mt-6 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Info className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-sm">Razorpay Test Mode — use these details</span>
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                <TestRow label="Card number" value="4111 1111 1111 1111" />
                <TestRow label="Expiry" value="Any future date (e.g. 12/28)" />
                <TestRow label="CVV" value="Any 3 digits (e.g. 123)" />
                <TestRow label="OTP" value="1234 (when prompted)" />
                <TestRow label="UPI" value="success@razorpay" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkout panel */}
        <div className="space-y-4">
          <Card className="sticky top-20 border-primary/20">
            <CardContent className="space-y-4 p-5">
              <h2 className="font-display text-xl">Delivery & Payment</h2>

              <div>
                <Label>Full name</Label>
                <Input
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={paying}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  className="mt-1"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 00000 00000"
                  disabled={paying}
                />
              </div>
              <div>
                <Label>Delivery address</Label>
                <Input
                  className="mt-1"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full delivery address"
                  disabled={paying}
                />
              </div>

              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Total</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>

              {/* Step indicator */}
              {step !== "idle" && step !== "error" && (
                <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                  {STEP_LABEL[step]}
                </div>
              )}

              {/* Error box */}
              {step === "error" && errorMsg && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <Button
                className="w-full"
                disabled={paying || items.length === 0}
                onClick={pay}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {STEP_LABEL[step]}
              </Button>

              {step === "idle" && (
                <p className="text-center text-xs text-muted-foreground">
                  Secure checkout · Razorpay Test Mode
                </p>
              )}
            </CardContent>
          </Card>

          {/* What happens after payment */}
          <Card className="border-muted">
            <CardContent className="p-4 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Razorpay processes payment</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Signature verified server-side</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Order saved to database</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Track status in My Orders</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function TestRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <code className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono text-blue-800 dark:bg-blue-900 dark:text-blue-200">
        {value}
      </code>
    </div>
  );
}
