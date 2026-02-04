/**
 * 剧本相关类型定义
 */

import type { CharacterInfo, CharacterSheet } from './character'

export enum DraftStatus {
  GENERATING = 'generating',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum ScreenplayStatus {
  DRAFT = 'draft',
  GENERATING_MEDIA = 'generating_media',
  READY = 'ready',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ScreenplayDraft {
  id: string
  title: string
  genre: string
  episodes: number
  characters: CharacterInfo[]
  scenes: SceneDraft[]
  status: DraftStatus
  createdAt: Date
  updatedAt: Date
}

export interface SceneDraft {
  id: string
  episodeNumber: number
  sceneNumber: number
  location: string
  description: string
  dialogue: DialogueLine[]
  action: string
  duration: number
}

export interface DialogueLine {
  character: string
  text: string
  emotion?: string
  action?: string
}

export interface Screenplay {
  id: string
  draftId: string
  title: string
  genre: string
  episodes: number
  characters: CharacterInfo[]
  scenes: Scene[]
  status: ScreenplayStatus
  characterSheets?: CharacterSheet[]
  createdAt: Date
  updatedAt: Date
}

export interface Scene {
  id: string
  draftId: string
  episodeNumber: number
  sceneNumber: number
  location: string
  description: string
  dialogue: DialogueLine[]
  action: string
  duration: number
  imageUrl?: string
  videoUrl?: string
  status: SceneStatus
  createdAt: Date
}

export enum SceneStatus {
  PENDING = 'pending',
  GENERATING_IMAGE = 'generating_image',
  IMAGE_READY = 'image_ready',
  GENERATING_VIDEO = 'generating_video',
  VIDEO_READY = 'video_ready',
  FAILED = 'failed',
}
