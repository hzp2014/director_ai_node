/**
 * 聊天API路由
 */

import { NextRequest, NextResponse } from 'next/server'
import { GLMService } from '@/services'
import { DEMO_RESPONSES } from '@/lib/demoData'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, stream = false } = body

    // 从环境变量或配置中获取API密钥
    const apiKey = process.env.ZHIPU_API_KEY || ''

    // 如果没有配置API密钥，返回演示模式
    if (!apiKey || apiKey === 'your_zhipu_api_key_here') {
      const lastMessage = messages[messages.length - 1]?.content || ''

      // 检测是否是剧本生成请求
      if (lastMessage.includes('生成') || lastMessage.includes('短剧') || lastMessage.includes('剧本')) {
        return NextResponse.json({
          content: `${DEMO_RESPONSES.greeting}\n\n🎬 **演示模式**\n\n我已经为你生成了一个示例剧本草稿：\n\n**${DEMO_RESPONSES.screenplayDemo.title}**\n类型：${DEMO_RESPONSES.screenplayDemo.genre}\n集数：${DEMO_RESPONSES.screenplayDemo.episodes}集\n角色：${DEMO_RESPONSES.screenplayDemo.characters.map(c => c.name).join('、')}\n\n💡 配置真实API密钥后，我可以根据你的创意生成定制化剧本。\n\n获取API密钥：https://open.bigmodel.cn`,
          demoMode: true,
          demoDraft: DEMO_RESPONSES.screenplayDemo
        })
      }

      return NextResponse.json({
        content: DEMO_RESPONSES.greeting,
        demoMode: true
      })
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
