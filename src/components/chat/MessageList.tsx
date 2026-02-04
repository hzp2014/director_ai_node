/**
 * 消息列表组件
 */

import { useEffect, useRef } from 'react'
import { ChatMessage } from '@/types'
import { MessageBubble } from './MessageBubble'
import { ScrollArea } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui'

interface MessageListProps {
  messages: ChatMessage[]
  isProcessing?: boolean
}

export function MessageList({ messages, isProcessing }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isProcessing])

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 px-4 py-6">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <span className="text-4xl">🎬</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              欢迎使用 AI Director
            </h2>
            <p className="text-slate-500 max-w-md">
              告诉我你想创作什么类型的短剧，我会帮你生成剧本、设计角色、制作视频
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
              {[
                { icon: '💕', title: '爱情剧', desc: '浪漫甜蜜的爱情故事' },
                { icon: '🔍', title: '悬疑剧', desc: '扣人心弦的推理故事' },
                { icon: '😂', title: '喜剧', desc: '轻松搞笑的日常剧情' },
              ].map((item) => (
                <button
                  key={item.title}
                  className="p-4 bg-white border border-slate-200 rounded-xl hover:border-primary-500 hover:shadow-md transition-all text-left"
                  onClick={() => {
                    // 这里应该发送预设消息
                    console.log(`选择了${item.title}`)
                  }}
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="font-medium text-slate-800">{item.title}</div>
                  <div className="text-sm text-slate-500">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
                isStreaming={message.isStreaming}
              />
            ))}
            {isProcessing && (
              <div className="flex gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                  <span className="text-sm font-medium">AI</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
                  <LoadingSpinner size="sm" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </>
        )}
      </div>
    </ScrollArea>
  )
}
