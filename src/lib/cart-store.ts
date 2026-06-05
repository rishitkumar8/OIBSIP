// Simple in-memory + localStorage cart store with subscription.
import { useEffect, useState } from "react";

export type CartItem = {
  id: string; // local cart line id
  pizza_name: string;
  base_id: string | null;
  sauce_id: string | null;
  cheese_id: string | null;
  veggie_ids: string[];
  meat_ids: string[];
  quantity: number;
  price: number;
};

const KEY = "pizza_cart_v1";
let items: CartItem[] = [];
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    items = raw ? JSON.parse(raw) : [];
  } catch {
    items = [];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

let loaded = false;
function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    load();
    loaded = true;
  }
}

export const cart = {
  get(): CartItem[] {
    ensureLoaded();
    return items;
  },
  add(item: Omit<CartItem, "id">) {
    ensureLoaded();
    items = [...items, { ...item, id: crypto.randomUUID() }];
    persist();
  },
  remove(id: string) {
    ensureLoaded();
    items = items.filter((i) => i.id !== id);
    persist();
  },
  clear() {
    items = [];
    persist();
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function useCart() {
  const [, force] = useState(0);
  useEffect(() => cart.subscribe(() => force((n) => n + 1)) as unknown as () => void, []);
  return cart.get();
}
