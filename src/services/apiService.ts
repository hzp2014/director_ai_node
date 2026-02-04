/**
 * API服务基类
 * 封装智谱GLM、苍何视频API、豆包ARK的客户端
 */

import axios, { AxiosInstance } from 'axios'

export class ApiService {
  protected client: AxiosInstance
  protected apiKey: string
  protected baseURL: string

  constructor(apiKey: string, baseURL: string) {
    this.apiKey = apiKey
    this.baseURL = baseURL
    this.client = axios.create({
      baseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        config.headers['Authorization'] = `Bearer ${this.apiKey}`
        return config
      },
      (error) => Promise.reject(error)
    )

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        throw error
      }
    )
  }
}

/**
 * 智谱GLM API服务
 */
export class GLMService extends ApiService {
  constructor(apiKey: string) {
    super(
      apiKey,
      'https://open.bigmodel.cn/api/paas/v4'
    )
  }

  /**
   * 发送普通聊天请求
   */
  async sendToGLM(messages: Array<{ role: string; content: string }>) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'glm-4',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      })
      return response.choices[0].message.content
    } catch (error: any) {
      console.error('GLM API Error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.error?.message || 'GLM API调用失败')
    }
  }

  /**
   * 发送流式聊天请求
   */
  async *sendToGLMStream(messages: Array<{ role: string; content: string }>) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'glm-4',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: true,
      }, {
        responseType: 'stream',
      })

      const stream = response.data
      let buffer = ''

      for await (const chunk of stream) {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              if (content) {
                yield content
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error: any) {
      console.error('GLM Stream Error:', error.response?.data || error.message)
      throw new Error(error.response?.data?.error?.message || 'GLM流式调用失败')
    }
  }

  /**
   * 生成漫剧剧本
   */
  async generateDramaScreenplay(userPrompt: string, context?: string) {
    const systemPrompt = `你是一位专业的短剧编剧。你的任务是根据用户的创意生成完整的短剧剧本。

请按照以下JSON格式返回剧本：
{
  "title": "剧本标题",
  "genre": "类型（爱情/悬疑/喜剧等）",
  "episodes": 3,
  "characters": [
    {
      "name": "角色名",
      "description": "角色描述",
      "appearance": "外貌描述",
      "personality": "性格特点"
    }
  ],
  "scenes": [
    {
      "episodeNumber": 1,
      "sceneNumber": 1,
      "location": "场景地点",
      "description": "场景描述",
      "dialogue": [
        {
          "character": "角色名",
          "text": "台词",
          "emotion": "情绪",
          "action": "动作提示"
        }
      ],
      "action": "场景动作描述",
      "duration": 30
    }
  ]
}

要求：
1. 剧本要有明确的起承转合
2. 每集结尾留下悬念
3. 角色性格鲜明，对话生动
4. 场景描述具体，便于后续生成画面
5. 每个场景时长30-60秒`

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `创意：${userPrompt}${context ? '\n\n上下文：' + context : ''}` },
    ]

    return await this.sendToGLM(messages)
  }

  /**
   * 分析图片提取角色特征
   */
  async analyzeImageForCharacter(imageBase64: string) {
    const messages = [
      {
        role: 'system',
        content: '你是一位专业的角色设计师。请仔细分析用户上传的图片，提取角色的外貌特征、服装风格、表情特点等信息，并生成详细的角色描述，用于后续AI绘画生成。'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请分析这个角色的特征，并给出详细描述' },
          { type: 'image_url', image_url: { url: imageBase64 } }
        ]
      }
    ]

    try {
      const response = await this.client.post('/chat/completions', {
        model: 'glm-4v',
        messages,
        temperature: 0.5,
        max_tokens: 1000,
      })
      return response.choices[0].message.content
    } catch (error: any) {
      console.error('GLM Vision Error:', error.response?.data || error.message)
      throw new Error('图片分析失败')
    }
  }

  /**
   * 支持图片的聊天
   */
  async chatWithImageSupport(text: string, images?: string[]) {
    const content: any[] = [{ type: 'text', text }]

    if (images && images.length > 0) {
      for (const image of images) {
        content.push({
          type: 'image_url',
          image_url: { url: image }
        })
      }
    }

    const messages = [
      {
        role: 'system',
        content: '你是AI Director，一个智能短剧制作助手。你可以帮助用户创作剧本、设计角色、规划场景。'
      },
      { role: 'user', content }
    ]

    try {
      const response = await this.client.post('/chat/completions', {
        model: 'glm-4v',
        messages,
        temperature: 0.7,
        max_tokens: 2000,
      })
      return response.choices[0].message.content
    } catch (error: any) {
      console.error('GLM Chat Error:', error.response?.data || error.message)
      throw new Error('聊天失败')
    }
  }
}

