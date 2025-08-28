import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import FontIcon from '../../common/FontIcon'

type Toast = {
  id: number
  message: string
  variant?: 'default' | 'destructive'
}

let pushToast: ((t: Omit<Toast, 'id'>) => void) | null = null

export function useToast() {
  return {
    toast: (opts: Omit<Toast, 'id'>) => {
      pushToast?.(opts)
    },
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])
  useEffect(() => {
    pushToast = ({ message, variant }) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, variant }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    }
    return () => {
      pushToast = null
    }
  }, [])

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'min-w-[320px] max-w-[420px] rounded-lg border shadow-lg ring-1 ring-black/5 bg-card text-card-foreground px-4 py-3.5 flex items-center gap-3',
            t.variant === 'destructive'
              ? 'border-destructive/50'
              : 'border-teal-600/40'
          )}
        >
          <div
            className={cn(
              'w-7 h-7 rounded-full grid place-items-center',
              t.variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground'
                : 'bg-teal-600 text-teal-50 dark:bg-teal-400 dark:text-teal-900'
            )}
          >
            <FontIcon
              type={t.variant === 'destructive' ? 'close' : 'checkmark-filled'}
              className="w-4 h-4"
            />
          </div>
          <div className="text-sm md:text-base leading-5">{t.message}</div>
        </div>
      ))}
    </div>
  )
}
