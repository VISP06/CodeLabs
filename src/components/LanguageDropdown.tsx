interface LanguageDropdownProps {
  language?: string;
}

export default function LanguageDropdown({
  language = "Python",
}: LanguageDropdownProps) {
  return (
    <div className="w-full max-w-[900px] px-4 mb-4 flex justify-start">
      <div className="glass px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors group">
        <span className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
          {language}
        </span>
        <span className="material-symbols-outlined text-lg text-on-surface-variant group-hover:text-primary transition-colors">
          expand_more
        </span>
      </div>
    </div>
  );
}
