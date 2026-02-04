/**
 * 聊天API路由
 */

import { NextRequest, NextResponse } from 'next/server'
import { GLMService } from '@/services'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, stream = false } = body

    // 从环境变量或配置中获取API密钥
    const apiKey = process.env.ZHIPU_API_KEY || ''
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500 }
      )
    }

    const glmService = new GLMService(apiKey)

    if (stream) {
      // 流式响应
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of glmService.sendToGLMStream(messages)) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    } else {
      // 普通响应
      const content = await glmService.sendToGLM(messages)
      return NextResponse.json({ content })
    }
  } catch (error: any) {
    console.error('Chat API Error:', error)
    return NextResponse.json(
      { error: error.message || '聊天失败' },
      { status: 500 }
    )
  }
}
