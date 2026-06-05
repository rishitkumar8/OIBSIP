// Animated, SVG-based pizza plate that builds up as the user picks ingredients.
import { useMemo } from "react";

type Cat = "base" | "sauce" | "cheese" | "veggie" | "meat";
type Pick = { id: string; name: string; category: Cat };

export function PizzaPlate({
  base, sauce, cheese, veggies, meats,
}: {
  base: Pick | null;
  sauce: Pick | null;
  cheese: Pick | null;
  veggies: Pick[];
  meats: Pick[];
}) {
  // Stable scattered positions per topping id
  const toppingDots = useMemo(() => {
    const items = [
      ...veggies.map((v) => ({ ...v, color: veggieColor(v.name) })),
      ...meats.map((m) => ({ ...m, color: meatColor(m.name) })),
    ];
    return items.flatMap((it) =>
      Array.from({ length: 6 }, (_, i) => {
        const seed = hash(it.id + i);
        const r = 28 + (seed % 38);
        const theta = (seed * 137.5) * (Math.PI / 180);
        return {
          key: `${it.id}-${i}`,
          x: 100 + r * Math.cos(theta),
          y: 100 + r * Math.sin(theta),
          color: it.color,
          size: 4 + (seed % 4),
        };
      }),
    );
  }, [veggies, meats]);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[360px]">
      {/* Plate shadow */}
      <div className="absolute inset-4 rounded-full bg-foreground/10 blur-2xl" />
      <svg viewBox="0 0 200 200" className="relative h-full w-full drop-shadow-xl">
        {/* Plate */}
        <circle cx="100" cy="100" r="98" fill="hsl(36 30% 92%)" stroke="hsl(30 20% 70%)" strokeWidth="1" />
        <circle cx="100" cy="100" r="92" fill="hsl(36 40% 96%)" />

        {/* Base */}
        {base && (
          <g className="origin-center animate-scale-in">
            <circle cx="100" cy="100" r="80" fill={baseColor(base.name)} stroke="hsl(28 50% 35%)" strokeWidth="2" />
            <circle cx="100" cy="100" r="72" fill={baseInner(base.name)} />
            {/* crust bumps */}
            {Array.from({ length: 18 }).map((_, i) => {
              const a = (i / 18) * Math.PI * 2;
              return (
                <circle key={i} cx={100 + 78 * Math.cos(a)} cy={100 + 78 * Math.sin(a)}
                  r="3" fill="hsl(28 60% 55%)" opacity="0.6" />
              );
            })}
          </g>
        )}

        {/* Sauce */}
        {base && sauce && (
          <circle cx="100" cy="100" r="68" fill={sauceColor(sauce.name)}
            opacity="0.9" className="animate-fade-in" />
        )}

        {/* Cheese */}
        {base && cheese && (
          <g className="animate-fade-in">
            <circle cx="100" cy="100" r="66" fill={cheeseColor(cheese.name)} opacity="0.85" />
            {/* cheese melt holes */}
            {Array.from({ length: 14 }).map((_, i) => {
              const seed = hash(`cheese-${i}-${cheese.id}`);
              const r = 8 + (seed % 56);
              const t = (seed * 47) * (Math.PI / 180);
              return (
                <circle key={i} cx={100 + r * Math.cos(t)} cy={100 + r * Math.sin(t)}
                  r={2 + (seed % 3)} fill="hsl(45 95% 80%)" opacity="0.7" />
              );
            })}
          </g>
        )}

        {/* Toppings */}
        <g className="animate-fade-in">
          {toppingDots.map((d) => (
            <circle key={d.key} cx={d.x} cy={d.y} r={d.size} fill={d.color}
              stroke="hsl(0 0% 0% / 0.1)" strokeWidth="0.5" />
          ))}
        </g>

        {/* Empty plate hint */}
        {!base && (
          <text x="100" y="105" textAnchor="middle" className="fill-muted-foreground"
            style={{ font: "italic 12px serif" }}>
            Pick a base to start…
          </text>
        )}
      </svg>
      {/* steam */}
      {base && cheese && (
        <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2">
          <span className="absolute -left-3 inline-block h-8 w-1 rounded-full bg-foreground/10 blur-sm animate-steam" />
          <span className="absolute left-2 inline-block h-10 w-1 rounded-full bg-foreground/10 blur-sm animate-steam [animation-delay:0.6s]" />
          <span className="absolute left-6 inline-block h-8 w-1 rounded-full bg-foreground/10 blur-sm animate-steam [animation-delay:1.1s]" />
        </div>
      )}
    </div>
  );
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function baseColor(n: string) {
  const k = n.toLowerCase();
  if (k.includes("whole") || k.includes("wheat")) return "hsl(28 45% 45%)";
  if (k.includes("thin")) return "hsl(36 65% 60%)";
  if (k.includes("gluten")) return "hsl(40 50% 70%)";
  if (k.includes("stuffed")) return "hsl(34 60% 55%)";
  return "hsl(34 70% 65%)";
}
function baseInner(n: string) { return shift(baseColor(n), 6, -8); }
function sauceColor(n: string) {
  const k = n.toLowerCase();
  if (k.includes("pesto") || k.includes("basil") || k.includes("green")) return "hsl(95 55% 35%)";
  if (k.includes("white") || k.includes("alfredo")) return "hsl(45 30% 90%)";
  if (k.includes("bbq")) return "hsl(20 70% 30%)";
  return "hsl(8 75% 45%)"; // tomato/marinara default
}
function cheeseColor(n: string) {
  const k = n.toLowerCase();
  if (k.includes("cheddar")) return "hsl(35 90% 60%)";
  if (k.includes("feta") || k.includes("goat")) return "hsl(45 30% 95%)";
  if (k.includes("parm")) return "hsl(48 60% 80%)";
  return "hsl(48 90% 75%)";
}
function veggieColor(n: string) {
  const k = n.toLowerCase();
  if (k.includes("olive")) return "hsl(80 30% 25%)";
  if (k.includes("tomato")) return "hsl(0 70% 50%)";
  if (k.includes("pepper") && k.includes("red")) return "hsl(0 75% 45%)";
  if (k.includes("pepper")) return "hsl(120 45% 40%)";
  if (k.includes("onion")) return "hsl(280 25% 70%)";
  if (k.includes("mushroom")) return "hsl(28 30% 35%)";
  if (k.includes("basil") || k.includes("spinach")) return "hsl(120 50% 30%)";
  if (k.includes("corn")) return "hsl(50 90% 55%)";
  return "hsl(120 40% 40%)";
}
function meatColor(n: string) {
  const k = n.toLowerCase();
  if (k.includes("pepperoni") || k.includes("salami")) return "hsl(0 65% 40%)";
  if (k.includes("bacon")) return "hsl(15 70% 35%)";
  if (k.includes("chicken")) return "hsl(35 50% 55%)";
  if (k.includes("ham")) return "hsl(0 50% 60%)";
  if (k.includes("sausage")) return "hsl(20 40% 30%)";
  return "hsl(10 50% 40%)";
}
function shift(hsl: string, ds: number, dl: number) {
  // hsl(H S% L%)
  const m = /hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/.exec(hsl);
  if (!m) return hsl;
  return `hsl(${m[1]} ${Math.max(0, Math.min(100, +m[2] + ds))}% ${Math.max(0, Math.min(100, +m[3] + dl))}%)`;
}
