"use client";

import { useEffect, useState } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { getBrowserSupabase } from "@/lib/db/browser";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = getBrowserSupabase();
    supabase.auth.getUser().then((res: { data: { user: { email?: string | null; user_metadata?: { full_name?: string } } | null } }) => {
      const u = res.data.user;
      if (u) {
        setEmail(u.email ?? null);
        const meta = u.user_metadata as { full_name?: string } | null;
        setName(meta?.full_name ?? null);
      }
    });
  }, []);

  const logout = async () => {
    const supabase = getBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (!email) {
    return (
      <div className="glass-card p-3 text-xs text-[rgb(var(--fg-muted))]">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="glass-card p-3 w-full flex items-center gap-3 hover:border-emerald-500/30 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
          <UserIcon className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{name || email.split("@")[0]}</div>
          <div className="text-xs text-[rgb(var(--fg-muted))] truncate">{email}</div>
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 right-0 glass-card p-1 z-20">
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
