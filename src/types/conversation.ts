/**
 * 会话相关类型定义
 */

import { MessageRole } from './chat'

export interface Conversation {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
  lastMessagePreview?: string
}

export interface ConversationMessage {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  images?: string[]
  timestamp: Date
}

export interface CreateConversationParams {
  title?: string
  firstMessage?: string
}
