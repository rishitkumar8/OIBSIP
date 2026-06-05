import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const cartItemSchema = z.object({
  pizza_name: z.string().min(1).max(100),
  base_id: z.string().uuid().nullable(),
  sauce_id: z.string().uuid().nullable(),
  cheese_id: z.string().uuid().nullable(),
  veggie_ids: z.array(z.string().uuid()).max(20),
  meat_ids: z.array(z.string().uuid()).max(10),
  quantity: z.number().int().min(1).max(10),
  price: z.number().min(0).max(1000),
});

// ---- Razorpay: create an order on Razorpay ----
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ amount: z.number().min(1).max(1_000_000) }))
  .handler(async ({ data }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay keys not configured");

    const basic = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const amountPaise = Math.round(data.amount * 100);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        payment_capture: 1,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Razorpay order failed: ${t}`);
    }
    const order = (await res.json()) as { id: string; amount: number; currency: string };
    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId };
  });

// ---- Place order: verifies Razorpay signature, then writes order + items ----
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      items: z.array(cartItemSchema).min(1).max(20),
      delivery_address: z.string().min(5).max(500),
      phone: z.string().min(5).max(30),
      customer_name: z.string().min(1).max(100),
      total_amount: z.number().min(0.01).max(10000),
      razorpay_order_id: z.string().min(1).max(100),
      razorpay_payment_id: z.string().min(1).max(100),
      razorpay_signature: z.string().min(1).max(200),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay not configured");
    const { createHmac, timingSafeEqual } = await import("crypto");
    const expected = createHmac("sha256", secret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(data.razorpay_signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Payment verification failed");
    }

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: data.total_amount,
        delivery_address: data.delivery_address,
        phone: data.phone,
        customer_name: data.customer_name,
        payment_id: data.razorpay_payment_id,
        status: "received",
      })
      .select()
      .single();

    if (orderErr || !order) throw new Error(orderErr?.message || "Failed to create order");

    const itemRows = data.items.map((i) => ({ ...i, order_id: order.id }));
    const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
    if (itemsErr) {
      // Surface friendly stock errors
      const msg = itemsErr.message || "";
      if (msg.includes("OUT_OF_STOCK")) {
        const name = msg.split("OUT_OF_STOCK:")[1]?.trim() ?? "an item";
        // Rollback order
        await supabase.from("orders").delete().eq("id", order.id);
        throw new Error(`Sorry, "${name}" is running low and can't be ordered right now.`);
      }
      throw new Error(itemsErr.message);
    }

    try {
      const { checkLowStockAndNotify } = await import("./stock.server");
      await checkLowStockAndNotify();
    } catch (e) {
      console.error("stock notify failed", e);
    }

    return { orderId: order.id };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      orderId: z.string().uuid(),
      status: z.enum(["received", "in_kitchen", "sent_to_delivery", "delivered"]),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    // When marking delivered, hide from admin list but keep in user history.
    const patch =
      data.status === "delivered"
        ? { status: data.status, archived_for_admin: true }
        : { status: data.status };

    const { error } = await supabase.from("orders").update(patch).eq("id", data.orderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data ?? []).map((r) => r.role);
    return { roles, isAdmin: roles.includes("admin") };
  });

export const promoteSelfToAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) {
      const { data: existing } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!existing) throw new Error("Admin already exists. Ask an admin to grant you access.");
    }
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: context.userId, role: "admin" }, { onConflict: "user_id,role" });
    return { ok: true };
  });
