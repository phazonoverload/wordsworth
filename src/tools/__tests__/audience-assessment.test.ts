import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/ai/client', () => ({
  callAI: vi.fn(),
}))

import { assessAudience } from '@/tools/audience-assessment'
import { callAI } from '@/ai/client'

describe('assessAudience', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls callAI with audience-assessment action', async () => {
    const mockCallAI = vi.mocked(callAI)
    mockCallAI.mockResolvedValue({ assessment: 'Well-suited.' })

    await assessAudience('Some text', 'Senior developers')

    expect(mockCallAI).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'audience-assessment' })
    )
  })

  it('includes audience description in prompt', async () => {
    const mockCallAI = vi.mocked(callAI)
    mockCallAI.mockResolvedValue({ assessment: 'Well-suited.' })

    await assessAudience('Some text', 'Junior developers')

    const call = mockCallAI.mock.calls[0]![0]
    expect(call.prompt).toContain('Junior developers')
  })

  it('includes document content in prompt', async () => {
    const mockCallAI = vi.mocked(callAI)
    mockCallAI.mockResolvedValue({ assessment: 'Well-suited.' })

    await assessAudience('My document content here', 'General audience')

    const call = mockCallAI.mock.calls[0]![0]
    expect(call.prompt).toContain('My document content here')
  })

  it('returns the assessment string', async () => {
    const mockCallAI = vi.mocked(callAI)
    mockCallAI.mockResolvedValue({ assessment: 'This is well-matched.' })

    const result = await assessAudience('Text', 'Audience')
    expect(result).toBe('This is well-matched.')
  })
})
