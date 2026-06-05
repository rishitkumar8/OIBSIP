import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { promoteSelfToAdmin } from "@/lib/orders.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/signup")({
  head: () => ({ meta: [{ title: "Admin sign-up — Forno" }] }),
  component: AdminSignup,
});

function AdminSignup() {
  const navigate = useNavigate();
  const promote = useServerFn(promoteSelfToAdmin);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/admin`,
        data: { full_name: fullName },
      },
    });
    if (error || !data.user) {
      setLoading(false);
      toast.error(error?.message ?? "Sign-up failed");
      return;
    }

    // If email confirmation is required, no session yet.
    if (!data.session) {
      setLoading(false);
      toast.success("Check your email to confirm, then sign in as admin.");
      navigate({ to: "/admin/login", replace: true });
      return;
    }

    try {
      await promote();
      toast.success("Admin account created!");
      navigate({ to: "/admin", replace: true });
    } catch (err) {
      toast.error((err as Error).message);
      navigate({ to: "/admin/login", replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-secondary/30 via-background to-primary/10 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        {["🍕", "🧀", "🍅", "🌿", "🌶️", "🍕"].map((e, i) => (
          <span
            key={i}
            className="absolute animate-float text-5xl"
            style={{ left: `${(i * 17) % 90}%`, top: `${(i * 23) % 80}%`, animationDelay: `${i * 0.7}s` }}
          >
            {e}
          </span>
        ))}
      </div>
      <Card className="relative w-full max-w-md border-primary/30 shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="font-display text-3xl">Admin Sign-up</CardTitle>
          <p className="text-sm text-muted-foreground">
            First admin claims access automatically. Additional admins must be granted by an existing admin.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Full name</Label>
              <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label>Admin email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account…" : "Create Admin Account"}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/admin/login" className="text-primary hover:underline">
              Admin sign-in
            </Link>
            <Link to="/auth" className="text-muted-foreground hover:underline">
              User sign-in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
