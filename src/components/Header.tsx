interface HeaderProps {
  snippetName?: string;
  wpm?: number;
  accuracy?: number;
}

export default function Header({
  snippetName = "Binary Search Algorithm",
  wpm = 0,
  accuracy = 100,
}: HeaderProps) {
  return (
    <header className="glass sticky top-0 z-50 flex justify-between items-center px-6 w-full h-[72px] shrink-0 border-b border-white/5">
      {/* ── Leading / Brand ─────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-primary hover:opacity-80 transition-all cursor-pointer">
          <span className="material-symbols-outlined text-3xl font-bold">
            terminal
          </span>
          <span className="text-xl font-bold tracking-tight">&gt;_ CodeLabs</span>
        </div>
      </div>

      {/* ── Center / Snippet Title (desktop only) ───────────────────── */}
      <div className="hidden md:flex flex-1 justify-center">
        <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
          <span className="text-sm font-medium text-on-surface-variant">
            {snippetName}
          </span>
        </div>
      </div>

      {/* ── Trailing / Stats + Profile ──────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex bg-white/5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <span className="text-sm font-mono text-on-surface-variant">
            WPM:{" "}
            <strong className="text-primary">{wpm}</strong> | Acc:{" "}
            <strong className="text-primary">{accuracy}%</strong>
          </span>
        </div>
        <button
          aria-label="Profile"
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-all text-primary"
        >
          <span className="material-symbols-outlined text-2xl">
            account_circle
          </span>
        </button>
      </div>
    </header>
  );
}
