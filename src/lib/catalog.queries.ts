import { queryOptions } from "@tanstack/react-query";
import { getArtisan, getProduct, listArtisans, listProducts } from "./catalog.functions";

export const productsQuery = (filters: { category?: string; q?: string; limit?: number } = {}) =>
  queryOptions({
    queryKey: ["products", filters.category ?? "", filters.q ?? "", filters.limit ?? 60],
    queryFn: () =>
      listProducts({
        data: {
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.q ? { q: filters.q } : {}),
          ...(filters.limit ? { limit: filters.limit } : {}),
        },
      }),
  });

export const productQuery = (id: string) =>
  queryOptions({ queryKey: ["product", id], queryFn: () => getProduct({ data: { id } }) });

export const artisanQuery = (id: string) =>
  queryOptions({ queryKey: ["artisan", id], queryFn: () => getArtisan({ data: { id } }) });

export const artisansQuery = () => queryOptions({ queryKey: ["artisans"], queryFn: () => listArtisans() });
