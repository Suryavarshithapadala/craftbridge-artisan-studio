import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PublicProduct } from "@/lib/catalog.functions";
import { CATEGORY_TE } from "@/lib/constants";
import { pick, useLang } from "@/lib/language";
import { formatINR } from "@/lib/pricing";

export function ProductCard({ product, index = 0 }: { product: PublicProduct; index?: number }) {
  const { lang } = useLang();
  const title = pick(lang, product.title, product.title_te);
  return (
    <Link
      to="/products/$id"
      params={{ id: product.id }}
      className="card-hover animate-rise group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="woven-texture size-full" />
        )}
        <Badge variant="cream" className="absolute left-3 top-3">
          {lang === "te" ? <span lang="te">{CATEGORY_TE[product.category] ?? product.category}</span> : product.category}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-display text-lg leading-snug text-foreground" lang={lang === "te" && product.title_te ? "te" : "en"}>
          {title}
        </h3>
        {product.artisan && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {product.artisan.full_name} · {product.artisan.village}, {product.artisan.state}
          </p>
        )}
        <div className="mt-auto pt-2 font-display text-xl font-semibold text-primary">{formatINR(Number(product.price))}</div>
      </div>
    </Link>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          <div className="ai-shimmer aspect-square" />
          <div className="space-y-2 p-4">
            <div className="ai-shimmer h-4 w-3/4 rounded" />
            <div className="ai-shimmer h-3 w-1/2 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
