type ClosableEventSource = {
  close: () => void
}

type EventSourceRefLike = {
  current: ClosableEventSource | null
}

type StopGenerationOptions = {
  eventSourceRef: EventSourceRefLike
  setInputLoading: (loading: boolean) => void
  notifyStopped?: () => void
}

export const closeActiveEventSource = (eventSourceRef: EventSourceRefLike): boolean => {
  if (!eventSourceRef.current) {
    return false
  }

  eventSourceRef.current.close()
  eventSourceRef.current = null
  return true
}

export const stopGeneration = ({
  eventSourceRef,
  setInputLoading,
  notifyStopped
}: StopGenerationOptions): boolean => {
  const stopped = closeActiveEventSource(eventSourceRef)
  setInputLoading(false)

  if (stopped) {
    notifyStopped?.()
  }

  return stopped
}
