interface ActionFooterProps {
  onRestart: () => void;
  isBlindMode: boolean;
  onToggleBlindMode: () => void;
  onOpenLeaderboard: () => void;
}

export default function ActionFooter({ onRestart, isBlindMode, onToggleBlindMode, onOpenLeaderboard }: ActionFooterProps) {
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

        {/* Leaderboard */}
        <button
          id="action-leaderboard-btn"
          aria-label="Open leaderboard"
          onClick={onOpenLeaderboard}
          className="p-3 rounded-full transition-all"
          style={{ color: "#fbbf24" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(251,191,36,0.12)";
            e.currentTarget.style.transform = "scale(1.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            emoji_events
          </span>
        </button>

        {/* Blind Mode Toggle */}
        <button
          aria-label={isBlindMode ? "Disable Blind Mode" : "Enable Blind Mode"}
          onClick={onToggleBlindMode}
          className={`p-3 rounded-full transition-all ${
            isBlindMode
              ? "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:opacity-90"
              : "text-on-surface-variant hover:text-primary hover:bg-white/10"
          }`}
        >
          <span className="material-symbols-outlined text-2xl">
            {isBlindMode ? "visibility_off" : "visibility"}
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
