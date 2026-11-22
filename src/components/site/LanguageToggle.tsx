import { useLang } from "@/lib/language";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={cn("inline-flex rounded-full border border-border bg-card p-0.5 text-xs font-semibold", className)} role="group" aria-label="Language">
      {(["en", "te"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l === "en" ? "EN" : <span lang="te">తెలుగు</span>}
        </button>
      ))}
    </div>
  );
}
