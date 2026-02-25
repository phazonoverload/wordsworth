import { callAI } from '@/ai/client'
import type { PromiseResult, Promise as PromiseItem } from './types'

interface PromiseResponse {
  promises: Array<{ text: string }>
  verdicts: Array<{
    promiseIndex: number
    verdict: 'pass' | 'fail' | 'partial'
    evidence: string
  }>
}

export async function trackPromises(text: string): Promise<PromiseResult> {
  const system = [
    'You are an editorial analyst. Your task is to identify promises and claims made in the introduction of the provided text,',
    'then check whether each promise is fulfilled in the body and conclusion.',
    'For each promise, provide a verdict:',
    '- "pass" if the promise is fully fulfilled in the text,',
    '- "fail" if the promise is not addressed or delivered on,',
    '- "partial" if the promise is only partially addressed.',
    'Provide evidence from the text supporting each verdict.',
  ].join('\n')

  const object = await callAI<PromiseResponse>({
    action: 'promise-tracker',
    system,
    prompt: text,
  })

  const promises: PromiseItem[] = object.promises.map((p) => ({
    id: crypto.randomUUID(),
    text: p.text,
  }))

  const verdicts = object.verdicts.map((v) => ({
    promiseId: promises[v.promiseIndex]!.id,
    verdict: v.verdict,
    evidence: v.evidence,
  }))

  return {
    type: 'promise-tracker',
    promises,
    verdicts,
  }
}
