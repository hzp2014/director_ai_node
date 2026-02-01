import axios from 'axios';
import FormData from 'form-data';
import settings from './config.js';
import logger from './logger.js';

class VideoGenerationResponse {
  constructor({
    id,
    object = 'video',
    model = '',
    status = 'pending',
    progress = 0,
    createdAt = null,
    seconds = '5',
    videoUrl = null,
    error = null
  } = {}) {
    this.id = id;
    this.object = object;
    this.model = model;
    this.status = status;
    this.progress = progress;
    this.createdAt = createdAt;
    this.seconds = seconds;
    this.videoUrl = videoUrl;
    this.error = error;
  }

  get isCompleted() {
    return this.status === 'completed';
  }

  get isFailed() {
    return this.status === 'failed' || this.status === 'cancelled';
  }

  get isPending() {
    return this.status === 'pending';
  }

  get isProcessing() {
    return this.status === 'processing';
  }

  get hasVideoUrl() {
    return this.videoUrl !== null && this.videoUrl !== undefined;
  }

  static fromJson(data) {
    return new VideoGenerationResponse({
      id: data.id,
      object: data.object,
      model: data.model,
      status: data.status,
      progress: data.progress || 0,
      createdAt: data.created_at || data.createdAt,
      seconds: data.seconds?.toString() || '5',
      videoUrl: data.video_url || data.videoUrl,
      error: data.error
    });
  }
}

