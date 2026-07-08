interface MobileContextBarProps {
  language?: string;
  snippetName?: string;
  wpm?: number;
  accuracy?: number;
}

export default function MobileContextBar({
  language = "Python",
  snippetName = "Binary Search Algorithm",
  wpm = 0,
  accuracy = 100,
}: MobileContextBarProps) {
  return (
    <div className="md:hidden w-full flex flex-col gap-3 items-center mb-6 mt-2 z-10">
      {/* Language selector pill */}
      <div className="glass px-4 py-1.5 rounded-full flex items-center gap-2 text-primary border border-primary/20">
        <span className="text-sm font-semibold">{language}</span>
        <span className="material-symbols-outlined text-lg">expand_more</span>
      </div>

      {/* Snippet title */}
      <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-center">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          {snippetName}
        </span>
      </div>

      {/* Stats */}
      <div className="bg-white/5 px-4 py-1.5 rounded-lg border border-white/10">
        <span className="text-sm font-mono text-on-surface-variant">
          WPM: <strong className="text-primary">{wpm}</strong>
          <span className="mx-2 text-outline-variant opacity-30">|</span>
          Acc: <strong className="text-primary">{accuracy}%</strong>
        </span>
      </div>
    </div>
  );
}
