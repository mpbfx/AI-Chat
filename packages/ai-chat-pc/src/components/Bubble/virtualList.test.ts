import { describe, expect, it } from 'vitest'

import { calculateVirtualRange } from './virtualList'

describe('calculateVirtualRange', () => {
  it('returns empty range when item count is 0', () => {
    const result = calculateVirtualRange({
      itemCount: 0,
      scrollTop: 0,
      viewportHeight: 400,
      overscan: 2,
      estimateHeight: 80
    })

    expect(result.startIndex).toBe(0)
    expect(result.endIndex).toBe(-1)
    expect(result.paddingTop).toBe(0)
    expect(result.paddingBottom).toBe(0)
    expect(result.totalHeight).toBe(0)
  })

  it('calculates range for fixed estimated heights', () => {
    const result = calculateVirtualRange({
      itemCount: 100,
      scrollTop: 400,
      viewportHeight: 240,
      overscan: 1,
      estimateHeight: 80
    })

    expect(result.startIndex).toBe(4)
    expect(result.endIndex).toBe(8)
    expect(result.paddingTop).toBe(320)
    expect(result.totalHeight).toBe(8000)
    expect(result.paddingBottom).toBe(7280)
  })

  it('supports measured height overrides', () => {
    const result = calculateVirtualRange({
      itemCount: 5,
      scrollTop: 120,
      viewportHeight: 120,
      overscan: 0,
      estimateHeight: 60,
      heightMap: new Map([
        [0, 20],
        [1, 120],
        [2, 40],
        [3, 100],
        [4, 80]
      ])
    })

    expect(result.startIndex).toBe(1)
    expect(result.endIndex).toBe(3)
    expect(result.paddingTop).toBe(20)
    expect(result.totalHeight).toBe(360)
    expect(result.paddingBottom).toBe(80)
  })
})
