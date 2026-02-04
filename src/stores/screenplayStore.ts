/**
 * 剧本状态管理
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Screenplay, Scene } from '@/types'

interface ScreenplayState {
  // 状态
  screenplays: Screenplay[]
  currentScreenplay: Screenplay | null
  sceneProgress: Map<string, number> // sceneId -> progress (0-100)

  // Actions
  setCurrentScreenplay: (screenplay: Screenplay | null) => void
  addScreenplay: (screenplay: Screenplay) => void
  updateSceneStatus: (
    sceneId: string,
    status: Scene['status'],
    url?: string
  ) => void
  updateSceneProgress: (sceneId: string, progress: number) => void
  clearScreenplays: () => void
}

export const useScreenplayStore = create<ScreenplayState>()(
  immer((set) => ({
    // 初始状态
    screenplays: [],
    currentScreenplay: null,
    sceneProgress: new Map(),

    // 设置当前剧本
    setCurrentScreenplay: (screenplay) => {
      set((state) => {
        state.currentScreenplay = screenplay
      })
    },

    // 添加剧本
    addScreenplay: (screenplay) => {
      set((state) => {
        state.screenplays.push(screenplay)
        state.currentScreenplay = screenplay
      })
    },

    // 更新场景状态
    updateSceneStatus: (sceneId, status, url) => {
      set((state) => {
        if (!state.currentScreenplay) return

        const scene = state.currentScreenplay.scenes.find(s => s.id === sceneId)
        if (scene) {
          scene.status = status
          if (url) {
            if (status === 'image_ready') {
              scene.imageUrl = url
            } else if (status === 'video_ready') {
              scene.videoUrl = url
            }
          }
        }
      })
    },

    // 更新场景进度
    updateSceneProgress: (sceneId, progress) => {
      set((state) => {
        state.sceneProgress.set(sceneId, progress)
      })
    },

    // 清空剧本列表
    clearScreenplays: () => {
      set((state) => {
        state.screenplays = []
        state.currentScreenplay = null
        state.sceneProgress.clear()
      })
    },
  }))
)
