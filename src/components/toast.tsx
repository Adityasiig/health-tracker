"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastKind = "error" | "success" | "info";
type Toast = { id: number; message: string; kind: ToastKind };
type Ctx = { push: (message: string, kind?: ToastKind) => void };

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "error") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 6000);
  }, []);

  const dismiss = (id: number) =>
    setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4 sm:px-0">
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.35 }}
              className={`pointer-events-auto glass-card flex items-start gap-3 px-4 py-3 text-sm ${
                t.kind === "error" ? "border-red-500/30" :
                t.kind === "success" ? "border-emerald-500/30" :
                "border-blue-500/30"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {t.kind === "error"  && <AlertCircle className="w-4 h-4 text-red-500" />}
                {t.kind === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {t.kind === "info"   && <AlertCircle className="w-4 h-4 text-blue-500" />}
              </div>
              <div className="flex-1 min-w-0 break-words">{t.message}</div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 -mr-1 p-1 rounded hover:bg-[rgb(var(--border))]/50 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5 text-[rgb(var(--fg-muted))]" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) {
    // Tolerate calls before provider mounts — no-op rather than crash
    return { push: () => {} } as Ctx;
  }
  return ctx;
}
