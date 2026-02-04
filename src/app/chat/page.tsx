'use client'

/**
 * 聊天页面
 */

import { useChatStore } from '@/stores'
import { MessageList, ChatInput } from '@/components/chat'

export default function ChatPage() {
  const { messages, isProcessing, addMessage, setProcessing } = useChatStore()

  const handleSendMessage = async (content: string, images?: File[]) => {
    // 添加用户消息
    addMessage({
      role: 'user',
      content,
    })

    setProcessing(true)

    try {
      // 调用API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: '你是AI Director，一个智能短剧制作助手。你可以帮助用户创作剧本、设计角色、规划场景。' },
            { role: 'user', content },
          ],
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error('API请求失败')
      }

      const data = await response.json()

      // 添加助手消息
      addMessage({
        role: 'assistant',
        content: data.content,
      })
    } catch (error) {
      console.error('发送消息失败:', error)
      addMessage({
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后重试。',
      })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 头部 */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">AI Director</h1>
            <p className="text-sm text-slate-500">智能短剧制作助手</p>
          </div>
          <nav className="flex gap-4">
            <a
              href="/settings"
              className="text-sm text-slate-600 hover:text-primary-600"
            >
              设置
            </a>
          </nav>
        </div>
      </header>

      {/* 消息列表 */}
      <MessageList messages={messages} isProcessing={isProcessing} />

      {/* 输入区域 */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isProcessing} />
    </div>
  )
}
