import { useCallback, useRef } from 'react'

interface StickyScrollOptions {
  threshold?: number
}

export function useStickyScroll<T extends HTMLElement>({
  threshold = 48,
}: StickyScrollOptions = {}) {
  const containerRef = useRef<T | null>(null)
  const isFollowingRef = useRef(true)
  const justStartedResponseRef = useRef(false)
  const programmaticScrollRef = useRef(false)

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el || programmaticScrollRef.current) return

    const distanceFromBottom =
      el.scrollHeight - (el.scrollTop + el.clientHeight)

    if (distanceFromBottom > threshold) {
      if (isFollowingRef.current) {
        isFollowingRef.current = false
        justStartedResponseRef.current = false
      }
    } else if (!isFollowingRef.current) {
      isFollowingRef.current = true
    }
  }, [threshold])

  const resetProgrammaticFlag = useCallback(() => {
    programmaticScrollRef.current = false
  }, [])

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      const el = containerRef.current
      if (!el) return

      programmaticScrollRef.current = true
      if (behavior === 'smooth') {
        el.scrollTo({ top: el.scrollHeight, behavior })
      } else {
        el.scrollTop = el.scrollHeight
      }

      requestAnimationFrame(resetProgrammaticFlag)
    },
    [resetProgrammaticFlag]
  )

  const maybeScrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      if (justStartedResponseRef.current || isFollowingRef.current) {
        scrollToBottom(behavior)
      }
    },
    [scrollToBottom]
  )

  const markResponseStart = useCallback(() => {
    justStartedResponseRef.current = true
    isFollowingRef.current = true
  }, [])

  const markStreamComplete = useCallback(() => {
    justStartedResponseRef.current = false
  }, [])

  const enableFollow = useCallback(() => {
    isFollowingRef.current = true
  }, [])

  return {
    containerRef,
    handleScroll,
    scrollToBottom,
    maybeScrollToBottom,
    markResponseStart,
    markStreamComplete,
    enableFollow,
    isFollowingRef,
  }
}

export default useStickyScroll
