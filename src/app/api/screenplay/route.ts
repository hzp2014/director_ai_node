/**
 * 剧本API路由
 */

import { NextRequest, NextResponse } from 'next/server'
import { GLMService, ScreenplayParser } from '@/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userPrompt, draftData } = body

    const apiKey = process.env.ZHIPU_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500 }
      )
    }

    const glmService = new GLMService(apiKey)

    switch (action) {
      case 'generate': {
        // 生成剧本草稿
        const screenplayJson = await glmService.generateDramaScreenplay(userPrompt)
        const draft = ScreenplayParser.parseScreenplayDraft(screenplayJson)

        if (!draft) {
          return NextResponse.json(
            { error: '剧本解析失败' },
            { status: 500 }
          )
        }

        return NextResponse.json({ draft })
      }

      case 'confirm': {
        // 确认剧本并开始生成
        const { draftId } = body
        // 这里应该触发图片和视频生成流程
        return NextResponse.json({ success: true, message: '开始生成媒体' })
      }

      default:
        return NextResponse.json(
          { error: '未知操作' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Screenplay API Error:', error)
    return NextResponse.json(
      { error: error.message || '剧本操作失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  // 这里应该从数据库获取剧本详情
  // 暂时返回模拟数据
  return NextResponse.json({
    id,
    message: '获取剧本详情（待实现）',
  })
}
