/**
 * 角色相关类型定义
 */

export interface CharacterInfo {
  name: string
  description: string
  appearance: string
  personality: string
}

export interface CharacterSheet {
  id: string
  characterName: string
  description: string
  frontViewUrl: string
  sideViewUrl: string
  threeQuarterViewUrl: string
  promptUsed: string
  createdAt: Date
}

export interface CharacterSheetGenerationParams {
  characterName: string
  description: string
  style?: string
  additionalInfo?: string
}
