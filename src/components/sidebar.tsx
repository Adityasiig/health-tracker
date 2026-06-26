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
        <SidebarContent pathname={pathname} onItemClick={() => {}} showClose={false} onClose={() => {}} />
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
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-[78%] max-w-[320px] bg-[rgb(var(--bg-elev))] border-r border-[rgb(var(--border))] flex flex-col shadow-2xl shadow-black/40"
              style={{
                paddingTop: "env(safe-area-inset-top, 0)",
                paddingBottom: "env(safe-area-inset-bottom, 0)",
              }}
            >
              <SidebarContent
                pathname={pathname}
                onItemClick={onCloseMobile ?? (() => {})}
                showClose={true}
                onClose={onCloseMobile ?? (() => {})}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({
  pathname, onItemClick, showClose, onClose,
}: {
  pathname: string; onItemClick: () => void; showClose: boolean; onClose: () => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-lg leading-none gradient-text">Health</div>
            <div className="text-[11px] text-[rgb(var(--fg-muted))] mt-1 tracking-wide">
              Nutrition Tracker
            </div>
          </div>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-lg text-[rgb(var(--fg-muted))] active:bg-[rgb(var(--border))]/30"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Faint divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-[rgb(var(--border))] to-transparent" />

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 pb-4 overflow-y-auto">
        <div className="px-2 mb-2 text-[10px] uppercase tracking-[0.12em] text-[rgb(var(--fg-muted))]/80 font-semibold">
          Menu
        </div>
        <div className="space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent text-emerald-600 dark:text-emerald-400"
                    : "text-[rgb(var(--fg-muted))] active:bg-[rgb(var(--border))]/30"
                )}
              >
                {/* Active left accent rail */}
                {active && (
                  <motion.span
                    layoutId="nav-rail"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-emerald-400 to-teal-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={active ? 2.5 : 2} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer — combined account + branding */}
      <div className="px-4 pt-3 pb-4 border-t border-[rgb(var(--border))]/60 space-y-3">
        <UserMenu />
        <div className="flex justify-center">
          <BuiltBy />
        </div>
      </div>
    </>
  );
}