class VideoGenerator {
  constructor() {
    this.client = axios.create({
      baseURL: settings.videoApiBaseUrl,
      headers: {
        'Authorization': `Bearer ${settings.videoApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    });
  }

  async generateVideo({
    prompt,
    imageUrls = [],
    seconds = '5',
    model = settings.defaultVideoModel,
    size = settings.videoSize,
    sanitizePrompt = false
  } = {}) {
    const finalPrompt = sanitizePrompt ? this._sanitizeVideoPrompt(prompt) : prompt;

    if (settings.useMockVideoApi) {
      logger.warn('视频生成', '🧪 使用 Mock 模式，不调用真实 API');
      logger.info('视频生成', `参考图数量: ${imageUrls.length}`);

      await new Promise(resolve => setTimeout(resolve, 2000));

      return new VideoGenerationResponse({
        id: `mock_task_${Date.now()}`,
        model: model,
        status: 'completed',
        progress: 100,
        createdAt: Math.floor(Date.now() / 1000),
        seconds: seconds,
        videoUrl: 'https://example.com/mock-video.mp4'
      });
    }

    try {
      logger.info('视频生成', `开始生成视频: ${finalPrompt}, 时长: ${seconds}秒, 模型: ${model}`);
      logger.info('视频生成', `参考图数量: ${imageUrls.length}`);
      logger.info('视频生成', `参考图URL: ${JSON.stringify(imageUrls)}`);

      const formData = new FormData();
      formData.append('model', model);
      formData.append('prompt', finalPrompt);
      formData.append('seconds', seconds);
      formData.append('size', size);
      formData.append('watermark', 'false');

      for (const imageUrl of imageUrls) {
        formData.append('input_reference', imageUrl);
      }

      const response = await this.client.post('/videos', formData, {
        headers: {
          ...formData.getHeaders()
        }
      });

      const result = VideoGenerationResponse.fromJson(response.data);

      if (result.isCompleted && result.hasVideoUrl) {
        logger.success('视频生成', `视频生成成功: ${result.videoUrl}`);
      } else if (result.isFailed) {
        logger.error('视频生成', `视频生成失败: ${result.error}`);
      } else {
        logger.info('视频生成', `任务已提交: ${result.id}, 状态: ${result.status}`);
      }

      return result;
    } catch (error) {
      logger.error('视频生成', '生成视频失败', error);
      throw new Error(`视频生成错误: ${error.message}`);
    }
  }

  async pollVideoStatus({
    taskId,
    timeout = 600000,
    interval = 2000,
    onProgress = null,
    isCancelled = null
  } = {}) {
    if (settings.useMockVideoApi) {
      logger.warn('视频轮询', '🧪 Mock 模式，模拟轮询过程');

      for (let progress = 0; progress <= 100; progress += 25) {
        if (isCancelled && isCancelled()) {
          throw new Error('操作已取消');
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        logger.info('视频轮询', `模拟进度: ${progress}%`);
        if (onProgress) {
          onProgress(progress, 'in_progress');
        }
      }

      return new VideoGenerationResponse({
        id: taskId,
        model: 'veo3.1',
        status: 'completed',
        progress: 100,
        createdAt: Math.floor(Date.now() / 1000),
        seconds: '10',
        videoUrl: 'https://example.com/mock-video.mp4'
      });
    }

    const startTime = Date.now();

    while (true) {
      if (isCancelled && isCancelled()) {
        throw new Error('操作已取消');
      }

      if (Date.now() - startTime > timeout) {
        throw new Error(`视频生成超时 (${timeout}ms)`);
      }

      try {
        const response = await this.client.get(`/videos/${taskId}`);
        const result = VideoGenerationResponse.fromJson(response.data);

        logger.info('视频轮询', `任务 ${taskId}: 状态=${result.status}, 进度=${result.progress}%`);

        if (onProgress) {
          onProgress(result.progress, result.status);
        }

        if (result.isCompleted || result.isFailed) {
          return result;
        }

        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        if (error.response && error.response.status === 404) {
          throw new Error(`任务 ${taskId} 不存在`);
        }
        logger.error('视频轮询', `查询任务状态失败: ${error.message}`);
        throw error;
      }
    }
  }

  async cancelVideoGeneration(taskId) {
    try {
      logger.info('视频生成', `取消任务: ${taskId}`);
      await this.client.post(`/videos/${taskId}/cancel`);
      logger.success('视频生成', `任务已取消: ${taskId}`);
      return true;
    } catch (error) {
      logger.error('视频生成', `取消任务失败: ${error.message}`);
      return false;
    }
  }

  _sanitizeVideoPrompt(prompt) {
    logger.info('视频提示词清理', `原始提示词: ${prompt}`);

    let sanitized = prompt;

    const violentPatterns = [
      'lightning\\s+effects?',
      'glowing\\s+(eyes|hands|body)',
      'electric\\s+\\w+',
      'energy\\s+swirl',
      'powerful?\\s+\\w+',
      'explosion',
      'fire\\s+\\w+',
      'violent?\\s+\\w+',
      'attack\\s+\\w+',
      'battle\\s+\\w+',
      'fight\\s+\\w+',
      'weapon',
      'danger',
      'threaten',
      'aggressive',
      'intense',
      'dramatic\\s+lightning',
      'fierce',
      'determination\\s*\\([^)]*\\)',
      'sweating',
      'trembling\\s+spoon',
      'gripping\\s+spoon'
    ];

    for (const pattern of violentPatterns) {
      sanitized = sanitized.replace(new RegExp(pattern, 'gi'), 'gentle');
    }

    const replacements = {
      'lightning': 'soft light',
      'glowing': 'bright',
      'energy': 'atmosphere',
      'swirl': 'flow',
      'powerful': 'beautiful',
      'strong': 'elegant',
      'fierce': 'calm',
      'intense': 'warm',
      'dramatic': 'peaceful',
      'action': 'scene',
      'dynamic': 'smooth',
      'gripping': 'holding',
      'trembling': 'gentle'
    };

    for (const [key, value] of Object.entries(replacements)) {
      sanitized = sanitized.replace(new RegExp(key, 'gi'), value);
    }

    const result = `Peaceful anime style scene. ${sanitized}. Calm and positive atmosphere.`;

    logger.info('视频提示词清理', `清理后提示词: ${result}`);

    return result;
  }
}

const videoGenerator = new VideoGenerator();

export { VideoGenerator, VideoGenerationResponse, videoGenerator };
export default videoGenerator;
