"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Menu } from "lucide-react";
import { useEffect, useState } from "react";

export function TopBar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header
      className="sticky top-0 z-30 backdrop-blur-md bg-[rgb(var(--bg))]/70 border-b border-[rgb(var(--border))]/60"
      style={{ paddingTop: "env(safe-area-inset-top, 0)" }}
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-12 lg:h-16">
        <button
          onClick={onMenuClick}
          className="lg:hidden btn btn-ghost p-2"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="btn btn-ghost p-2"
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
