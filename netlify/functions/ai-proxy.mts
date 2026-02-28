import type { Context, Config } from "@netlify/functions"
import { generateObject } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { SCHEMAS } from "../../src/ai/schemas"
import type { ActionId } from "../../src/ai/schemas"

const SUPPORTED_PROVIDERS = ["openai", "anthropic", "google"] as const
type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number]

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
