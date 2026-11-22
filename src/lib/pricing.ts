export type PricingInput = {
  /** Cost of raw materials in ₹ */
  materials: number;
  /** Hours of labour spent making the product */
  labourHours: number;
  /** Fair wage per hour in ₹ */
  labourRate: number;
  /** Packaging cost in ₹ */
  packaging: number;
  /** Profit margin as a percentage of total cost */
  margin: number;
};

export type PricingResult = {
  materials: number;
  labour: number;
  packaging: number;
  totalCost: number;
  profit: number;
  /** Exact selling price (cost + margin), rounded to the rupee */
  price: number;
  /** Customer-friendly price, rounded up to the next ₹10 */
  suggestedPrice: number;
};

const clean = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function calculatePrice(input: PricingInput): PricingResult {
  const materials = clean(input.materials);
  const labour = clean(input.labourHours) * clean(input.labourRate);
  const packaging = clean(input.packaging);
  const totalCost = materials + labour + packaging;
  const profit = (totalCost * clean(input.margin)) / 100;
  const exact = totalCost + profit;
  return {
    materials,
    labour,
    packaging,
    totalCost,
    profit: Math.round(profit),
    price: Math.round(exact),
    suggestedPrice: Math.ceil(exact / 10) * 10,
  };
}

export const DEFAULT_PRICING: PricingInput = {
  materials: 500,
  labourHours: 8,
  labourRate: 60,
  packaging: 80,
  margin: 25,
};

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
