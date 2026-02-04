/**
 * API配置和响应类型定义
 */

export interface ApiConfig {
  id: string
  provider: 'zhipu' | 'canghe' | 'doubao' | 'openai'
  apiKey: string
  apiEndpoint?: string
  modelName?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface ImageGenerationParams {
  prompt: string
  negativePrompt?: string
  style?: string
  aspectRatio?: string
  numberOfImages?: number
}

export interface VideoGenerationParams {
  imageUrl: string
  prompt: string
  duration?: number
  motion?: string
}

export interface VideoTaskStatus {
  taskId: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  videoUrl?: string
  progress?: number
  error?: string
}
