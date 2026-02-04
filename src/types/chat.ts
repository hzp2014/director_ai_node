/**
 * 聊天消息相关类型定义
 */

import type { ScreenplayDraft } from './screenplay'

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export interface UserImage {
  id: string
  url: string
  base64?: string
  uploadedAt: Date
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  images?: UserImage[]
  timestamp: Date
  isStreaming?: boolean
}

export interface ChatResponse {
  content: string
  isVideoGenerationIntent?: boolean
  screenplayDraft?: ScreenplayDraft
}
