import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Copy, MapPin, Printer, Languages, Award } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { artisanQuery } from "@/lib/catalog.queries";

export const Route = createFileRoute("/artisans/$id")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(artisanQuery(params.id));
    if (!data) throw notFound();
    return { name: data.artisan.full_name, craft: data.artisan.craft, place: `${data.artisan.village}, ${data.artisan.state}` };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} — ${loaderData.craft} | CraftBridge catalogue` },
          { name: "description", content: `Digital product catalogue of ${loaderData.name}, ${loaderData.craft} artisan from ${loaderData.place}.` },
          { property: "og:title", content: `${loaderData.name} — ${loaderData.craft}` },
          { property: "og:description", content: `Handmade ${loaderData.craft} from ${loaderData.place}.` },
          { property: "og:type", content: "profile" },
          { name: "twitter:card", content: "summary_large_image" },
        ]
      : [{ title: "Artisan unavailable — CraftBridge" }, { name: "robots", content: "noindex" }],
  }),
  notFoundComponent: () => (
    <SiteLayout>
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl">Artisan not found</h1>
        <Button asChild className="mt-6">
          <Link to="/artisans">See all artisans</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
  component: ArtisanCatalogue,
});

function ArtisanCatalogue() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(artisanQuery(id));
  if (!data) return null;
  const { artisan, products } = data;

  return (
    <SiteLayout>
      <section className="woven-texture border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Digital product catalogue</div>
          <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-5">
              <span className="grid size-20 shrink-0 place-items-center rounded-full bg-gradient-terracotta font-display text-3xl text-primary-foreground shadow-warm">
                {artisan.full_name.charAt(0)}
              </span>
              <div>
                <h1 className="text-4xl font-semibold">{artisan.full_name}</h1>
                <div className="mt-1 text-lg text-primary">{artisan.craft}</div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="size-4" /> {artisan.village}, {artisan.state}</span>
                  {artisan.years_experience ? (
                    <span className="flex items-center gap-1"><Award className="size-4" /> {artisan.years_experience} years of practice</span>
                  ) : null}
                  <span className="flex items-center gap-1"><Languages className="size-4" /> Speaks {artisan.preferred_language === "telugu" ? "Telugu" : "English"}</span>
                </div>
              </div>
            </div>
            <div className="no-print flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Catalogue link copied");
                }}
              >
                <Copy /> Share
              </Button>
              <Button variant="olive" onClick={() => window.print()}>
                <Printer /> Print / PDF
              </Button>
            </div>
          </div>
          {artisan.bio && <p className="mt-6 max-w-3xl text-lg leading-relaxed text-foreground/80">{artisan.bio}</p>}
        </div>
      </section>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {products.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
            No approved products yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
