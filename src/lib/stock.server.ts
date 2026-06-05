// Server-only helpers. Never imported from client code.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ALERT_DEBOUNCE_HOURS = 24;

export async function checkLowStockAndNotify() {
  const { data: lowItems } = await supabaseAdmin
    .from("inventory_items")
    .select("id, name, category, stock, threshold")
    .eq("active", true);

  const below = (lowItems ?? []).filter((i) => i.stock < i.threshold);
  if (below.length === 0) return;

  // Debounce: skip items alerted in the last N hours
  const since = new Date(Date.now() - ALERT_DEBOUNCE_HOURS * 3600 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from("stock_alerts")
    .select("item_id")
    .gte("sent_at", since);
  const recentSet = new Set((recent ?? []).map((r) => r.item_id));
  const toAlert = below.filter((i) => !recentSet.has(i.id));
  if (toAlert.length === 0) return;

  // Find admin emails
  const { data: adminRoles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  const adminIds = (adminRoles ?? []).map((r) => r.user_id);
  if (adminIds.length === 0) {
    console.warn("[stock] No admins to email about low stock");
    return;
  }
  const { data: adminProfiles } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .in("id", adminIds);
  const adminEmails = (adminProfiles ?? []).map((p) => p.email).filter(Boolean) as string[];

  // Log alerts now (we treat this as the "send")
  await supabaseAdmin.from("stock_alerts").insert(
    toAlert.map((i) => ({ item_id: i.id })),
  );

  // Best-effort email via Lovable AI gateway / log to console as fallback
  const summary = toAlert
    .map((i) => `• ${i.name} (${i.category}): ${i.stock} left (threshold ${i.threshold})`)
    .join("\n");
  console.warn(
    `[STOCK ALERT] Notifying ${adminEmails.join(", ")} about low stock:\n${summary}`,
  );
  // NOTE: Wire a real email provider (Lovable Emails / Resend) here.
  // The alert is recorded in stock_alerts so admin dashboard can show it.
}
