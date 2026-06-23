/**
 * Layout for login / signup pages — minimal centered card on a subtle gradient.
 */
import Link from "next/link";
import { Activity } from "lucide-react";
import { BuiltBy } from "@/components/built-by";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4
                    bg-gradient-to-br from-[rgb(var(--bg))] via-[rgb(var(--bg))] to-emerald-950/20">
      <Link href="/" className="flex items-center gap-3 mb-8 select-none">
        <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-bold text-2xl leading-none gradient-text">Health</div>
          <div className="text-xs text-[rgb(var(--fg-muted))] mt-1">Nutrition Tracker</div>
        </div>
      </Link>

      <div className="w-full max-w-md">
        {children}
      </div>

      <div className="mt-8">
        <BuiltBy />
      </div>
    </div>
  );
}
