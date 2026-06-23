"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Utensils, Search, BarChart3, Calculator, Bot, User, Activity, X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";
import { BuiltBy } from "@/components/built-by";

const NAV = [
  { href: "/",            label: "Dashboard",      icon: Home },
  { href: "/meals",       label: "Meals",          icon: Utensils },
  { href: "/food-search", label: "Food Search",    icon: Search },
  { href: "/analytics",   label: "Analytics",      icon: BarChart3 },
  { href: "/calculators", label: "BMI & Calories", icon: Calculator },
  { href: "/coach",       label: "AI Coach",       icon: Bot },
  { href: "/profile",     label: "Profile",        icon: User },
];

export function Sidebar({
  mobileOpen = false,
  onCloseMobile,
}: {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar — always visible on ≥ lg */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-[rgb(var(--border))] bg-[rgb(var(--bg-elev))] flex-col">
        <SidebarContent pathname={pathname} onItemClick={() => {}} />
      </aside>

      {/* Mobile drawer — slides in from the left when mobileOpen */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[80vw] bg-[rgb(var(--bg-elev))] border-r border-[rgb(var(--border))] flex flex-col"
            >
              <button
                onClick={onCloseMobile}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[rgb(var(--border))]/40"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent pathname={pathname} onItemClick={onCloseMobile ?? (() => {})} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  pathname, onItemClick,
}: {
  pathname: string; onItemClick: () => void;
}) {
  return (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-bold text-lg leading-none gradient-text">Health</div>
          <div className="text-xs text-[rgb(var(--fg-muted))] mt-0.5">Nutrition Tracker</div>
        </div>
      </div>

      <nav className="flex-1 px-3 pb-6 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
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

      <div className="p-4 border-t border-[rgb(var(--border))] space-y-3">
        <UserMenu />
        <div className="flex justify-center">
          <BuiltBy />
        </div>
      </div>
    </>
  );
}
