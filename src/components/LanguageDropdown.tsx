import { useState, useRef, useEffect } from "react";
import { type Language, LANGUAGE_LABELS } from "../data/snippets";
import { ChevronDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LanguageDropdownProps {
  activeLanguage: Language;
  setActiveLanguage: (lang: Language) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LanguageDropdown({
  activeLanguage,
  setActiveLanguage,
}: LanguageDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const languages: Language[] = ["python", "cpp", "java"];

  return (
    <div className="relative" ref={ref}>
      {/* ── Trigger button ──────────────────────────────────────────────── */}
      <button
        id="language-toggle-btn"
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 select-none"
        style={{
          background: open
            ? "rgba(125,211,252,0.12)"
            : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(125,211,252,0.35)" : "rgba(255,255,255,0.1)"}`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: open ? "#7dd3fc" : "#b8c9d9",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(125,211,252,0.25)";
            e.currentTarget.style.color = "#7dd3fc";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "#b8c9d9";
          }
        }}
      >
        <span>{LANGUAGE_LABELS[activeLanguage]}</span>
        <ChevronDown
          size={14}
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────────── */}
      {open && (
        <div
          role="listbox"
          aria-label="Language options"
          className="absolute left-0 mt-2 w-44 rounded-xl overflow-hidden z-[60]"
          style={{
            background: "rgba(14,21,36,0.92)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow:
              "0 12px 40px rgba(0,0,0,0.55), 0 0 20px rgba(125,211,252,0.04)",
            animation: "langDropIn 0.15s cubic-bezier(0.4,0,0.2,1) both",
          }}
        >
          <div className="p-1.5">
            {languages.map((lang) => {
              const isActive = lang === activeLanguage;
              return (
                <button
                  key={lang}
                  role="option"
                  aria-selected={isActive}
                  id={`language-option-${lang}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveLanguage(lang);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100 focus:outline-none"
                  style={{
                    background: isActive
                      ? "rgba(125,211,252,0.1)"
                      : "transparent",
                    color: isActive ? "#7dd3fc" : "#b8c9d9",
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.color = "#e0e8f0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "#b8c9d9";
                    }
                  }}
                >
                  <span>{LANGUAGE_LABELS[lang]}</span>
                  {isActive && (
                    <span
                      className="ml-auto material-symbols-outlined"
                      style={{ fontSize: "16px", color: "#7dd3fc" }}
                    >
                      check
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dropdown entrance keyframe */}
      <style>{`
        @keyframes langDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}
