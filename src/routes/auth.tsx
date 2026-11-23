import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/site/Logo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { INDIAN_STATES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import heroImg from "@/assets/weaver.jpg";

type AuthSearch = { mode?: "login" | "register" | undefined; redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): AuthSearch => {
    const out: AuthSearch = {};
    if (s["mode"] === "login" || s["mode"] === "register") out.mode = s["mode"];
    if (typeof s["redirect"] === "string" && s["redirect"].startsWith("/") && !s["redirect"].startsWith("//")) out.redirect = s["redirect"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Artisan Registration & Login — CraftBridge" },
      { name: "description", content: "Register as an artisan on CraftBridge to build your AI-powered product catalogue." },
      { property: "og:title", content: "Join CraftBridge as an artisan" },
      { property: "og:description", content: "Create your digital craft catalogue in English and Telugu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const mode = search.mode ?? "register";
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [lang, setLang] = useState<"english" | "telugu">("telugu");
  const [state, setState] = useState("Telangana");

  const destination = search.redirect && !search.redirect.startsWith("/auth") ? search.redirect : "/";

  useEffect(() => {
    if (ready && user) navigate({ to: destination, replace: true });
  }, [ready, user, destination, navigate]);

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim();
    const password = String(f.get("password"));
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: {
          full_name: String(f.get("full_name")).trim(),
          craft: String(f.get("craft")).trim(),
          village: String(f.get("village")).trim(),
          state,
          preferred_language: lang,
        },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (!data.session) setSentTo(email);
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get("email")).trim(),
      password: String(f.get("password")),
    });
    setBusy(false);
    if (error) { toast.error(error.message === "Email not confirmed" ? "Please confirm your email first — check your inbox." : error.message); return; }
    toast.success("Welcome back!");
  }

  async function social(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) toast.error(result.error.message ?? "Sign-in failed");
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden lg:block">
        <img src={heroImg} alt="Weaver at a handloom" className="absolute inset-0 size-full object-cover" />
        <div className="bg-gradient-earth absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-earth-foreground">
          <p className="font-display text-3xl leading-snug">"Your hands make the craft. CraftBridge helps the world find it."</p>
          <p lang="te" className="mt-3 text-earth-foreground/75">మీ కళ — ప్రపంచానికి చేరువ.</p>
        </div>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto my-auto w-full max-w-md py-10">
          {sentTo ? (
            <div className="animate-rise text-center">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-olive-soft text-olive">
                <MailCheck className="size-8" />
              </span>
              <h1 className="mt-6 text-3xl font-semibold">Check your email</h1>
              <p className="mt-3 text-muted-foreground">
                We sent a confirmation link to <strong className="text-foreground">{sentTo}</strong>. Click it to activate
                your artisan account, then sign in.
              </p>
              <Button className="mt-8" variant="outline" onClick={() => { setSentTo(null); navigate({ to: "/auth", search: { mode: "login" } }); }}>
                Go to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-semibold sm:text-4xl">{mode === "register" ? "Join as an artisan" : "Welcome back"}</h1>
              <p className="mt-2 text-muted-foreground">
                {mode === "register" ? "Create your free digital craft catalogue." : "Sign in to your artisan studio."}
              </p>

              <div className="mt-6 grid grid-cols-2 rounded-full bg-muted p-1 text-sm font-semibold">
                {(["register", "login"] as const).map((m) => (
                  <Link
                    key={m}
                    to="/auth"
                    search={{ ...search, mode: m }}
                    className={cn("rounded-full py-2 text-center transition-colors", mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
                  >
                    {m === "register" ? "Register" : "Sign in"}
                  </Link>
                ))}
              </div>

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => social("google")}>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="!size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                  Continue with Google
                </Button>
                <Button type="button" variant="outline" onClick={() => social("lovable")}>
                  <LovableMark /> Continue with Lovable
                </Button>
              </div>
              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
              </div>

              {mode === "register" ? (
                <form onSubmit={handleRegister} className="grid gap-4">
                  <Field label="Full name" name="full_name" placeholder="e.g. Lakshmi Devi" required />
                  <Field label="Your craft" name="craft" placeholder="e.g. Ikat weaving, Kondapalli toys" required />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Village / town" name="village" placeholder="e.g. Pochampally" required />
                    <div className="grid gap-1.5">
                      <Label>State</Label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger className="h-11 rounded-xl bg-card"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Preferred language</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {([["telugu", "తెలుగు", "Telugu"], ["english", "English", "English"]] as const).map(([v, label, sub]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setLang(v)}
                          aria-pressed={lang === v}
                          className={cn(
                            "rounded-xl border px-4 py-3 text-left transition-colors",
                            lang === v ? "border-primary bg-terracotta-soft" : "border-input bg-card hover:bg-muted",
                          )}
                        >
                          <div className="font-semibold" lang={v === "telugu" ? "te" : "en"}>{label}</div>
                          <div className="text-xs text-muted-foreground">{sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Field label="Email" name="email" type="email" placeholder="you@example.com" required />
                  <Field label="Password" name="password" type="password" placeholder="At least 6 characters" required />
                  <Button type="submit" size="lg" variant="hero" disabled={busy} className="mt-2">
                    {busy && <Loader2 className="animate-spin" />} Create artisan account
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="grid gap-4">
                  <Field label="Email" name="email" type="email" placeholder="you@example.com" required />
                  <Field label="Password" name="password" type="password" required />
                  <Button type="submit" size="lg" variant="hero" disabled={busy} className="mt-2">
                    {busy && <Loader2 className="animate-spin" />} Sign in
                  </Button>
                </form>
              )}
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Just browsing? <Link to="/explore" className="font-semibold text-primary hover:underline">Explore crafts</Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} className="h-11 rounded-xl bg-card" {...props} />
    </div>
  );
}
