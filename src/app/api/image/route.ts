/**
 * 图片生成API路由
 */

import { NextRequest, NextResponse } from 'next/server'
import { ImageGenerationService } from '@/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, params } = body

    // 从环境变量或配置中获取API密钥
    const apiKey = process.env.CANGHE_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json(
        { error: '图片API密钥未配置' },
        { status: 500 }
      )
    }

    const imageService = new ImageGenerationService(apiKey)

    switch (action) {
      case 'generate': {
        // 生成单张图片
        const { prompt, negativePrompt, style, aspectRatio } = params
        const imageUrl = await imageService.generateImage({
          prompt,
          negativePrompt,
          style,
          aspectRatio,
        })

        return NextResponse.json({ imageUrl })
      }

      case 'character-sheet': {
        // 生成角色三视图
        const { characterName, description, style } = params
        const characterSheet = await imageService.generateCharacterSheet({
          characterName,
          description,
          style,
        })

        return NextResponse.json({ characterSheet })
      }

      case 'batch': {
        // 批量生成场景图片
        const { scenes, style } = params

        const results = await imageService.generateSceneImages(
          scenes,
          style,
          (current, total) => {
            // 可以在这里发送进度更新
            console.log(`生成进度: ${current}/${total}`)
          }
        )

        // 将Map转换为对象
        const resultsObj = Object.fromEntries(results)
        return NextResponse.json({ results: resultsObj })
      }

      default:
        return NextResponse.json(
          { error: '未知操作' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Image API Error:', error)
    return NextResponse.json(
      { error: error.message || '图片生成失败' },
      { status: 500 }
    )
  }
}

// GET方法用于查询生成状态（可选）
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json(
      { error: '缺少taskId参数' },
      { status: 400 }
    )
  }

  // TODO: 实现任务状态查询
  return NextResponse.json({
    taskId,
    status: 'completed',
    message: '任务状态查询（待实现）',
  })
}
