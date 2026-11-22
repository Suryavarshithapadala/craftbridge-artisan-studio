import { Link } from "@tanstack/react-router";
import { Menu, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";
import { LanguageToggle } from "./LanguageToggle";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore Crafts" },
  { to: "/artisans", label: "Artisans" },
] as const;

export function SiteHeader() {
  const { user, ready } = useAuth();
  const [open, setOpen] = useState(false);

  const authCta = ready && user ? (
    <Button asChild size="sm">
      <Link to="/dashboard">
        <LayoutDashboard /> My Studio
      </Link>
    </Button>
  ) : (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link to="/auth" search={{ mode: "login" }}>Artisan login</Link>
      </Button>
      <Button asChild size="sm" variant="hero">
        <Link to="/auth" search={{ mode: "register" }}>Join as artisan</Link>
      </Button>
    </>
  );

  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-sand data-[status=active]:text-foreground"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LanguageToggle />
          {authCta}
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="mt-8 flex flex-col gap-2">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 font-medium hover:bg-sand">
                  {n.label}
                </Link>
              ))}
              <LanguageToggle className="mx-4 my-3 self-start" />
              <div className="flex flex-col gap-2 px-4" onClick={() => setOpen(false)}>
                {authCta}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
