import { describe, expect, it, vi } from 'vitest'

import { closeActiveEventSource, stopGeneration } from './streamControl'

describe('streamControl', () => {
  it('closes and clears active event source', () => {
    const close = vi.fn()
    const eventSourceRef = {
      current: { close }
    }

    const result = closeActiveEventSource(eventSourceRef)

    expect(result).toBe(true)
    expect(close).toHaveBeenCalledTimes(1)
    expect(eventSourceRef.current).toBeNull()
  })

  it('returns false when no event source exists', () => {
    const eventSourceRef = {
      current: null
    }

    const result = closeActiveEventSource(eventSourceRef)

    expect(result).toBe(false)
  })

  it('stops generation and triggers notify only when stream is active', () => {
    const setInputLoading = vi.fn()
    const notifyStopped = vi.fn()
    const close = vi.fn()
    const eventSourceRef = {
      current: { close }
    }

    const result = stopGeneration({
      eventSourceRef,
      setInputLoading,
      notifyStopped
    })

    expect(result).toBe(true)
    expect(setInputLoading).toHaveBeenCalledWith(false)
    expect(notifyStopped).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('still clears loading state when stream is already closed', () => {
    const setInputLoading = vi.fn()
    const notifyStopped = vi.fn()
    const eventSourceRef = {
      current: null
    }

    const result = stopGeneration({
      eventSourceRef,
      setInputLoading,
      notifyStopped
    })

    expect(result).toBe(false)
    expect(setInputLoading).toHaveBeenCalledWith(false)
    expect(notifyStopped).not.toHaveBeenCalled()
  })
})
