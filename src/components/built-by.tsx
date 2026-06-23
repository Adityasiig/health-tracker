"use client";

/**
 * "Built by Aditya Singh" pill — small, subtle, links to GitHub.
 * Avatar pulled live from github.com/Adityasiig.png (no config needed,
 * served as a plain <img> not next/image).
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
                 hover:border-violet-500/40 hover:bg-violet-500/5
                 transition-all duration-200 select-none"
    >
      <span className="text-[rgb(var(--fg-muted))]">Built by</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://github.com/Adityasiig.png"
        alt="Aditya Singh"
        width={20}
        height={20}
        className="rounded-full ring-1 ring-violet-500/30"
      />
      <span className="font-semibold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
        Aditya Singh
      </span>
    </a>
  );
}
