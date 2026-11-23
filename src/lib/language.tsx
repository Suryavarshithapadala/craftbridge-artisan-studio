import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { en, type TranslationKey } from "./i18n/en";
import { te } from "./i18n/te";

export type Lang = "en" | "te";
export type { TranslationKey };

const DICTIONARIES: Record<Lang, Record<TranslationKey, string>> = { en, te };
const STORAGE_KEY = "craftbridge-lang";

export function translate(lang: Lang, key: TranslationKey, vars?: Record<string, string | number>) {
  let text = DICTIONARIES[lang][key] ?? en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const LangContext = createContext<LangContextValue>({
  lang: "en",
  setLang: () => {},
  t: (key, vars) => translate("en", key, vars),
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "te" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
export const useT = () => useContext(LangContext).t;

/** Pick the Telugu version of user content when Telugu is selected and it exists. */
export function pick(lang: Lang, en: string, te?: string | null) {
  return lang === "te" && te ? te : en;
}

const AUTH_ERRORS: [RegExp, TranslationKey][] = [
  [/invalid login credentials/i, "errors.invalidLogin"],
  [/email not confirmed/i, "errors.emailNotConfirmed"],
  [/already registered|already exists/i, "errors.alreadyRegistered"],
  [/rate limit|too many/i, "errors.rateLimit"],
  [/weak|pwned|password should/i, "errors.weakPassword"],
];

/** Turn any error (AI codes, validation codes, sign-in errors) into a message in the chosen language. */
export function errorText(lang: Lang, error: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const code = message.trim();
  const key = `errors.${code}` as TranslationKey;
  if (code && key in en) return translate(lang, key);
  for (const [re, k] of AUTH_ERRORS) if (re.test(message)) return translate(lang, k);
  return translate(lang, "errors.generic");
}

/** Dictionary key for a product category (falls back to the English label for unknown ones). */
export function categoryKey(category: string): TranslationKey {
  const key = `cat.${category}` as TranslationKey;
  return key in en ? key : ("cat.Home Decor" satisfies TranslationKey);
}