/**
 * 苍何图片API服务
 */
export class CangheImageService extends ApiService {
  constructor(apiKey: string) {
    super(
      apiKey,
      'https://api.canghe.io'
    )
  }

  /**
   * 生成单张图片
   */
  async generateImage(params: {
    prompt: string
    negativePrompt?: string
    style?: string
    aspectRatio?: string
  }) {
    try {
      const response = await this.client.post('/v1/images/generations', {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || 'low quality, blurry, distorted',
        style: params.style || 'realistic',
        aspect_ratio: params.aspectRatio || '16:9',
        n: 1,
      })
      return response.data[0].url
    } catch (error: any) {
      console.error('Canghe Image Error:', error.response?.data || error.message)
      throw new Error('图片生成失败')
    }
  }

  /**
   * 生成角色三视图
   */
  async generateCharacterSheet(characterInfo: {
    name: string
    description: string
    appearance: string
    style?: string
  }) {
    const basePrompt = `Character design sheet of ${characterInfo.name}, ${characterInfo.appearance}, ${characterInfo.description}`

    const prompts = [
      `${basePrompt}, front view, standing pose, white background, high quality, detailed`,
      `${basePrompt}, side view profile, standing pose, white background, high quality, detailed`,
      `${basePrompt}, three quarter view, standing pose, white background, high quality, detailed`,
    ]

    try {
      const views = await Promise.all(
        prompts.map(prompt => this.generateImage({ prompt, style: characterInfo.style }))
      )

      return {
        frontViewUrl: views[0],
        sideViewUrl: views[1],
        threeQuarterViewUrl: views[2],
      }
    } catch (error) {
      throw new Error('角色三视图生成失败')
    }
  }
}

/**
 * 苍何视频API服务
 */
export class CangheVideoService extends ApiService {
  constructor(apiKey: string) {
    super(
      apiKey,
      'https://api.canghe.io'
    )
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
    try {
      const response = await this.client.post('/v1/videos/generations', {
        image: params.imageUrl,
        prompt: params.prompt,
        duration: params.duration || 4,
        motion: params.motion || 'medium',
      })
      return {
        taskId: response.task_id,
        status: 'pending',
      }
    } catch (error: any) {
      console.error('Canghe Video Error:', error.response?.data || error.message)
      throw new Error('视频任务提交失败')
    }
  }

  /**
   * 查询视频任务状态
   */
  async getVideoTaskStatus(taskId: string) {
    try {
      const response = await this.client.get(`/v1/videos/generations/${taskId}`)
      return {
        taskId: response.task_id,
        status: response.status,
        videoUrl: response.video_url,
        progress: response.progress,
      }
    } catch (error: any) {
      console.error('Video Status Error:', error.response?.data || error.message)
      throw new Error('视频状态查询失败')
    }
  }

  /**
   * 轮询视频生成状态直到完成
   */
  async pollVideoStatus(
    taskId: string,
    onUpdate?: (status: any) => void
  ): Promise<string> {
    const maxAttempts = 60 // 最多轮询60次（约5分钟）
    const interval = 5000 // 每5秒查询一次

    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getVideoTaskStatus(taskId)

      if (onUpdate) {
        onUpdate(status)
      }

      if (status.status === 'completed' && status.videoUrl) {
        return status.videoUrl
      }

      if (status.status === 'failed') {
        throw new Error('视频生成失败')
      }

      await new Promise(resolve => setTimeout(resolve, interval))
    }

    throw new Error('视频生成超时')
  }

  /**
   * 批量生成场景视频
   */
  async generateSceneVideos(scenes: Array<{
    id: string
    imageUrl: string
    description: string
  }>) {
    const results = new Map()

    // 提交所有任务
    const tasks = await Promise.all(
      scenes.map(async (scene) => {
        const { taskId } = await this.submitVideoTask({
          imageUrl: scene.imageUrl,
          prompt: scene.description,
          duration: 4,
        })
        return { sceneId: scene.id, taskId }
      })
    )

    // 轮询所有任务
    for (const task of tasks) {
      try {
        const videoUrl = await this.pollVideoStatus(task.taskId)
        results.set(task.sceneId, {
          success: true,
          videoUrl,
        })
      } catch (error: any) {
        results.set(task.sceneId, {
          success: false,
          error: error.message,
        })
      }
    }

    return results
  }
}
