import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CutResult from '../../results/CutResult.vue'
import type { CutResult as CutResultType, DiffChunk } from '@/tools/types'

function makeChunk(overrides: Partial<DiffChunk> = {}): DiffChunk {
  return {
    id: 'chunk-1',
    original: 'This is the original text that is very wordy.',
    edited: 'This is concise text.',
    reason: 'Removed wordiness',
    accepted: null,
    ...overrides,
  }
}

function makeResult(chunks: DiffChunk[] = [makeChunk()]): CutResultType {
  return {
    type: 'cut-twenty',
    chunks,
    originalWordCount: 100,
    editedWordCount: 80,
    reductionPercent: 20,
  }
}

describe('CutResult', () => {
  it('displays original word count', () => {
    const wrapper = mount(CutResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('100')
  })

  it('displays edited word count', () => {
    const wrapper = mount(CutResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('80')
  })

  it('displays reduction percentage', () => {
    const wrapper = mount(CutResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('20%')
  })

  it('displays original text for each chunk', () => {
    const wrapper = mount(CutResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('This is the original text that is very wordy.')
  })

  it('displays edited text for each chunk', () => {
    const wrapper = mount(CutResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('This is concise text.')
  })

  it('displays reason for each chunk', () => {
    const wrapper = mount(CutResult, { props: { result: makeResult() } })
    expect(wrapper.text()).toContain('Removed wordiness')
  })

  it('has accept and reject buttons for each chunk', () => {
    const wrapper = mount(CutResult, { props: { result: makeResult() } })
    const acceptBtn = wrapper.find('[data-testid="accept-chunk-1"]')
    const rejectBtn = wrapper.find('[data-testid="reject-chunk-1"]')
    expect(acceptBtn.exists()).toBe(true)
    expect(rejectBtn.exists()).toBe(true)
  })

  it('emits accept event when accept button is clicked', async () => {
    const wrapper = mount(CutResult, { props: { result: makeResult() } })
    await wrapper.find('[data-testid="accept-chunk-1"]').trigger('click')
    expect(wrapper.emitted('accept')).toBeTruthy()
    expect(wrapper.emitted('accept')![0]).toEqual(['chunk-1'])
  })

  it('emits reject event when reject button is clicked', async () => {
    const wrapper = mount(CutResult, { props: { result: makeResult() } })
    await wrapper.find('[data-testid="reject-chunk-1"]').trigger('click')
    expect(wrapper.emitted('reject')).toBeTruthy()
    expect(wrapper.emitted('reject')![0]).toEqual(['chunk-1'])
  })

  it('displays multiple chunks', () => {
    const chunks = [
      makeChunk({ id: 'c1', original: 'First original' }),
      makeChunk({ id: 'c2', original: 'Second original' }),
    ]
    const wrapper = mount(CutResult, { props: { result: makeResult(chunks) } })
    expect(wrapper.text()).toContain('First original')
    expect(wrapper.text()).toContain('Second original')
  })
})
