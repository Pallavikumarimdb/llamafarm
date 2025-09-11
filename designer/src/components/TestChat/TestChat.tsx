import { useCallback, useEffect, useRef, useState } from 'react'
import FontIcon from '../../common/FontIcon'
import useChatbox from '../../hooks/useChatbox'
import { ChatboxMessage } from '../../types/chatbox'

export interface TestChatProps {
  showReferences: boolean
  allowRanking: boolean
  useTestData?: boolean
}

const containerClasses =
  // Match page background with clear outlines
  'w-full h-full flex flex-col rounded-xl border border-border bg-background text-foreground'

const inputContainerClasses =
  'flex flex-col gap-2 p-3 md:p-4 bg-background/60 border-t border-border rounded-b-xl'

const textareaClasses =
  'w-full h-auto min-h-[3rem] md:min-h-[3.5rem] resize-none bg-transparent border-none placeholder-opacity-60 focus:outline-none focus:ring-0 font-sans text-sm md:text-base leading-relaxed overflow-y-auto text-foreground placeholder-foreground/60'

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
      Start testing your tuned model by sending a message…
    </div>
  )
}

export default function TestChat({
  showReferences,
  allowRanking,
  useTestData,
}: TestChatProps) {
  const {
    messages,
    inputValue,
    isSending,
    isClearing,
    error,
    sendMessage,
    clearChat,
    updateInput,
    hasMessages,
    canSend,
    addMessage,
    updateMessage,
  } = useChatbox()

  // Mock mode controlled by parent
  const MOCK_MODE = Boolean(useTestData)

  const listRef = useRef<HTMLDivElement | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // Auto-grow textarea up to a comfortable max height before scrolling
  const resizeTextarea = useCallback(() => {
    const el = inputRef.current
    if (!el) return
    const maxHeight = 220 // ~6 lines depending on line-height
    el.style.height = 'auto'
    const newHeight = Math.min(el.scrollHeight, maxHeight)
    el.style.height = `${newHeight}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [])

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    } else if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  // Resize textarea on mount and input changes
  useEffect(() => {
    resizeTextarea()
  }, [inputValue, resizeTextarea])

  const handleSend = useCallback(async () => {
    const content = inputValue.trim()
    if (!canSend || !content) return
    if (MOCK_MODE) {
      // Local-only optimistic flow without backend
      addMessage({ type: 'user', content, timestamp: new Date() })
      const assistantId = addMessage({
        type: 'assistant',
        content: 'Thinking…',
        timestamp: new Date(),
        isLoading: true,
      })
      updateInput('')
      setTimeout(() => {
        const mockAnswer = `Here is a mock response to: "${content}"\n\n- Point A\n- Point B\n\nThis is sample output while backend is disconnected.`
        updateMessage(assistantId, {
          content: mockAnswer,
          isLoading: false,
          sources: [
            {
              source: 'dataset/manuals/aircraft_mx_guide.pdf',
              score: 0.83,
              content:
                'Hydraulic pressure drops during taxi often indicate minor leaks or entrained air. Inspect lines and fittings.',
            },
            {
              source: 'dataset/bulletins/bulletin-2024-17.md',
              score: 0.71,
              content:
                'Pressure sensor calibration drifts were reported in batch 24B. Verify calibration if readings fluctuate.',
            },
          ],
        })
      }, 350)
      return
    }

    const ok = await sendMessage(content)
    if (ok) updateInput('')
  }, [canSend, inputValue, sendMessage, updateInput])

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Wire lightweight global events for Retry and Use-as-prompt
  useEffect(() => {
    const onRetry = (e: Event) => {
      const detail = (e as CustomEvent).detail as { id: string }
      // For now, simply re-send the last user message
      const lastUser = [...messages].reverse().find(m => m.type === 'user')
      if (lastUser) {
        updateInput(lastUser.content)
        setTimeout(() => handleSend(), 0)
      }
    }
    const onUse = (e: Event) => {
      const detail = (e as CustomEvent).detail as { content: string }
      updateInput(detail.content || '')
    }
    window.addEventListener('lf-chat-retry', onRetry as EventListener)
    window.addEventListener('lf-chat-use-as-prompt', onUse as EventListener)
    return () => {
      window.removeEventListener('lf-chat-retry', onRetry as EventListener)
      window.removeEventListener(
        'lf-chat-use-as-prompt',
        onUse as EventListener
      )
    }
  }, [messages, updateInput, handleSend])

  return (
    <div className={containerClasses}>
      {/* Header row actions */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-border rounded-t-xl bg-background/50">
        <div className="text-xs md:text-sm text-muted-foreground">Session</div>
        <button
          type="button"
          onClick={() => clearChat()}
          disabled={isClearing}
          className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClearing ? 'Clearing…' : 'Clear'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-xs">
          {error}
        </div>
      )}

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 md:p-4">
        <div className="flex flex-col gap-4">
          {!hasMessages ? (
            <EmptyState />
          ) : (
            messages.map((m: ChatboxMessage) => (
              <TestChatMessage
                key={m.id}
                message={m}
                showReferences={showReferences}
                allowRanking={allowRanking}
              />
            ))
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className={inputContainerClasses}>
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={e => updateInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          placeholder={
            isSending
              ? 'Waiting for response…'
              : 'Type a message and press Enter'
          }
          className={textareaClasses}
          aria-label="Message input"
        />
        <div className="flex items-center justify-between">
          {isSending && (
            <span className="text-xs text-muted-foreground">Sending…</span>
          )}
          <FontIcon
            isButton
            type="arrow-filled"
            className={`w-8 h-8 self-end ${!canSend ? 'text-muted-foreground opacity-50' : 'text-primary'}`}
            handleOnClick={handleSend}
          />
        </div>
      </div>
    </div>
  )
}

interface TestChatMessageProps {
  message: ChatboxMessage
  showReferences: boolean
  allowRanking: boolean
}

function TestChatMessage({
  message,
  showReferences,
  allowRanking,
}: TestChatMessageProps) {
  const isUser = message.type === 'user'
  const isAssistant = message.type === 'assistant'
  const [thumb, setThumb] = useState<null | 'up' | 'down'>(null)

  // Load persisted thumb for this message
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const key = `lf_thumb_${message.id}`
      const saved = localStorage.getItem(key)
      if (saved === 'up' || saved === 'down') setThumb(saved)
    } catch {}
  }, [message.id])

  const onThumb = useCallback(
    (kind: 'up' | 'down') => {
      setThumb(prev => {
        const next = prev === kind ? null : kind
        try {
          const key = `lf_thumb_${message.id}`
          if (next) localStorage.setItem(key, next)
          else localStorage.removeItem(key)
        } catch {}
        return next
      })
    },
    [message.id]
  )

  return (
    <div
      className={`flex flex-col ${isUser ? 'self-end' : ''}`}
      style={{ maxWidth: isUser ? 'min(88%, 900px)' : 'min(92%, 900px)' }}
    >
      <div
        className={
          isUser
            ? 'px-4 py-3 md:px-4 md:py-3 rounded-lg bg-primary/10 text-foreground'
            : isAssistant
              ? 'px-0 md:px-0 text-[15px] md:text-base leading-relaxed text-foreground/90'
              : 'px-4 py-3 rounded-lg bg-muted text-foreground'
        }
      >
        {message.isLoading && isAssistant ? (
          <TypingDots label="Thinking" />
        ) : (
          message.content
        )}
      </div>

      {/* Assistant footer actions */}
      {isAssistant && (
        <div className="mt-2 flex items-center gap-2 text-muted-foreground">
          {allowRanking && (
            <>
              <ThumbButton
                kind="up"
                active={thumb === 'up'}
                onClick={() => onThumb('up')}
              />
              <ThumbButton
                kind="down"
                active={thumb === 'down'}
                onClick={() => onThumb('down')}
              />
              <span className="mx-1 opacity-40">•</span>
            </>
          )}
          {/* Copy button removed */}
          <span className="opacity-40">•</span>
          <ActionLink
            label="Retry"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('lf-chat-retry', { detail: { id: message.id } })
              )
            }
          />
          <span className="opacity-40">/</span>
          <ActionLink
            label="Use as prompt"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('lf-chat-use-as-prompt', {
                  detail: { content: message.content },
                })
              )
            }
          />
        </div>
      )}

      {/* References */}
      {showReferences &&
        isAssistant &&
        Array.isArray(message.sources) &&
        message.sources.length > 0 && <References sources={message.sources} />}
    </div>
  )
}

function ThumbButton({
  kind,
  active,
  onClick,
}: {
  kind: 'up' | 'down'
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 group">
      <FontIcon
        isButton
        type={
          kind === 'up'
            ? active
              ? 'thumbs-up-filled'
              : 'thumbs-up'
            : active
              ? 'thumbs-down-filled'
              : 'thumbs-down'
        }
        className={`w-5 h-5 ${active ? 'text-teal-500' : 'text-muted-foreground group-hover:text-foreground'}`}
      />
    </button>
  )
}

// Copy button removed

function ActionLink({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="text-xs hover:underline">
      {label}
    </button>
  )
}

function References({ sources }: { sources: any[] }) {
  const [open, setOpen] = useState<boolean>(true)
  const count = sources.length
  return (
    <div className="mt-2 rounded-md border border-border bg-card/40">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-accent/40 rounded-t-md focus:outline-none focus:ring-2 focus:ring-primary/60"
        aria-expanded={open}
        aria-controls={`references-panel`}
      >
        <span className="font-medium">References ({count})</span>
        <span className="text-[11px]">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div id="references-panel" className="divide-y divide-border">
          {sources.map((s, idx) => (
            <div key={idx} className="px-3 py-2">
              {s.content && (
                <div className="text-sm text-foreground whitespace-pre-wrap line-clamp-2">
                  {s.content}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <div className="truncate">
                  {s.source || s.metadata?.source || 'source'}
                </div>
                {typeof s.score === 'number' && (
                  <span className="ml-2 text-[11px]">
                    {(s.score * 100).toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TypingDots({ label = 'Thinking' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 opacity-80">
      <span>{label}</span>
      <span className="animate-pulse">.</span>
      <span className="animate-pulse [animation-delay:150ms]">.</span>
      <span className="animate-pulse [animation-delay:300ms]">.</span>
    </span>
  )
}
