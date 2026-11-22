import { describe, expect, it } from "vitest";
import { calculatePrice } from "@/lib/pricing";

describe("Smart pricing calculator", () => {
  it("adds raw materials, labour and packaging into the total cost", () => {
    const r = calculatePrice({ materials: 500, labourHours: 8, labourRate: 60, packaging: 80, margin: 25 });
    expect(r.labour).toBe(480);
    expect(r.totalCost).toBe(1060);
  });

  it("applies the profit margin on top of total cost", () => {
    const r = calculatePrice({ materials: 500, labourHours: 8, labourRate: 60, packaging: 80, margin: 25 });
    expect(r.profit).toBe(265);
    expect(r.price).toBe(1325);
  });

  it("rounds the suggested price up to the next ten rupees", () => {
    const r = calculatePrice({ materials: 500, labourHours: 8, labourRate: 60, packaging: 80, margin: 25 });
    expect(r.suggestedPrice).toBe(1330);
  });

  it("treats negative or empty inputs as zero", () => {
    const r = calculatePrice({ materials: -100, labourHours: Number.NaN, labourRate: 60, packaging: 50, margin: 10 });
    expect(r.totalCost).toBe(50);
    expect(r.price).toBe(55);
  });
});
