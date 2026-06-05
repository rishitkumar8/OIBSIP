import { Link, useRouter } from "@tanstack/react-router";
import { ChefHat, LogOut, LayoutDashboard, ClipboardList, Boxes } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/admin/login" });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/admin" className="flex items-center gap-2">
          <ChefHat className="h-7 w-7 text-primary" />
          <span className="font-display text-xl font-bold">
            Forno <span className="text-primary">Admin</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/admin" className="flex items-center gap-1.5 text-sm hover:text-primary">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link to="/admin/orders" className="flex items-center gap-1.5 text-sm hover:text-primary">
            <ClipboardList className="h-4 w-4" /> Orders
          </Link>
          <Link to="/admin/inventory" className="flex items-center gap-1.5 text-sm hover:text-primary">
            <Boxes className="h-4 w-4" /> Inventory
          </Link>
        </nav>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="mr-1 h-4 w-4" /> Sign out
        </Button>
      </div>
    </header>
  );
}
