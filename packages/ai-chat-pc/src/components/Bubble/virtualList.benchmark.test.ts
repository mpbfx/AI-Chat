import { describe, expect, it } from 'vitest'

import { calculateVirtualRange } from './virtualList'

type Scenario = {
  name: string
  itemCount: number
  scrollTop: number
  viewportHeight: number
  overscan: number
  estimateHeight: number
}

const scenarios: Scenario[] = [
  {
    name: '10k-top',
    itemCount: 10000,
    scrollTop: 0,
    viewportHeight: 720,
    overscan: 3,
    estimateHeight: 96
  },
  {
    name: '10k-middle',
    itemCount: 10000,
    scrollTop: 480000,
    viewportHeight: 720,
    overscan: 3,
    estimateHeight: 96
  },
  {
    name: '50k-deep',
    itemCount: 50000,
    scrollTop: 2400000,
    viewportHeight: 720,
    overscan: 3,
    estimateHeight: 96
  }
]

describe('virtual list quantification', () => {
  it('quantifies visible item reduction vs full render', () => {
    const rows = scenarios.map((scenario) => {
      const result = calculateVirtualRange(scenario)
      const virtualRendered =
        result.endIndex >= result.startIndex ? result.endIndex - result.startIndex + 1 : 0
      const fullRendered = scenario.itemCount
      const reduction = ((1 - virtualRendered / fullRendered) * 100).toFixed(2)

      return {
        scenario: scenario.name,
        fullRendered,
        virtualRendered,
        reductionPercent: `${reduction}%`
      }
    })

    console.table(rows)

    rows.forEach((row) => {
      expect(row.virtualRendered).toBeLessThan(20)
      expect(row.fullRendered).toBeGreaterThan(row.virtualRendered)
    })
  })

  it('measures range calculation cost under frequent scroll updates', () => {
    const base = scenarios[2]
    const iterations = 2000
    const step = 240

    const start = performance.now()
    for (let i = 0; i < iterations; i++) {
      calculateVirtualRange({
        ...base,
        scrollTop: base.scrollTop + i * step
      })
    }
    const end = performance.now()

    const totalMs = end - start
    const avgMs = totalMs / iterations

    console.log(
      `[virtual-range-bench] iterations=${iterations}, totalMs=${totalMs.toFixed(2)}, avgMs=${avgMs.toFixed(4)}`
    )

    expect(avgMs).toBeLessThan(3)
  })
})
