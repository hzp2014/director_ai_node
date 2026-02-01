import axios from 'axios';
import settings from './config.js';
import logger from './logger.js';

class ChatMessage {
  constructor(role, content, reasoningContent = null, toolCalls = null) {
    this.role = role;
    this.content = content;
    this.reasoningContent = reasoningContent;
    this.toolCalls = toolCalls;
  }

  toJson() {
    const data = {
      role: this.role,
      content: this.content
    };

    if (this.reasoningContent) {
      data.reasoning_content = this.reasoningContent;
    }

    if (this.toolCalls) {
      data.tool_calls = this.toolCalls;
    }

    return data;
  }
}

class StreamChunk {
  constructor({ isContent = false, isReasoning = false, text = '', toolCalls = null } = {}) {
    this.isContent = isContent;
    this.isReasoning = isReasoning;
    this.text = text;
    this.toolCalls = toolCalls;
  }
}

class AIClient {
  constructor() {
    this.zhipuClient = axios.create({
      baseURL: settings.zhipuApiBaseUrl,
      headers: {
        'Authorization': `Bearer ${settings.zhipuApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 300000
    });

    this.doubaoClient = axios.create({
      baseURL: settings.doubaoApiBaseUrl,
      headers: {
        'Authorization': `Bearer ${settings.doubaoApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });
  }

  async sendToGLMStream(messages, model = settings.defaultChatModel, temperature = 0.7, maxTokens = 4096) {
    if (settings.useMockChatApi) {
      logger.warn('GLM对话', '🧪 使用 Mock 模式');
      return this._mockStream(messages);
    }

    const requestData = {
      model: model,
      messages: messages.map(msg => msg.toJson ? msg.toJson() : msg),
      stream: true,
      temperature: temperature,
      max_tokens: maxTokens
    };

    logger.info('GLM对话', `发送请求到 ${model}, 消息数量: ${messages.length}`);
    logger.debug('GLM对话', `请求体: ${JSON.stringify(requestData, null, 2)}`);

    try {
      const response = await this.zhipuClient.post('/chat/completions', requestData, {
        responseType: 'stream'
      });

      const chunks = [];

      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);

            if (dataStr === '[DONE]') {
              continue;
            }

            try {
              const data = JSON.parse(dataStr);
              const streamChunk = this._parseStreamChunk(data);
              if (streamChunk) {
                chunks.push(streamChunk);
              }
            } catch (error) {
              logger.warn('GLM对话', `解析chunk失败: ${error.message}`);
            }
          }
        }
      }

