/**
 * API配置状态管理
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ApiConfig } from '@/types'

interface ApiConfigState {
  // 状态
  configs: ApiConfig[]
  isLoading: boolean

  // Actions
  addConfig: (config: Omit<ApiConfig, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateConfig: (id: string, updates: Partial<ApiConfig>) => void
  deleteConfig: (id: string) => void
  setActiveConfig: (provider: ApiConfig['provider'], id: string) => void
  loadConfigs: () => Promise<void>
  getConfigByProvider: (provider: ApiConfig['provider']) => ApiConfig | undefined
}

export const useApiConfigStore = create<ApiConfigState>()(
  immer((set, get) => ({
    // 初始状态
    configs: [],
    isLoading: false,

    // 添加配置
    addConfig: (config) => {
      set((state) => {
        state.configs.push({
          ...config,
          id: `config-${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      })
    },

    // 更新配置
    updateConfig: (id, updates) => {
      set((state) => {
        const config = state.configs.find(c => c.id === id)
        if (config) {
          Object.assign(config, updates, { updatedAt: new Date() })
        }
      })
    },

    // 删除配置
    deleteConfig: (id) => {
      set((state) => {
        state.configs = state.configs.filter(c => c.id !== id)
      })
    },

    // 设置活跃配置
    setActiveConfig: (provider, id) => {
      set((state) => {
        // 取消该provider的所有活跃状态
        state.configs.forEach(c => {
          if (c.provider === provider) {
            c.isActive = false
          }
        })

        // 设置新的活跃配置
        const config = state.configs.find(c => c.id === id)
        if (config) {
          config.isActive = true
        }
      })
    },

    // 加载配置（从localStorage或后端）
    loadConfigs: async () => {
      set((state) => {
        state.isLoading = true
      })

      try {
        // 从localStorage加载
        const saved = localStorage.getItem('api-configs')
        if (saved) {
          const configs = JSON.parse(saved) as ApiConfig[]
          set((state) => {
            state.configs = configs
          })
        }
      } catch (error) {
        console.error('Failed to load configs:', error)
      } finally {
        set((state) => {
          state.isLoading = false
        })
      }
    },

    // 根据provider获取配置
    getConfigByProvider: (provider) => {
      const { configs } = get()
      return configs.find(c => c.provider === provider && c.isActive)
    },
  }))
)
