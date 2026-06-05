import { Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pizza, ShoppingCart, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";

export function Header() {
  const router = useRouter();
  const cart = useCart();
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setEmail(data.user?.email ?? null);
      if (data.user) {
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle()
          .then(({ data }) => mounted && setIsAdmin(!!data));
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Pizza className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold">Forno</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {email && (
            <>
              <Link to="/dashboard" className="text-sm hover:text-primary">Menu</Link>
              <Link to="/build" className="text-sm hover:text-primary">Build a Pizza</Link>
              <Link to="/orders" className="text-sm hover:text-primary">My Orders</Link>
              {isAdmin && (
                <Link to="/admin" className="text-sm font-semibold text-primary hover:underline">
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {email ? (
            <>
              <Link to="/cart">
                <Button variant="outline" size="sm" className="relative">
                  <ShoppingCart className="h-4 w-4" />
                  {cart.length > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {cart.length}
                    </span>
                  )}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
