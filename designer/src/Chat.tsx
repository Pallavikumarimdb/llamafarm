import { useEffect, useRef, useState } from 'react'
import Chatbox from './components/Chatbox/Chatbox'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { ProjectUpgradeBanner } from './components/common/UpgradeBanners'
import { decodeMessageFromUrl } from './utils/homePageUtils'
// import { Button } from './components/ui/button'

function Chat() {
  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true)
  const [initialMessage, setInitialMessage] = useState<string | null>(null)
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const prevPanelOpenRef = useRef<boolean>(true)
  const [isMobile, setIsMobile] = useState<boolean>(false)
  const [mobileView, setMobileView] = useState<'chat' | 'project'>('project')
  // Track whether we auto-collapsed due to mid-width constraint
  const autoCollapsedRef = useRef<boolean>(false)
  // Tracks if the user explicitly chose mobile view this session
  const mobileUserChoiceRef = useRef<'chat' | 'project' | null>(null)
  const chatPanelRef = useRef<HTMLDivElement | null>(null)
  const [chatWidthPx, setChatWidthPx] = useState<number | null>(null)
  const isDraggingRef = useRef<boolean>(false)
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const dragRafRef = useRef<number | null>(null)
  const chatLeftRef = useRef<number>(0)

  // Handle initial message from URL parameters (from home page project creation)
  useEffect(() => {
    const initialMessageParam = searchParams.get('initialMessage')
    if (initialMessageParam) {
      const decodedMessage = decodeMessageFromUrl(initialMessageParam)
      if (decodedMessage) {
        setInitialMessage(decodedMessage)

        // Clear the URL parameter after handling to clean up the URL
        setSearchParams(params => {
          params.delete('initialMessage')
          return params
        })
      }
    }
  }, [searchParams, setSearchParams])

  // Close the designer chat panel when viewing the Test page, and restore previous state when leaving
  useEffect(() => {
    if (location.pathname.startsWith('/chat/test')) {
      // Save current state before closing
      prevPanelOpenRef.current = isPanelOpen
      setIsPanelOpen(false)
    } else {
      // Restore previous state when leaving /chat/test
      setIsPanelOpen(prevPanelOpenRef.current)
    }
  }, [location.pathname])

  // Detect mobile view (match md breakpoint ~ 768px)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const onChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in e ? e.matches : (e as MediaQueryList).matches
      setIsMobile(matches)
    }
    onChange(mql)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Initialize default chat width (25% of viewport) with min/max bounds when panel opens on desktop
  useEffect(() => {
    if (isMobile || !isPanelOpen) return
    const minPx = 360
    const maxPx = 820
    const def = Math.round(window.innerWidth * 0.25)
    const clamped = Math.max(minPx, Math.min(maxPx, def))
    setChatWidthPx(prev => (prev == null ? clamped : prev))
  }, [isMobile, isPanelOpen])

  // Cleanup drag listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', onDrag)
      document.removeEventListener('mouseup', stopDrag)
    }
  }, [])

  const startDrag: React.MouseEventHandler<HTMLDivElement> = e => {
    e.preventDefault()
    if (isMobile || !isPanelOpen) return
    isDraggingRef.current = true
    setIsDragging(true)
    if (chatPanelRef.current) {
      chatLeftRef.current = chatPanelRef.current.getBoundingClientRect().left
    }
    document.body.style.cursor = 'col-resize'
    ;(document.body.style as any).userSelect = 'none'
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  const onDrag = (e: MouseEvent) => {
    if (!isDraggingRef.current || !chatPanelRef.current) return
    const minPx = 360
    const maxPx = 820
    const proposed = e.clientX - chatLeftRef.current
    const next = Math.max(minPx, Math.min(maxPx, proposed))
    if (dragRafRef.current != null) cancelAnimationFrame(dragRafRef.current)
    dragRafRef.current = requestAnimationFrame(() => {
      if (chatPanelRef.current) chatPanelRef.current.style.width = `${next}px`
    })
  }

  const stopDrag = () => {
    isDraggingRef.current = false
    setIsDragging(false)
    if (chatPanelRef.current) {
      const rect = chatPanelRef.current.getBoundingClientRect()
      const minPx = 360
      const maxPx = 820
      const finalW = Math.max(minPx, Math.min(maxPx, rect.width))
      setChatWidthPx(finalW)
    }
    if (dragRafRef.current != null) cancelAnimationFrame(dragRafRef.current)
    dragRafRef.current = null
    document.body.style.cursor = ''
    ;(document.body.style as any).userSelect = ''
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
  }

  // Auto-collapse chat panel on mid-width screens to avoid over-squeezing project pane
  const wasOpenBeforeAutoCollapseRef = useRef<boolean>(true)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1100px)')
    const onChange = (e: MediaQueryListEvent) => {
      if (isMobile) return
      if (e.matches) {
        // Save current open state, then collapse
        wasOpenBeforeAutoCollapseRef.current = isPanelOpen
        setIsPanelOpen(false)
        autoCollapsedRef.current = true
      } else {
        // Restore to previously open state when widening
        setIsPanelOpen(wasOpenBeforeAutoCollapseRef.current)
        autoCollapsedRef.current = false
      }
    }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [isMobile, isPanelOpen])

  // Track user's last explicit preference for restoration
  useEffect(() => {
    prevPanelOpenRef.current = isPanelOpen
  }, [isPanelOpen])

  // On mobile entry/exit:
  // - default to Project on narrow if chat was auto-collapsed and user hasn't explicitly chosen Chat
  // - if user chose Chat on mobile, keep chat open when returning to wide
  useEffect(() => {
    if (isMobile) {
      if (mobileUserChoiceRef.current === 'chat') {
        setMobileView('chat')
      } else if (autoCollapsedRef.current) {
        setMobileView('project')
      }
    } else {
      if (mobileView === 'chat') setIsPanelOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  // Also reset to Project on route changes while on mobile (unless user explicitly selected Chat)
  useEffect(() => {
    if (isMobile && mobileUserChoiceRef.current !== 'chat') {
      setMobileView('project')
    }
  }, [isMobile, mobileView, location.pathname])

  // Listen to header toggles
  useEffect(() => {
    const onSet = (e: Event) => {
      try {
        const v = (e as CustomEvent<'chat' | 'project'>).detail
        if (v === 'chat' || v === 'project') {
          setMobileView(v)
          if (isMobile) mobileUserChoiceRef.current = v
        }
      } catch {}
    }
    window.addEventListener('lf:set-mobile-view', onSet as EventListener)
    return () =>
      window.removeEventListener('lf:set-mobile-view', onSet as EventListener)
  }, [isMobile])

  // Emit current mobile view for header to reflect state
  useEffect(() => {
    try {
      window.dispatchEvent(
        new CustomEvent('lf:mobile-view-changed', { detail: mobileView }) as any
      )
    } catch {}
  }, [mobileView])

  const effectivePanelOpen = isMobile ? true : isPanelOpen

  return (
    <div
      className="w-full h-full flex transition-colors bg-gray-200 dark:bg-blue-800 pt-12 md:pt-12"
      style={{
        paddingTop:
          isMobile &&
          location.pathname.startsWith('/chat') &&
          mobileView === 'project'
            ? ('6rem' as any)
            : undefined,
      }}
    >
      <ProjectUpgradeBanner />
      <div
        ref={chatPanelRef}
        className={`h-full ${isDragging ? 'transition-none' : 'transition-all duration-300'} relative ${
          isMobile
            ? mobileView === 'chat'
              ? 'w-full'
              : 'hidden'
            : effectivePanelOpen
              ? 'min-w-[360px]'
              : 'w-[47px]'
        }`}
        style={
          !isMobile && effectivePanelOpen
            ? {
                width: isDragging
                  ? undefined
                  : chatWidthPx != null
                    ? `${chatWidthPx}px`
                    : undefined,
                maxWidth: '820px',
              }
            : undefined
        }
      >
        <Chatbox
          isPanelOpen={effectivePanelOpen}
          setIsPanelOpen={setIsPanelOpen}
          initialMessage={initialMessage}
        />
        {/* Desktop drag handle for resizing chat panel */}
        {!isMobile && effectivePanelOpen ? (
          <div
            onMouseDown={startDrag}
            className="hidden md:flex items-center justify-center absolute top-0 right-0 h-full w-3 sm:w-4 cursor-col-resize"
            role="separator"
            aria-label="Resize chat panel"
            title="Drag to resize chat"
          >
            <div className="w-[2px] sm:w-[3px] h-12 rounded-full bg-border hover:bg-primary/60 transition-colors" />
          </div>
        ) : null}
      </div>

      <div
        className={`h-full ${
          isMobile
            ? mobileView === 'project'
              ? 'w-full'
              : 'hidden'
            : effectivePanelOpen
              ? 'flex-1'
              : 'flex-1'
        } text-gray-900 dark:text-white px-6 pt-6 overflow-auto min-h-0`}
      >
        <Outlet />
      </div>

      {/* Mobile switcher moved to header */}
    </div>
  )
}

export default Chat
