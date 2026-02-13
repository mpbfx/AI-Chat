export type VirtualRangeInput = {
  itemCount: number
  scrollTop: number
  viewportHeight: number
  overscan: number
  estimateHeight: number
  heightMap?: Map<number, number>
}

export type VirtualRangeResult = {
  startIndex: number
  endIndex: number
  paddingTop: number
  paddingBottom: number
  totalHeight: number
}

const getItemHeight = (
  index: number,
  estimateHeight: number,
  heightMap?: Map<number, number>
): number => {
  const measured = heightMap?.get(index)
  if (measured && measured > 0) {
    return measured
  }

  return estimateHeight
}

export const calculateVirtualRange = ({
  itemCount,
  scrollTop,
  viewportHeight,
  overscan,
  estimateHeight,
  heightMap
}: VirtualRangeInput): VirtualRangeResult => {
  if (itemCount <= 0) {
    return {
      startIndex: 0,
      endIndex: -1,
      paddingTop: 0,
      paddingBottom: 0,
      totalHeight: 0
    }
  }

  const safeScrollTop = Math.max(0, scrollTop)
  const safeViewportHeight = Math.max(0, viewportHeight)
  const safeOverscan = Math.max(0, overscan)

  const offsets = new Array<number>(itemCount + 1)
  offsets[0] = 0

  for (let i = 0; i < itemCount; i++) {
    offsets[i + 1] = offsets[i] + getItemHeight(i, estimateHeight, heightMap)
  }

  const totalHeight = offsets[itemCount]
  const visibleTop = safeScrollTop
  const visibleBottom = safeScrollTop + safeViewportHeight

  let start = 0
  while (start < itemCount && offsets[start + 1] <= visibleTop) {
    start += 1
  }

  let end = start
  while (end < itemCount && offsets[end] < visibleBottom) {
    end += 1
  }
  end = Math.max(start, end - 1)

  const startIndex = Math.max(0, start - safeOverscan)
  const endIndex = Math.min(itemCount - 1, end + safeOverscan)

  return {
    startIndex,
    endIndex,
    paddingTop: offsets[startIndex],
    paddingBottom: totalHeight - offsets[endIndex + 1],
    totalHeight
  }
}
