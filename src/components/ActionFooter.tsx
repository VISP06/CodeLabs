interface ActionFooterProps {
  onRestart: () => void;
}

export default function ActionFooter({ onRestart }: ActionFooterProps) {
  return (
    <nav
      aria-label="Typing actions"
      className="fixed bottom-8 left-0 right-0 z-50 flex justify-center items-center"
    >
      <div className="glass rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl border border-white/10">
        {/* Restart */}
        <button
          aria-label="Restart"
          onClick={onRestart}
          className="p-3 text-on-surface-variant hover:text-primary hover:bg-white/10 rounded-full transition-all"
        >
          <span className="material-symbols-outlined text-2xl">refresh</span>
        </button>

        {/* Sound (active state — filled icon, primary bg) */}
        <button
          aria-label="Sound"
          className="bg-primary text-on-primary rounded-full p-3 hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center"
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            volume_up
          </span>
        </button>

        {/* Settings */}
        <button
          aria-label="Settings"
          className="p-3 text-on-surface-variant hover:text-primary hover:bg-white/10 rounded-full transition-all"
        >
          <span className="material-symbols-outlined text-2xl">settings</span>
        </button>

        {/* Keyboard Toggle — mobile only */}
        <button
          aria-label="Keyboard Toggle"
          className="p-3 text-on-surface-variant hover:text-primary hover:bg-white/10 rounded-full transition-all md:hidden"
        >
          <span className="material-symbols-outlined text-2xl">keyboard</span>
        </button>
      </div>
    </nav>
  );
}
