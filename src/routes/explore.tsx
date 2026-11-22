import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, ProductGridSkeleton } from "@/components/site/ProductCard";
import { productsQuery } from "@/lib/catalog.queries";
import { CATEGORIES, CATEGORY_TE } from "@/lib/constants";
import { useLang } from "@/lib/language";
import { cn } from "@/lib/utils";

type ExploreSearch = { category?: string | undefined; q?: string | undefined };

export const Route = createFileRoute("/explore")({
  validateSearch: (search: Record<string, unknown>): ExploreSearch => {
    const out: ExploreSearch = {};
    if (typeof search["category"] === "string" && search["category"]) out.category = search["category"];
    if (typeof search["q"] === "string" && search["q"]) out.q = search["q"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Explore Indian Handicrafts — CraftBridge" },
      { name: "description", content: "Browse handwoven textiles, pottery, wooden toys, paintings and metalcraft made by Indian artisans." },
      { property: "og:title", content: "Explore Indian Handicrafts — CraftBridge" },
      { property: "og:description", content: "Handmade textiles, pottery, woodcraft and art from artisans across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { category, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });
  const { lang } = useLang();
  const [term, setTerm] = useState(q ?? "");

  useEffect(() => setTerm(q ?? ""), [q]);
  useEffect(() => {
    const t = setTimeout(() => {
      if ((term || undefined) !== q) navigate({ search: (prev) => ({ ...prev, q: term || undefined }), replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [term, q, navigate]);

  const filters: { category?: string; q?: string } = {};
  if (category) filters.category = category;
  if (q) filters.q = q;
  const { data: products, isLoading } = useQuery(productsQuery(filters));

  return (
    <SiteLayout>
      <section className="bg-gradient-sunset border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Explore crafts</div>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">{lang === "te" ? "చేతి కళల ప్రపంచం" : "Handmade, with a story"}</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">Every piece is made by hand and listed by the artisan who made it.</p>
          <div className="relative mt-8 max-w-xl">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search ikat, terracotta, brass, Kalamkari…"
              className="h-12 rounded-full border-border bg-card pl-11 pr-10 text-base shadow-card"
              aria-label="Search crafts"
            />
            {term && (
              <button type="button" onClick={() => setTerm("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label="Clear search">
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2">
          <CategoryPill active={!category} to={undefined} label={lang === "te" ? "అన్నీ" : "All crafts"} />
          {CATEGORIES.map((c) => (
            <CategoryPill key={c} active={category === c} to={c} label={lang === "te" ? CATEGORY_TE[c] ?? c : c} />
          ))}
        </div>

        <div className="mt-8">
          {isLoading || !products ? (
            <ProductGridSkeleton />
          ) : products.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center">
              <h2 className="text-2xl">No crafts found</h2>
              <p className="mt-2 text-muted-foreground">Try another search or category.</p>
            </div>
          ) : (
            <>
              <p className="mb-5 text-sm text-muted-foreground">{products.length} handmade pieces</p>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                {products.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function CategoryPill({ active, to, label }: { active: boolean; to: string | undefined; label: string }) {
  return (
    <Link
      to="/explore"
      search={(prev) => ({ ...prev, category: to })}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
