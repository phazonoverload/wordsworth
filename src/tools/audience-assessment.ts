import { callAI } from '@/ai/client'

interface AudienceAssessmentResponse {
  assessment: string
}

export async function assessAudience(content: string, audienceDescription: string): Promise<string> {
  const system = `You are a writing coach assessing whether a piece of writing is well-suited for its target audience. Consider:
- Whether technical jargon and domain terminology are appropriate (domain experts EXPECT technical terms — don't penalize their use for technical audiences)
- Whether sentence structure and complexity match the audience's expectations
- Whether the writing assumes knowledge the audience would or wouldn't have
- The overall tone and accessibility

Provide a concise one-paragraph verdict. Be specific about what works and what could be improved. If the writing is well-matched, say so clearly.`

  const prompt = `Target audience: ${audienceDescription}

Document:
${content}`

  const result = await callAI<AudienceAssessmentResponse>({
    action: 'audience-assessment',
    system,
    prompt,
  })

  return result.assessment
}
