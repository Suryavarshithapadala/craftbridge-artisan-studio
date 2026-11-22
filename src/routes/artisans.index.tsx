import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { artisansQuery } from "@/lib/catalog.queries";

export const Route = createFileRoute("/artisans/")({
  head: () => ({
    meta: [
      { title: "Meet the Artisans — CraftBridge" },
      { name: "description", content: "Weavers, potters, painters and metalsmiths from villages across India." },
      { property: "og:title", content: "Meet the Artisans — CraftBridge" },
      { property: "og:description", content: "The hands behind India's living craft traditions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(artisansQuery()),
  component: ArtisansPage,
});

function ArtisansPage() {
  const { data: artisans } = useSuspenseQuery(artisansQuery());
  return (
    <SiteLayout>
      <section className="bg-gradient-sunset border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Artisans</div>
          <h1 className="mt-2 text-4xl font-semibold sm:text-5xl">The hands behind the craft</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">Open any artisan's digital catalogue to see their full collection.</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {artisans.map((a, i) => (
          <Link
            key={a.id}
            to="/artisans/$id"
            params={{ id: a.id }}
            className="card-hover animate-rise flex flex-col rounded-3xl border border-border/70 bg-card p-6 shadow-card"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-gradient-terracotta font-display text-xl text-primary-foreground">
                {a.full_name.charAt(0)}
              </span>
              <div>
                <div className="font-display text-xl">{a.full_name}</div>
                <div className="text-sm text-primary">{a.craft}</div>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{a.bio}</p>
            <div className="mt-auto flex items-center justify-between pt-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" /> {a.village}, {a.state}
              </span>
              <span>
                {a.productCount} {a.productCount === 1 ? "piece" : "pieces"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </SiteLayout>
  );
}