      logger.success('GLM对话', `收到 ${chunks.length} 个chunks`);
      return chunks;
    } catch (error) {
      logger.error('GLM对话', `请求失败: ${error.message}`);
      throw new Error(`GLM请求失败: ${error.message}`);
    }
  }

  async sendToGLM(messages, model = settings.defaultChatModel, temperature = 0.7, maxTokens = 4096) {
    if (settings.useMockChatApi) {
      logger.warn('GLM对话', '🧪 使用 Mock 模式');
      const chunks = await this._mockStream(messages);
      return chunks.map(chunk => chunk.text).join('');
    }

    const requestData = {
      model: model,
      messages: messages.map(msg => msg.toJson ? msg.toJson() : msg),
      stream: false,
      temperature: temperature,
      max_tokens: maxTokens
    };

    logger.info('GLM对话', `发送请求到 ${model}, 消息数量: ${messages.length}`);

    try {
      const response = await this.zhipuClient.post('/chat/completions', requestData);
      const data = response.data;

      logger.success('GLM对话', `收到响应`);

      const choice = data.choices && data.choices[0];
      if (!choice) {
        throw new Error('响应格式错误: 没有choices');
      }

      const message = choice.message;
      return message.content || '';
    } catch (error) {
      logger.error('GLM对话', `请求失败: ${error.message}`);
      throw new Error(`GLM请求失败: ${error.message}`);
    }
  }

  async analyzeImageForCharacter(imageBase64, mimeType = 'image/jpeg') {
    if (settings.doubaoApiKey === '') {
      throw new Error('豆包 API Key 未设置，无法进行图片分析');
    }

    const prompt = `请仔细观察这张图片，提取其中主要角色或人物的详细特征描述。

请按照以下格式返回（只返回描述，不要其他内容）：

**外观特征**：[详细描述角色的外观，包括：发型、发色、面部特征、眼睛颜色、皮肤状态、体型等]

**穿着打扮**：[描述角色的服装风格、颜色、配饰等]

**姿态表情**：[描述角色的姿态、表情、气质等]

**整体风格**：[一句话总结这个角色的整体视觉风格]

请确保描述足够详细，以便后续可以根据这些描述生成一致的角色形象。`;

    const requestData = {
      model: settings.defaultImageModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ]
    };

    logger.info('豆包-ARK', '开始分析图片特征...');
    logger.debug('豆包-ARK', `请求体: ${JSON.stringify(requestData, null, 2)}`);

    try {
      const response = await this.doubaoClient.post('/chat/completions', requestData);
      const data = response.data;

      const choices = data.choices;
      if (!choices || choices.length === 0) {
        logger.error('豆包-ARK', '响应格式错误：没有 choices');
        throw new Error('图片分析失败：响应格式错误');
      }

      const firstChoice = choices[0];
      const message = firstChoice.message;
      const content = message && message.content;

      if (!content) {
        logger.error('豆包-ARK', '图片分析响应为空');
        throw new Error('图片分析失败：响应为空');
      }

      logger.success('豆包-ARK', '图片分析完成');
      logger.info('豆包-ARK', `提取的特征:\n${content}`);

      return content;
    } catch (error) {
      logger.error('豆包-ARK', `图片分析失败: ${error.message}`);
      throw new Error(`图片分析失败: ${error.message}`);
    }
  }

  async rewriteVideoPromptForSafety(originalPrompt, sceneNarration) {
    logger.info('提示词重写', `原始提示词: ${originalPrompt}`);
    logger.info('提示词重写', `场景旁白: ${sceneNarration}`);

    const rewritePrompt = `你是一个专业的视频提示词优化专家。你的任务是将视频提示词重写为100%安全的表达方式，确保通过平台的内容审核。

**原始场景旁白**:
${sceneNarration}

**原始视频提示词**:
${originalPrompt}

**要求**:
1. 保持原意不变，只调整表达方式
2. 移除所有可能触发内容审核的敏感词汇
3. 使用积极正向的词汇替换
4. 确保提示词简洁清晰，适合视频生成
5. 只返回重写后的提示词，不要其他内容

**重写后的提示词**:`;

    const messages = [
      { role: 'system', content: '你是一个专业的视频提示词优化专家，擅长将提示词重写为安全的表达方式。' },
      { role: 'user', content: rewritePrompt }
    ];

    try {
      const rewrittenPrompt = await this.sendToGLM(messages);
      logger.success('提示词重写', `重写完成`);
      logger.info('提示词重写', `重写后提示词: ${rewrittenPrompt}`);
      return rewrittenPrompt;
    } catch (error) {
      logger.error('提示词重写', `重写失败: ${error.message}`);
      logger.warn('提示词重写', '使用原始提示词');
      return originalPrompt;
    }
  }

  _parseStreamChunk(data) {
    if (!data.choices || data.choices.length === 0) {
      return null;
    }

    const choice = data.choices[0];
    const delta = choice.delta;

    if (!delta) {
      return null;
    }

    const chunk = new StreamChunk();

    if (delta.reasoning_content || delta.reasoning_content === '') {
      chunk.isReasoning = true;
      chunk.text = delta.reasoning_content || '';
    } else if (delta.content || delta.content === '') {
      chunk.isContent = true;
      chunk.text = delta.content || '';
    } else if (delta.tool_calls) {
      chunk.toolCalls = delta.tool_calls;
    }

    return chunk;
  }

  async _mockStream(messages) {
    const lastMessage = messages[messages.length - 1];
    const content = lastMessage.content || JSON.stringify(lastMessage);

    const mockContent = {
      'task_id': 'mock_task_' + Date.now(),
      'script_title': 'Mock 剧本',
      'scenes': [
        {
          'scene_id': 1,
          'narration': '这是第一个场景',
          'image_prompt': 'A beautiful scene with gentle light',
          'video_prompt': 'Smooth camera movement',
          'character_description': 'A young person with bright eyes'
        },
        {
          'scene_id': 2,
          'narration': '这是第二个场景',
          'image_prompt': 'Another beautiful scene',
          'video_prompt': 'Calm atmosphere',
          'character_description': 'The same character from scene 1'
        }
      ]
    };

    const jsonStr = JSON.stringify(mockContent, null, 2);

    const chunks = [];

    for (let i = 0; i < jsonStr.length; i += 10) {
      const chunk = jsonStr.slice(i, i + 10);
      chunks.push(new StreamChunk({
        isContent: true,
        text: chunk
      }));
    }

    return chunks;
  }
}

const aiClient = new AIClient();

export { AIClient, ChatMessage, StreamChunk, aiClient };
export default aiClient;
