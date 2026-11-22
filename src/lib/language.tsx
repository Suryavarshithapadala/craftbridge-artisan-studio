import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "te";
const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = window.localStorage.getItem("craftbridge-lang");
    if (saved === "te" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    window.localStorage.setItem("craftbridge-lang", l);
  };
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

/** Pick the Telugu version when the shopper chose Telugu and it exists. */
export function pick(lang: Lang, en: string, te?: string | null) {
  return lang === "te" && te ? te : en;
}
