import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const PRODUCT_FIELDS =
  "id, title, title_te, description, description_te, craft_story, category, materials, keywords, image_url, price, created_at, artisan:profiles(id, full_name, craft, village, state)";

export type PublicProduct = {
  id: string;
  title: string;
  title_te: string;
  description: string;
  description_te: string;
  craft_story: string;
  category: string;
  materials: string;
  keywords: string[];
  image_url: string | null;
  price: number;
  created_at: string;
  artisan: { id: string; full_name: string; craft: string; village: string; state: string } | null;
};

export type PublicArtisan = {
  id: string;
  full_name: string;
  craft: string;
  village: string;
  state: string;
  preferred_language: string;
  bio: string;
  years_experience: number | null;
  avatar_url: string | null;
};

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: { category?: string; q?: string; limit?: number }) => ({
    category: typeof input?.category === "string" ? input.category.slice(0, 40) : "",
    q: typeof input?.q === "string" ? input.q.slice(0, 80) : "",
    limit: Math.min(Math.max(Number(input?.limit) || 60, 1), 100),
  }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    let query = sb
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.category) query = query.eq("category", data.category);
    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%,materials.ilike.%${term}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as PublicProduct[];
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("id", data.id)
      .eq("status", "approved")
      .maybeSingle();
    if (error && error.code !== "22P02") throw new Error(error.message);
    return (row ?? null) as unknown as PublicProduct | null;
  });

export const getArtisan = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => ({ id: String(input?.id ?? "") }))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: artisan, error } = await sb
      .from("profiles")
      .select("id, full_name, craft, village, state, preferred_language, bio, years_experience, avatar_url")
      .eq("id", data.id)
      .maybeSingle();
    if (error && error.code !== "22P02") throw new Error(error.message);
    if (!artisan) return null;
    const { data: products } = await sb
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("artisan_id", data.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false });
    return {
      artisan: artisan as PublicArtisan,
      products: (products ?? []) as unknown as PublicProduct[],
    };
  });

export const listArtisans = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("profiles")
    .select("id, full_name, craft, village, state, preferred_language, bio, years_experience, avatar_url, products!inner(id)")
    .eq("products.status", "approved")
    .limit(12);
  if (error) throw new Error(error.message);
  return (data ?? []).map(({ products, ...a }) => ({ ...a, productCount: Array.isArray(products) ? products.length : 0 })) as (PublicArtisan & { productCount: number })[];
});
