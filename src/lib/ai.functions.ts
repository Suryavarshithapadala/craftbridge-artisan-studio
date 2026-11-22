import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORIES } from "@/lib/constants";

const analysisSchema = z.object({
  craftType: z.string().describe("Specific traditional craft name, e.g. 'Kondapalli wooden toys'"),
  category: z.enum(CATEGORIES),
  region: z.string().describe("Likely region or state of origin, or empty string if unknown"),
  materials: z.string(),
  colours: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  titleOptions: z.array(z.string()).describe("Exactly 3 catalogue title options"),
  description: z.string(),
  keywords: z.array(z.string()).describe("8 to 10 search keywords"),
  titleTe: z.string().describe("Telugu translation of the first title option"),
  descriptionTe: z.string().describe("Telugu translation of the description"),
});

export type ProductAnalysis = z.infer<typeof analysisSchema>;

export const analyzeProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { imageDataUrl: string; notes?: string; craft?: string }) => {
    if (typeof input?.imageDataUrl !== "string" || !input.imageDataUrl.startsWith("data:image/"))
      throw new Error("Please upload a product photo first.");
    if (input.imageDataUrl.length > 6_000_000) throw new Error("This photo is too large. Please use a smaller one.");
    return {
      imageDataUrl: input.imageDataUrl,
      notes: (input.notes ?? "").slice(0, 1000),
      craft: (input.craft ?? "").slice(0, 120),
    };
  })
  .handler(async ({ data }) => {
    const { generateStructured } = await import("@/lib/ai-gateway.server");
    const context = [
      data.craft ? `The artisan's craft: ${data.craft}.` : "",
      data.notes ? `Artisan's notes about this product: ${data.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    return generateStructured({
      instructions:
        "You are a catalogue expert for traditional Indian handicrafts. Identify the handmade product in the photo and write professional, honest e-commerce copy. Celebrate the craft heritage, mention technique and materials only if visible or stated by the artisan, and never invent certifications. Titles under 70 characters. Description 60-90 words, warm and specific. Keywords lowercase. Telugu must be natural, fluent Telugu script.",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Analyse this handmade product photo and prepare catalogue content.\n${context}` },
            { type: "image", image: new URL(data.imageDataUrl) },
          ],
        },
      ],
      schema: analysisSchema,
    });
  });

const storySchema = z.object({
  headline: z.string(),
  storyEn: z.string(),
  storyTe: z.string(),
  tagline: z.string().describe("One short line for product cards"),
});

export type CraftStory = z.infer<typeof storySchema>;

type StoryInput = {
  artisanName: string;
  craft: string;
  village: string;
  state: string;
  yearsExperience: string;
  learnedFrom: string;
  technique: string;
  materials: string;
  inspiration: string;
  productName: string;
  tone: "heartfelt" | "professional" | "short";
};

export const generateCraftStory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: StoryInput) => {
    const s = (v: unknown, max = 600) => (typeof v === "string" ? v.slice(0, max) : "");
    if (!s(input?.craft)) throw new Error("Tell us which craft you practise.");
    const tone = input.tone === "professional" || input.tone === "short" ? input.tone : "heartfelt";
    return {
      artisanName: s(input.artisanName, 120),
      craft: s(input.craft, 120),
      village: s(input.village, 120),
      state: s(input.state, 120),
      yearsExperience: s(input.yearsExperience, 20),
      learnedFrom: s(input.learnedFrom),
      technique: s(input.technique),
      materials: s(input.materials),
      inspiration: s(input.inspiration),
      productName: s(input.productName, 160),
      tone,
    };
  })
  .handler(async ({ data }) => {
    const { generateStructured } = await import("@/lib/ai-gateway.server");
    const length =
      data.tone === "short" ? "about 60 words" : data.tone === "professional" ? "about 120 words" : "about 150 words";
    const facts = Object.entries(data)
      .filter(([k, v]) => k !== "tone" && v)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    return generateStructured({
      instructions: `You write authentic craft stories for Indian artisans' product catalogues. Use ONLY the facts provided by the artisan; do not invent awards, family names or numbers. Write in first-person-adjacent third person about the artisan, ${data.tone} tone, ${length}. Then provide a faithful, natural Telugu version in Telugu script.`,
      messages: [{ role: "user", content: `Artisan-provided information:\n${facts}` }],
      schema: storySchema,
    });
  });

const translationSchema = z.object({
  translation: z.string(),
  transliteration: z.string().describe("Romanised pronunciation when the target is Telugu, else empty string"),
});

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { text: string; to: "telugu" | "english" }) => {
    const text = typeof input?.text === "string" ? input.text.trim() : "";
    if (!text) throw new Error("Enter some text to translate.");
    if (text.length > 4000) throw new Error("Please translate up to 4,000 characters at a time.");
    return { text, to: input.to === "english" ? ("english" as const) : ("telugu" as const) };
  })
  .handler(async ({ data }) => {
    const { generateStructured } = await import("@/lib/ai-gateway.server");
    return generateStructured({
      instructions:
        data.to === "telugu"
          ? "Translate the artisan's English product or craft text into natural, fluent Telugu (Telugu script). Keep craft names (e.g. Kalamkari, Ikat) recognisable. Preserve meaning and tone; do not add content. Also give a romanised transliteration."
          : "Translate the artisan's Telugu text into clear, natural English suitable for an online product catalogue. Preserve meaning and tone; do not add content. Leave transliteration as an empty string.",
      messages: [{ role: "user", content: data.text }],
      schema: translationSchema,
    });
  });
