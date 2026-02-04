/**
 * 视频生成服务
 * 封装视频生成的业务逻辑
 */

import { CangheVideoService } from './apiService'
import type { Scene } from '@/types'

export class VideoGenerationService {
  private cangheService: CangheVideoService

  constructor(apiKey: string) {
    this.cangheService = new CangheVideoService(apiKey)
  }

  /**
   * 提交视频生成任务
   */
  async submitVideoTask(params: {
    imageUrl: string
    prompt: string
    duration?: number
    motion?: string
  }) {
    return await this.cangheService.submitVideoTask(params)
  }

  /**
   * 轮询视频生成状态
   */
  async pollVideoStatus(
    taskId: string,
    onUpdate?: (status: any) => void
  ): Promise<string> {
    return await this.cangheService.pollVideoStatus(taskId, onUpdate)
  }

  /**
   * 批量生成场景视频
   */
  async generateSceneVideos(
    scenes: Scene[],
    onProgress?: (current: number, total: number, sceneId: string) => void
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>()
    const concurrent = 2 // 并发数为2

    // 只处理已有图片的场景
    const scenesWithImages = scenes.filter(s => s.imageUrl)

    // 分批处理
    for (let i = 0; i < scenesWithImages.length; i += concurrent) {
      const batch = scenesWithImages.slice(i, i + concurrent)

      const batchTasks = await Promise.allSettled(
        batch.map(async (scene) => {
          const { taskId } = await this.submitVideoTask({
            imageUrl: scene.imageUrl!,
            prompt: `${scene.description}, ${scene.action}`,
            duration: 4,
            motion: 'medium',
          })

          const videoUrl = await this.pollVideoStatus(taskId, (status) => {
            if (onProgress) {
              onProgress(i, scenesWithImages.length, scene.id)
            }
          })

          return { sceneId: scene.id, videoUrl }
        })
      )

      // 处理结果
      for (const result of batchTasks) {
        if (result.status === 'fulfilled') {
          results.set(result.value.sceneId, result.value.videoUrl)
        } else {
          console.error('Video generation failed:', result.reason)
        }
      }

      if (onProgress) {
        onProgress(Math.min(i + concurrent, scenesWithImages.length), scenesWithImages.length, '')
      }
    }

    return results
  }

  /**
   * 合并多个视频
   * 注意：这需要后端FFmpeg支持，这里返回一个模拟实现
   */
  async mergeVideos(videoUrls: string[]): Promise<string> {
    // 实际实现需要后端支持
    // 这里返回一个占位符
    console.log('Merging videos:', videoUrls)
    return 'merged-video-url'
  }
}
