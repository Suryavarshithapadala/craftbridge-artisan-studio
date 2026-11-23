import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useT } from "@/lib/language";

export function SiteFooter() {
  const t = useT();
  return (
    <footer className="no-print mt-24 bg-earth text-earth-foreground">
      <div className="kolam-band" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-earth-foreground/75">
            {t("brand.tagline")}
          </p>
        </div>
        <div>
          <h4 className="font-display text-base text-earth-foreground">{t("footer.shoppers")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-earth-foreground/75">
            <li><Link to="/explore" className="hover:text-earth-foreground">{t("footer.exploreCrafts")}</Link></li>
            <li><Link to="/artisans" className="hover:text-earth-foreground">{t("footer.meetArtisans")}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display text-base text-earth-foreground">{t("footer.artisans")}</h4>
          <ul className="mt-3 space-y-2 text-sm text-earth-foreground/75">
            <li><Link to="/auth" search={{ mode: "register" }} className="hover:text-earth-foreground">{t("footer.register")}</Link></li>
            <li><Link to="/auth" search={{ mode: "login" }} className="hover:text-earth-foreground">{t("footer.studio")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-earth-foreground/10 py-5 text-center text-xs text-earth-foreground/60">
        © {new Date().getFullYear()} CraftBridge · {t("footer.rights")}
      </div>
    </footer>
  );
}
