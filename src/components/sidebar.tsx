"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Utensils,
  Search,
  BarChart3,
  Calculator,
  Bot,
  User,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",            label: "Dashboard",     icon: Home },
  { href: "/meals",       label: "Meals",         icon: Utensils },
  { href: "/food-search", label: "Food Search",   icon: Search },
  { href: "/analytics",   label: "Analytics",     icon: BarChart3 },
  { href: "/calculators", label: "BMI & Calories", icon: Calculator },
  { href: "/coach",       label: "AI Coach",      icon: Bot },
  { href: "/profile",     label: "Profile",       icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex w-64 shrink-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--bg-elev))] flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-bold text-lg leading-none gradient-text">Health</div>
          <div className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">Nutrition Tracker</div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400"
                  : "text-[rgb(var(--fg-muted))] hover:bg-[rgb(var(--border))]/40 hover:text-[rgb(var(--fg))]"
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[rgb(var(--border))]">
        <div className="glass-card p-4">
          <div className="text-xs text-[rgb(var(--fg-muted))] mb-1">Built on Helios</div>
          <div className="text-xs">v2 · Next.js 16</div>
        </div>
      </div>
    </aside>
  );
}
