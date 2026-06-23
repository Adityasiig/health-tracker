"use client";

/**
 * "Built by Aditya Singh" pill — uses the app's emerald-teal-blue brand
 * gradient (same as the "Health" logo + calorie ring + primary buttons)
 * so it sits cohesively with the rest of the theme.
 */
export function BuiltBy() {
  return (
    <a
      href="https://github.com/Adityasiig"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full
                 bg-[rgb(var(--bg))]/40 border border-[rgb(var(--border))]
                 text-[11px] tracking-wide
                 hover:border-emerald-500/40 hover:bg-emerald-500/5
                 transition-all duration-200 select-none"
    >
      <span className="text-[rgb(var(--fg-muted))]">Built by</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://github.com/Adityasiig.png"
        alt="Aditya Singh"
        width={20}
        height={20}
        className="rounded-full ring-1 ring-emerald-500/40"
      />
      <span className="font-semibold gradient-text">
        Aditya Singh
      </span>
    </a>
  );
}
