/**
 * 消息气泡组件
 */

import { MessageRole } from '@/types'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  role: MessageRole
  content: string
  timestamp?: Date
  isStreaming?: boolean
}

export function MessageBubble({ role, content, timestamp, isStreaming }: MessageBubbleProps) {
  const isUser = role === MessageRole.USER
  const isSystem = role === MessageRole.SYSTEM

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex gap-3 mb-4 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <Avatar
        fallback={isUser ? '我' : 'AI'}
        className={cn(
          'shrink-0',
          isUser ? 'bg-primary-600 text-white' : 'bg-slate-200'
        )}
      />
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary-600 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
        )}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
        {isStreaming && (
          <div className="mt-1">
            <span className="inline-block w-2 h-2 bg-current opacity-50 animate-pulse" />
          </div>
        )}
        {timestamp && (
          <div
            className={cn(
              'text-xs mt-1 opacity-70',
              isUser ? 'text-white' : 'text-slate-500'
            )}
          >
            {new Date(timestamp).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  )
}
