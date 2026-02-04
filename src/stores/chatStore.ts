/**
 * 聊天状态管理
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ChatMessage, UserImage, ScreenplayDraft } from '@/types'

interface ChatState {
  // 状态
  messages: ChatMessage[]
  userImages: UserImage[]
  currentDraft: ScreenplayDraft | null
  isProcessing: boolean

  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  updateUserMessage: (messageId: string, content: string) => void
  addUserImage: (image: UserImage) => void
  removeUserImage: (imageId: string) => void
  clearChat: () => void
  setProcessing: (processing: boolean) => void
  setCurrentDraft: (draft: ScreenplayDraft | null) => void

  // 视频生成流程
  generateScreenplayDraft: (userPrompt: string) => Promise<void>
  generateCharacterSheets: () => Promise<void>
  generateScreenplayMedia: () => Promise<void>

  // 工具方法
  isVideoGenerationIntent: (text: string) => boolean
}

export const useChatStore = create<ChatState>()(
  immer((set, get) => ({
    // 初始状态
    messages: [],
    userImages: [],
    currentDraft: null,
    isProcessing: false,

    // 添加消息
    addMessage: (message) => {
      set((state) => {
        state.messages.push({
          ...message,
          id: `msg-${Date.now()}`,
          timestamp: new Date(),
        })
      })
    },

    // 更新用户消息（用于流式响应）
    updateUserMessage: (messageId, content) => {
      set((state) => {
        const message = state.messages.find(m => m.id === messageId)
        if (message) {
          message.content = content
        }
      })
    },

    // 添加用户图片
    addUserImage: (image) => {
      set((state) => {
        state.userImages.push(image)
      })
    },

    // 删除用户图片
    removeUserImage: (imageId) => {
      set((state) => {
        state.userImages = state.userImages.filter(img => img.id !== imageId)
      })
    },

    // 清空聊天
    clearChat: () => {
      set((state) => {
        state.messages = []
        state.userImages = []
        state.currentDraft = null
      })
    },

    // 设置处理状态
    setProcessing: (processing) => {
      set((state) => {
        state.isProcessing = processing
      })
    },

    // 设置当前剧本草稿
    setCurrentDraft: (draft) => {
      set((state) => {
        state.currentDraft = draft
      })
    },

    // 生成剧本草稿
    generateScreenplayDraft: async (userPrompt) => {
      const { addMessage, setProcessing, setCurrentDraft } = get()
      setProcessing(true)

      try {
        // 添加用户消息
        addMessage({
          role: 'user',
          content: userPrompt,
        })

        // 添加助手消息占位符
        const assistantMessageId = `msg-${Date.now()}`
        addMessage({
          id: assistantMessageId,
          role: 'assistant',
          content: '正在为您生成剧本...',
          isStreaming: true,
        })

        // 调用API生成剧本
        // 这里需要实际的API调用
        // const response = await apiService.generateScreenplay(userPrompt)

        // 模拟响应（实际应该调用API）
        setTimeout(() => {
          // 更新消息
          const state = get()
          const message = state.messages.find(m => m.id === assistantMessageId)
          if (message) {
            message.content = '剧本草稿已生成！正在为您展示详情...'
            message.isStreaming = false
          }

          // 设置草稿（这里应该是实际的解析结果）
          // setCurrentDraft(parsedDraft)

          setProcessing(false)
        }, 2000)
      } catch (error) {
        console.error('Failed to generate screenplay:', error)
        addMessage({
          role: 'assistant',
          content: '抱歉，剧本生成失败。请重试。',
        })
        setProcessing(false)
      }
    },

    // 生成角色三视图
    generateCharacterSheets: async () => {
      const { currentDraft, setProcessing } = get()
      if (!currentDraft) {
        throw new Error('No current draft')
      }

      setProcessing(true)
      try {
        // 调用API生成角色三视图
        // const sheets = await imageService.generateCharacterSheets(currentDraft.characters)
        setProcessing(false)
      } catch (error) {
        console.error('Failed to generate character sheets:', error)
        setProcessing(false)
        throw error
      }
    },

    // 生成剧本媒体（图片和视频）
    generateScreenplayMedia: async () => {
      const { currentDraft, setProcessing } = get()
      if (!currentDraft) {
        throw new Error('No current draft')
      }

      setProcessing(true)
      try {
        // 调用API生成场景图片和视频
        setProcessing(false)
      } catch (error) {
        console.error('Failed to generate media:', error)
        setProcessing(false)
        throw error
      }
    },

    // 判断是否是视频生成意图
    isVideoGenerationIntent: (text: string) => {
      const keywords = [
        '生成', '制作', '创建', '短剧', '视频',
        '剧本', '故事', '角色', '场景'
      ]
      return keywords.some(keyword => text.includes(keyword))
    },
  }))
)
