'use client'

/**
 * 聊天页面 - 集成剧本生成流程
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChatStore } from '@/stores'
import { MessageList, ChatInput } from '@/components/chat'
import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { CheckCircle, Play } from 'lucide-react'
import { MessageRole, DraftStatus } from '@/types'

export default function ChatPage() {
  const router = useRouter()
  const { messages, isProcessing, currentDraft, addMessage, setProcessing, setCurrentDraft } =
    useChatStore()

  const [showDraftCard, setShowDraftCard] = useState(false)

  const handleSendMessage = async (content: string, images?: File[]) => {
    // 添加用户消息
    addMessage({
      role: MessageRole.USER,
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
            {
              role: 'system',
              content:
                '你是AI Director，一个智能短剧制作助手。你可以帮助用户创作剧本、设计角色、规划场景。',
            },
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
        role: MessageRole.ASSISTANT,
        content: data.content,
      })

      // 检测是否包含剧本生成意图
      const isVideoIntent =
        content.includes('生成') ||
        content.includes('制作') ||
        content.includes('短剧') ||
        content.includes('剧本') ||
        content.includes('视频')

      if (isVideoIntent) {
        // 模拟生成剧本草稿（实际应该调用API）
        setTimeout(() => {
          const mockDraft = {
            id: `draft-${Date.now()}`,
            title: 'AI生成的短剧',
            genre: '爱情',
            episodes: 3,
            characters: [
              {
                name: '主角A',
                description: '勇敢善良的年轻人',
                appearance: '英俊潇洒',
                personality: '乐观向上',
              },
              {
                name: '主角B',
                description: '聪明机智的伙伴',
                appearance: '美丽动人',
                personality: '温柔体贴',
              },
            ],
            scenes: [
              {
                id: 'scene-1',
                episodeNumber: 1,
                sceneNumber: 1,
                location: '咖啡馆',
                description: '初次相遇的温馨场景',
                dialogue: [
                  { character: '主角A', text: '你好，很高兴认识你' },
                  { character: '主角B', text: '我也是' },
                ],
                action: '两人握手',
                duration: 30,
              },
            ],
            status: DraftStatus.PENDING_REVIEW,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          setCurrentDraft(mockDraft)
          setShowDraftCard(true)
          setProcessing(false)
        }, 1000)
      } else {
        setProcessing(false)
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      addMessage({
        role: MessageRole.ASSISTANT,
        content: '抱歉，发生了错误。请稍后重试。',
      })
      setProcessing(false)
    }
  }

  const handleReviewDraft = () => {
    if (currentDraft) {
      router.push(`/screenplay-review?draftId=${currentDraft.id}`)
    }
  }

  const handleDismissDraft = () => {
    setShowDraftCard(false)
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
            <a href="/settings" className="text-sm text-slate-600 hover:text-primary-600">
              设置
            </a>
          </nav>
        </div>
      </header>

      {/* 消息列表 */}
      <MessageList messages={messages} isProcessing={isProcessing} />

      {/* 剧本草稿卡片 */}
      {showDraftCard && currentDraft && (
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <Card className="border-primary-200 bg-gradient-to-r from-primary-50 to-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    剧本草稿已生成！
                  </h3>
                  <div className="space-y-1 text-sm text-slate-600 mb-4">
                    <p>
                      <span className="font-medium">标题：</span>
                      {currentDraft.title}
                    </p>
                    <p>
                      <span className="font-medium">类型：</span>
                      {currentDraft.genre} · {currentDraft.episodes}集 ·
                      {currentDraft.characters.length}个角色 · {currentDraft.scenes.length}个场景
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleReviewDraft}
                      className="bg-primary-600 hover:bg-primary-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      查看并确认
                    </Button>
                    <Button variant="ghost" onClick={handleDismissDraft}>
                      稍后再说
                    </Button>
                  </div>
                </div>
                <button
                  onClick={handleDismissDraft}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ×
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 输入区域 */}
      <ChatInput onSendMessage={handleSendMessage} disabled={isProcessing} />
    </div>
  )
}
