import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, Camera, Calculator, Languages, ScrollText, Sparkles, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard } from "@/components/site/ProductCard";
import { artisansQuery, productsQuery } from "@/lib/catalog.queries";
import { CATEGORIES, CATEGORY_TE } from "@/lib/constants";
import { useLang } from "@/lib/language";
import heroImg from "@/assets/hero-potter.jpg";
import weaverImg from "@/assets/weaver.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CraftBridge — Handmade India, digitally connected" },
      {
        name: "description",
        content:
          "Discover authentic Indian handicrafts and help artisans build AI-powered product catalogues in English and Telugu.",
      },
      { property: "og:title", content: "CraftBridge — Handmade India, digitally connected" },
      { property: "og:description", content: "Authentic handicrafts from India's artisans, with AI-powered catalogues." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQuery({ limit: 8 })),
      context.queryClient.ensureQueryData(artisansQuery()),
    ]);
  },
  component: Home,
});

const CATEGORY_IMAGES: Record<string, string> = {
  Textiles: "/images/products/pochampally-ikat-saree.jpg",
  Pottery: "/images/products/terracotta-matka.jpg",
  Woodcraft: "/images/products/kondapalli-toys.jpg",
  Paintings: "/images/products/cheriyal-scroll.jpg",
  Metalcraft: "/images/products/dhokra-figurine.jpg",
  "Home Decor": "/images/products/bamboo-basket.jpg",
};

const STEPS = [
  { icon: Camera, title: "Snap a photo", text: "Upload a picture of your handmade product from your phone." },
  { icon: Sparkles, title: "AI writes the listing", text: "Get titles, descriptions and keywords in seconds." },
  { icon: Languages, title: "English & తెలుగు", text: "Translate every listing between Telugu and English." },
  { icon: Calculator, title: "Price it fairly", text: "Count materials, labour, packaging and your profit." },
];

function Home() {
  const { lang } = useLang();
  const { data: products } = useSuspenseQuery(productsQuery({ limit: 8 }));
  const { data: artisans } = useSuspenseQuery(artisansQuery());

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={heroImg} alt="Artisan's hands shaping a terracotta pot on a potter's wheel" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-earth via-earth/80 to-earth/10" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-7xl flex-col justify-center px-4 py-24 sm:px-6">
          <span className="animate-rise inline-flex w-fit items-center gap-2 rounded-full border border-earth-foreground/30 bg-earth/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-marigold backdrop-blur">
            <Sparkles className="size-3.5" /> AI for India's artisans
          </span>
          <h1 className="animate-rise mt-6 max-w-3xl text-4xl font-semibold leading-[1.05] text-earth-foreground sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
            Every handmade piece deserves to be <em className="font-normal text-marigold">seen</em>.
          </h1>
          <p className="animate-rise mt-6 max-w-xl text-lg leading-relaxed text-earth-foreground/85" style={{ animationDelay: "160ms" }}>
            CraftBridge turns a single photo into a professional product catalogue — with stories, translations and fair
            prices — so village artisans can reach buyers everywhere.
          </p>
          <p lang="te" className="animate-rise mt-2 text-base text-earth-foreground/70" style={{ animationDelay: "200ms" }}>
            ప్రతి చేతి కళకు ప్రపంచమంతా గుర్తింపు.
          </p>
          <div className="animate-rise mt-10 flex flex-wrap gap-3" style={{ animationDelay: "260ms" }}>
            <Button asChild size="lg" variant="hero">
              <Link to="/explore">
                Explore crafts <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="glass">
              <Link to="/auth" search={{ mode: "register" }}>I'm an artisan</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHeading eyebrow="Shop by craft" title="Traditions from every corner of India" />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.filter((c) => CATEGORY_IMAGES[c]).map((c) => (
            <Link key={c} to="/explore" search={{ category: c }} className="card-hover group relative aspect-[3/4] overflow-hidden rounded-2xl shadow-card">
              <img src={CATEGORY_IMAGES[c]} alt={c} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="bg-gradient-earth absolute inset-0" />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="font-display text-lg text-earth-foreground">{c}</div>
                <div lang="te" className="text-xs text-earth-foreground/75">{CATEGORY_TE[c]}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="woven-texture py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Fresh from the workshop" title={lang === "te" ? "కొత్త కళాఖండాలు" : "Newly catalogued treasures"} />
            <Button asChild variant="outline">
              <Link to="/explore">
                View all crafts <ArrowRight />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works for artisans */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="relative">
            <img src={weaverImg} alt="Weaver working at a traditional handloom" loading="lazy" className="aspect-[4/3] w-full rounded-3xl object-cover shadow-lift" />
            <div className="absolute -bottom-6 -right-2 max-w-[16rem] rounded-2xl border border-border bg-card p-4 shadow-card sm:-right-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-olive">
                <ScrollText className="size-4" /> AI craft story
              </div>
              <p className="mt-2 font-display text-sm leading-snug">
                "Lakshmi ties and dyes every thread by hand before it touches the loom…"
              </p>
            </div>
          </div>
          <div>
            <SectionHeading eyebrow="For artisans" title="Your craft, your words — the AI handles the rest" />
            <p className="mt-4 max-w-lg text-muted-foreground">
              No computer skills needed. Register with your name, village and preferred language, then build a digital
              catalogue you can share with any buyer.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <div key={s.title} className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-terracotta-soft text-primary">
                      <s.icon className="size-5" />
                    </span>
                    <span className="font-display text-sm text-muted-foreground">0{i + 1}</span>
                  </div>
                  <h3 className="mt-3 text-lg">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              ))}
            </div>
            <Button asChild size="lg" className="mt-8" variant="hero">
              <Link to="/auth" search={{ mode: "register" }}>
                Start your catalogue <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Artisans */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="kolam-band mb-16" />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading eyebrow="The hands behind the craft" title="Meet our artisans" />
          <Button asChild variant="ghost">
            <Link to="/artisans">
              All artisans <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {artisans.slice(0, 8).map((a) => (
            <Link key={a.id} to="/artisans/$id" params={{ id: a.id }} className="card-hover rounded-2xl border border-border/70 bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-olive-soft font-display text-lg text-olive">
                  {a.full_name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-display text-base">{a.full_name}</div>
                  <div className="truncate text-xs text-muted-foreground">{a.craft}</div>
                </div>
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" /> {a.village}, {a.state}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}

export function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</div>
      <h2 className="mt-2 max-w-2xl text-3xl font-semibold sm:text-4xl">{title}</h2>
    </div>
  );
}
