/**
 * 视频生成API路由
 */

import { NextRequest, NextResponse } from 'next/server'
import { VideoGenerationService } from '@/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, params } = body

    // 从环境变量或配置中获取API密钥
    const apiKey = process.env.CANGHE_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json(
        { error: '视频API密钥未配置' },
        { status: 500 }
      )
    }

    const videoService = new VideoGenerationService(apiKey)

    switch (action) {
      case 'generate': {
        // 提交视频生成任务
        const { imageUrl, prompt, duration, motion } = params
        const task = await videoService.submitVideoTask({
          imageUrl,
          prompt,
          duration,
          motion,
        })

        return NextResponse.json({ task })
      }

      case 'batch': {
        // 批量生成场景视频
        const { scenes } = params

        const results = await videoService.generateSceneVideos(
          scenes,
          (current, total, sceneId) => {
            // 可以在这里发送进度更新
            if (sceneId) {
              console.log(`生成场景 ${sceneId}: ${current}/${total}`)
            }
          }
        )

        // 将Map转换为对象
        const resultsObj = Object.fromEntries(results)
        return NextResponse.json({ results: resultsObj })
      }

      case 'merge': {
        // 合并多个视频
        const { videoUrls } = params
        const mergedUrl = await videoService.mergeVideos(videoUrls)

        return NextResponse.json({ mergedUrl })
      }

      default:
        return NextResponse.json(
          { error: '未知操作' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Video API Error:', error)
    return NextResponse.json(
      { error: error.message || '视频操作失败' },
      { status: 500 }
    )
  }
}

// GET方法用于查询视频生成状态
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const taskId = searchParams.get('taskId')

  if (!taskId) {
    return NextResponse.json(
      { error: '缺少taskId参数' },
      { status: 400 }
    )
  }

  try {
    const apiKey = process.env.CANGHE_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json(
        { error: '视频API密钥未配置' },
        { status: 500 }
      )
    }

    const videoService = new VideoGenerationService(apiKey)
    const status = await videoService.pollVideoStatus(taskId)

    return NextResponse.json({ status })
  } catch (error: any) {
    console.error('Video Status Error:', error)
    return NextResponse.json(
      { error: error.message || '状态查询失败' },
      { status: 500 }
    )
  }
}
