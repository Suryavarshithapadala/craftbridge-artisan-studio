// Server-only helpers. Errors carry codes (AI_*) that the browser translates.
// for Lovable AI Gateway (OpenAI Responses via AI SDK).
import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText, type ModelMessage } from "ai";
import type { z } from "zod/v4";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";
const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
    const response = await fetch(input, { ...init, headers });
    runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
    return response;
  };
}

export class AiFeatureError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function statusOf(error: unknown): number | undefined {
  let current: unknown = error;
  for (let i = 0; i < 5 && current && typeof current === "object"; i++) {
    const c = current as { statusCode?: number; status?: number; cause?: unknown; lastError?: unknown };
    if (typeof c.statusCode === "number") return c.statusCode;
    if (typeof c.status === "number") return c.status;
    current = c.lastError ?? c.cause;
  }
  return undefined;
}

function friendlyError(error: unknown): AiFeatureError {
  const status = statusOf(error);
  if (status === 402)
    return new AiFeatureError("AI_CREDITS", 402);
  if (status === 429) return new AiFeatureError("AI_BUSY", 429);
  if (status === 403) return new AiFeatureError("AI_DENIED", 403);
  if (status === 401) return new AiFeatureError("AI_CONFIG", 401);
  if (status === 400) return new AiFeatureError("AI_BAD_INPUT", 400);
  console.error("AI gateway error", error);
  return new AiFeatureError("AI_FAILED", status ?? 500);
}

export async function generateStructured<T>(opts: {
  instructions: string;
  messages: ModelMessage[];
  schema: z.ZodType<T>;
  effort?: "low" | "medium";
}): Promise<T> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiFeatureError("AI_CONFIG", 500);

  const provider = createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: createRunIdFetch(),
  });

  let streamError: unknown;
  try {
    const result = streamText({
      model: provider.responses(MODEL),
      instructions: opts.instructions,
      messages: opts.messages,
      output: Output.object({ schema: opts.schema }),
      maxRetries: 1,
      onError: ({ error }) => {
        streamError = error;
      },
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: opts.effort ?? "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const output = await result.output;
    if (!output) throw streamError ?? new Error("Empty AI output");
    return output as T;
  } catch (error) {
    if (error instanceof AiFeatureError) throw error;
    throw friendlyError(streamError ?? error);
  }
}
