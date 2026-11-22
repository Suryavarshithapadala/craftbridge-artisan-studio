import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="no-print mt-24 bg-earth text-earth-foreground">
      <div className="kolam-band" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-earth-foreground/75">
            Bridging India's living craft traditions with the digital marketplace — AI-assisted catalogues in English and
            <span lang="te"> తెలుగు</span>.
          </p>
        </div>
        <div>
          <h4 className="font-display text-base text-earth-foreground">For shoppers</h4>
          <ul className="mt-3 space-y-2 text-sm text-earth-foreground/75">
            <li><Link to="/explore" className="hover:text-earth-foreground">Explore crafts</Link></li>
            <li><Link to="/artisans" className="hover:text-earth-foreground">Meet the artisans</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-base text-earth-foreground">For artisans</h4>
          <ul className="mt-3 space-y-2 text-sm text-earth-foreground/75">
            <li><Link to="/auth" search={{ mode: "register" }} className="hover:text-earth-foreground">Register</Link></li>
            <li><Link to="/dashboard" className="hover:text-earth-foreground">Artisan studio</Link></li>
            <li><Link to="/studio/pricing" className="hover:text-earth-foreground">Pricing calculator</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-earth-foreground/10 py-5 text-center text-xs text-earth-foreground/60">
        © {new Date().getFullYear()} CraftBridge · Handmade in India
      </div>
    </footer>
  );
}
