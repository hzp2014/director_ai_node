/**
 * 图片生成服务
 * 封装图片生成的业务逻辑
 */

import { CangheImageService } from './apiService'
import type { CharacterSheet, CharacterSheetGenerationParams } from '@/types'

export class ImageGenerationService {
  private cangheService: CangheImageService

  constructor(apiKey: string) {
    this.cangheService = new CangheImageService(apiKey)
  }

  /**
   * 生成单张图片
   */
  async generateImage(params: {
    prompt: string
    negativePrompt?: string
    style?: string
    aspectRatio?: string
  }): Promise<string> {
    return await this.cangheService.generateImage(params)
  }

  /**
   * 生成角色三视图
   */
  async generateCharacterSheet(
    params: CharacterSheetGenerationParams
  ): Promise<CharacterSheet> {
    const { characterName, description, style = 'anime style', additionalInfo } = params

    const result = await this.cangheService.generateCharacterSheet({
      name: characterName,
      description: `${description}${additionalInfo ? ', ' + additionalInfo : ''}`,
      appearance: description,
      style,
    })

    return {
      id: `cs-${Date.now()}`,
      characterName,
      description,
      frontViewUrl: result.frontViewUrl,
      sideViewUrl: result.sideViewUrl,
      threeQuarterViewUrl: result.threeQuarterViewUrl,
      promptUsed: `${description} ${style}`,
      createdAt: new Date(),
    }
  }

  /**
   * 批量生成角色三视图
   */
  async generateMultipleCharacterSheets(
    characters: Array<{ name: string; description: string }>,
    style?: string
  ): Promise<CharacterSheet[]> {
    const results: CharacterSheet[] = []

    for (const character of characters) {
      try {
        const sheet = await this.generateCharacterSheet({
          characterName: character.name,
          description: character.description,
          style,
        })
        results.push(sheet)
      } catch (error) {
        console.error(`Failed to generate character sheet for ${character.name}:`, error)
      }
    }

    return results
  }

  /**
   * 批量生成场景图片
   */
  async generateSceneImages(
    scenes: Array<{
      id: string
      description: string
      location: string
      action?: string
    }>,
    style?: string,
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>()
    const concurrent = 2 // 并发数为2
    const total = scenes.length

    // 分批处理，每批concurrent个
    for (let i = 0; i < scenes.length; i += concurrent) {
      const batch = scenes.slice(i, i + concurrent)

      const batchResults = await Promise.allSettled(
        batch.map(async (scene) => {
          const prompt = this.buildScenePrompt(scene, style)
          const imageUrl = await this.generateImage({
            prompt,
            aspectRatio: '16:9',
            style,
          })
          return { sceneId: scene.id, imageUrl }
        })
      )

      // 处理结果
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.set(result.value.sceneId, result.value.imageUrl)
        } else {
          console.error('Scene image generation failed:', result.reason)
        }
      }

      if (onProgress) {
        onProgress(Math.min(i + concurrent, total), total)
      }
    }

    return results
  }

  /**
   * 构建场景提示词
   */
  private buildScenePrompt(
    scene: { description: string; location: string; action?: string },
    style?: string
  ): string {
    const parts = [
      scene.location,
      scene.description,
      scene.action || '',
      style || 'anime style',
      'cinematic lighting',
      'high quality',
      'detailed',
      'wide shot',
    ]
    return parts.filter(Boolean).join(', ')
  }
}
