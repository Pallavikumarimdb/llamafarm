import { ChatboxMessage } from '../../types/chatbox'

export interface MessageProps {
  message: ChatboxMessage
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const { type, content, isLoading, isStreaming } = message

  // Minimal markdown renderer for bold and inline code with HTML escaping
  const renderMarkdown = (text: string): { __html: string } => {
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    // Escape first
    let html = escapeHtml(text)
    // Inline code `code`
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="px-1 py-0.5 rounded bg-muted/60">$1</code>'
    )
    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic *text* (after bold so it does not conflict)
    html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // Preserve line breaks
    html = html.replace(/\n/g, '<br/>')
    return { __html: html }
  }

  const getMessageStyles = (): string => {
    const baseStyles = 'flex flex-col mb-4'

    switch (type) {
      case 'user':
        return `${baseStyles} self-end max-w-[80%] md:max-w-[90%]`
      default:
        return baseStyles
    }
  }

  const getContentStyles = (): string => {
    const baseBubble = 'px-4 py-3 md:px-4 md:py-3 rounded-lg'

    switch (type) {
      case 'user':
        return `${baseBubble} bg-secondary text-foreground text-base leading-relaxed`
      case 'assistant':
        return 'text-[15px] md:text-base leading-relaxed text-foreground/90'
      case 'system':
        return `${baseBubble} bg-green-500 text-white rounded-2xl border-green-500 italic`
      case 'error':
        return `${baseBubble} bg-red-500 text-white rounded-2xl rounded-bl-sm border-red-500`
      default:
        return `${baseBubble} bg-muted text-foreground`
    }
  }

  return (
    <div className={getMessageStyles()}>
      <div className={getContentStyles()}>
        {type === 'assistant' ? (
          isLoading ? (
            <span className="italic opacity-70">{content}</span>
          ) : (
            <span
              className="whitespace-pre-wrap"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={renderMarkdown(content)}
            />
          )
        ) : (
          <span className="whitespace-pre-wrap">{content}</span>
        )}
        {isStreaming && type === 'assistant' && (
          <span className="inline-block ml-1 w-2 h-5 bg-current animate-pulse" />
        )}
      </div>
    </div>
  )
}

export default Message
