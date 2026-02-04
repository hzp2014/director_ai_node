/**
 * 智能体命令相关类型定义
 */

export enum AgentCommandType {
  GENERATE_IMAGE = 'generate_image',
  GENERATE_VIDEO = 'generate_video',
  GENERATE_SCREENPLAY = 'generate_screenplay',
  ANALYZE_IMAGE = 'analyze_image',
  MERGE_VIDEOS = 'merge_videos',
}

export interface AgentCommand {
  type: AgentCommandType
  params: Record<string, any>
}

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
}

export interface ReActThought {
  observation: string
  thought: string
  action?: AgentCommand
  result?: ToolResult
}

export interface AgentContext {
  conversationHistory: Array<{
    role: string
    content: string
  }>
  userImages?: string[]
  currentDraft?: any
}
