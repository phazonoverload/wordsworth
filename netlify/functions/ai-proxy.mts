import type { Context, Config } from "@netlify/functions"
import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"

const SUPPORTED_PROVIDERS = ["openai", "anthropic", "google"] as const
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number]

// Schemas for each action — these mirror the ones in the frontend tools
const SCHEMAS = {
  "cut-twenty": z.object({
    chunks: z.array(
      z.object({
        original: z.string().describe("The original text segment"),
        edited: z.string().describe("The condensed version"),
        reason: z.string().describe("Why this edit was made"),
      })
    ),
  }),
  "fix-single": z.object({
    editedParagraph: z
      .string()
      .describe("The paragraph with the style issue fixed"),
  }),
  "fix-all": z.object({
    editedDocument: z
      .string()
      .describe("The full document with all flagged style issues fixed"),
  }),
  "promise-tracker": z.object({
    promises: z.array(
      z.object({
        text: z
          .string()
          .describe("The promise or claim made in the introduction"),
      })
    ),
    verdicts: z.array(
      z.object({
        promiseIndex: z
          .number()
          .describe("Index of the promise this verdict is for"),
        verdict: z
          .enum(["pass", "fail", "partial"])
          .describe("Whether the promise was fulfilled"),
        evidence: z
          .string()
          .describe("Evidence supporting the verdict"),
      })
    ),
  }),
} as const

type ActionId = keyof typeof SCHEMAS

function createModel(provider: SupportedProvider, model: string, apiKey: string) {
  switch (provider) {
    case "openai":
      return createOpenAI({ apiKey })(model)
    case "anthropic":
      return createAnthropic({ apiKey })(model)
    case "google":
      return createGoogleGenerativeAI({ apiKey })(model)
  }
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  let body: {
    action: string
    provider: string
    model: string
    apiKey: string
    system: string
    prompt: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { action, provider, model, apiKey, system, prompt } = body

  if (!action || !provider || !model || !apiKey || !system || !prompt) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: action, provider, model, apiKey, system, prompt" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!SUPPORTED_PROVIDERS.includes(provider as SupportedProvider)) {
    return new Response(
      JSON.stringify({ error: `Unsupported provider: ${provider}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!(action in SCHEMAS)) {
    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    const languageModel = createModel(provider as SupportedProvider, model, apiKey)
    const schema = SCHEMAS[action as ActionId]

    const { object } = await generateObject({
      model: languageModel,
      schema,
      system,
      prompt,
    })

    return new Response(JSON.stringify(object), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(
      JSON.stringify({ error: message }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }
}

export const config: Config = {
  path: "/api/ai",
}
