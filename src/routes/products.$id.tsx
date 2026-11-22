import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Copy, Hand, MapPin, Package, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { LanguageToggle } from "@/components/site/LanguageToggle";
import { productQuery } from "@/lib/catalog.queries";
import { pick, useLang } from "@/lib/language";
import { formatINR } from "@/lib/pricing";

export const Route = createFileRoute("/products/$id")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(productQuery(params.id));
    if (!product) throw notFound();
    return { title: product.title, description: product.description };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — CraftBridge` },
          { name: "description", content: loaderData.description.slice(0, 155) },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.description.slice(0, 155) },
          { property: "og:type", content: "product" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Craft unavailable — CraftBridge" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl">This craft isn't available</h1>
        <p className="mt-2 text-muted-foreground">It may have been removed by the artisan.</p>
        <Button asChild className="mt-6">
          <Link to="/explore">Explore other crafts</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(id));
  const { lang } = useLang();
  if (!product) return null;

  const title = pick(lang, product.title, product.title_te);
  const description = pick(lang, product.description, product.description_te);
  const teText = lang === "te";

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <Link to="/explore" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to crafts
        </Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-border/70 bg-muted shadow-lift">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="aspect-square w-full object-cover" />
            ) : (
              <div className="woven-texture aspect-square" />
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="terracotta">{product.category}</Badge>
              <LanguageToggle />
            </div>
            <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl" lang={teText && product.title_te ? "te" : "en"}>
              {title}
            </h1>
            <div className="mt-4 font-display text-3xl font-semibold text-primary">{formatINR(Number(product.price))}</div>
            <p className="mt-6 leading-relaxed text-foreground/85" lang={teText && product.description_te ? "te" : "en"}>
              {description}
            </p>

            <dl className="mt-8 grid gap-4 rounded-2xl border border-border/70 bg-card p-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <Package className="mt-0.5 size-5 text-olive" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Materials</dt>
                  <dd className="text-sm">{product.materials || "—"}</dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Hand className="mt-0.5 size-5 text-olive" />
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Made by hand in</dt>
                  <dd className="text-sm">{product.artisan ? `${product.artisan.village}, ${product.artisan.state}` : "India"}</dd>
                </div>
              </div>
            </dl>

            {product.keywords.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.keywords.map((k) => (
                  <Link key={k} to="/explore" search={{ q: k }} className="rounded-full bg-sand px-3 py-1 text-xs text-accent-foreground hover:bg-accent">
                    #{k}
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {product.artisan && (
                <Button asChild size="lg" variant="hero">
                  <Link to="/artisans/$id" params={{ id: product.artisan.id }}>
                    View {product.artisan.full_name.split(" ")[0]}'s catalogue
                  </Link>
                </Button>
              )}
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied — share it with anyone!");
                }}
              >
                <Copy /> Copy link
              </Button>
            </div>
          </div>
        </div>

        {product.craft_story && (
          <section className="mt-16 grid gap-8 rounded-3xl bg-earth p-8 text-earth-foreground sm:p-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-marigold">
                <ScrollText className="size-4" /> The craft story
              </div>
              {product.artisan && (
                <div className="mt-4">
                  <div className="font-display text-2xl">{product.artisan.full_name}</div>
                  <div className="mt-1 text-sm text-earth-foreground/70">{product.artisan.craft}</div>
                  <div className="mt-1 flex items-center gap-1 text-sm text-earth-foreground/70">
                    <MapPin className="size-3.5" /> {product.artisan.village}, {product.artisan.state}
                  </div>
                </div>
              )}
            </div>
            <p className="font-display text-xl leading-relaxed text-earth-foreground/90">{product.craft_story}</p>
          </section>
        )}
      </div>
    </SiteLayout>
  );
}
