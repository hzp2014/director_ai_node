import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  const result = dotenv.config({ path: envPath });
  if (result.error) {
    console.warn(`Warning: Failed to load .env file: ${result.error.message}`);
  }
}

loadEnv();

class Settings {
  constructor() {
    this._apiKey = process.env.NANA_BANANA_API_KEY || '';
    this._apiBaseUrl = process.env.NANA_BANANA_BASE_URL || 'https://api.nanabanana.pro';
    this._imageBackend = process.env.IMAGE_BACKEND || 'api';
    this._gradioPort = parseInt(process.env.GRADIO_PORT || '7861');
    this._gradioHost = process.env.GRADIO_HOST || '0.0.0.0';
    this._apiPort = parseInt(process.env.API_PORT || '8000');
    this._apiHost = process.env.API_HOST || '0.0.0.0';
    this._corsOrigins = (process.env.CORS_ORIGINS || '*').split(',').map(s => s.trim()).filter(s => s);
    this._maxUploadSizeMb = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50');
    this._allowedExtensions = (process.env.ALLOWED_EXTENSIONS || '.pdf,.docx,.doc,.md,.markdown,.html,.htm,.txt,.jpg,.jpeg,.png').split(',').map(s => s.trim().toLowerCase());
    this._comfyuiEnabled = process.env.COMFYUI_ENABLED === 'true' || process.env.COMFYUI_ENABLED === '1';
    this._comfyuiHost = process.env.COMFYUI_HOST || '127.0.0.1';
    this._comfyuiPort = parseInt(process.env.COMFYUI_PORT || '8188');
    this._comfyuiWorkflowDir = process.env.COMFYUI_WORKFLOW_DIR || null;
    this._ollamaHost = process.env.OLLAMA_HOST || 'localhost';
    this._ollamaPort = parseInt(process.env.OLLAMA_PORT || '11434');
    this._debug = process.env.DEBUG === 'true' || process.env.DEBUG === '1';
    this._baseDir = PROJECT_ROOT;

    this._zhipuApiKey = process.env.ZHIPU_API_KEY || '';
    this._zhipuApiBaseUrl = process.env.ZHIPU_API_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
    this._defaultChatModel = process.env.DEFAULT_CHAT_MODEL || 'glm-4.7';

    this._doubaoApiKey = process.env.DOUBAO_API_KEY || '';
    this._doubaoApiBaseUrl = process.env.DOUBAO_API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
    this._defaultImageModel = process.env.DOUBAO_IMAGE_MODEL || 'doubao-vision-pro-32k';

    this._videoApiKey = process.env.VIDEO_API_KEY || '';
    this._videoApiBaseUrl = process.env.VIDEO_API_BASE_URL || 'https://api.tuzi.ai/v1';
    this._defaultVideoModel = process.env.VIDEO_MODEL || 'veo3.1-components';
    this._videoSize = process.env.VIDEO_SIZE || '1280x720';
    this._videoSeconds = process.env.VIDEO_SECONDS || '5';

    this._concurrentScenes = parseInt(process.env.CONCURRENT_SCENES || '3');

    this._useMockVideoApi = process.env.USE_MOCK_VIDEO_API === 'true' || process.env.USE_MOCK_VIDEO_API === '1';
    this._useMockChatApi = process.env.USE_MOCK_CHAT_API === 'true' || process.env.USE_MOCK_CHAT_API === '1';

    this._ffmpegPath = process.env.FFMPEG_PATH || null;
    this._mergedVideosDir = process.env.MERGED_VIDEOS_DIR || './outputs/merged_videos';

    this._characterReferenceCount = parseInt(process.env.CHARACTER_REFERENCE_COUNT || '3');
  }

  get apiKey() {
    return this._apiKey;
  }

  get apiBaseUrl() {
    return this._apiBaseUrl;
  }

  get imageBackend() {
    return this._imageBackend;
  }

  get gradioPort() {
    return this._gradioPort;
  }

  get gradioHost() {
    return this._gradioHost;
  }

  get apiPort() {
    return this._apiPort;
  }

  get apiHost() {
    return this._apiHost;
  }

  get corsOrigins() {
    return this._corsOrigins;
  }

  get maxUploadSizeMb() {
    return this._maxUploadSizeMb;
  }

  get maxUploadSizeBytes() {
    return this._maxUploadSizeMb * 1024 * 1024;
  }

  get allowedExtensions() {
    return this._allowedExtensions;
  }

  get comfyuiEnabled() {
    return this._comfyuiEnabled;
  }

  get comfyuiHost() {
    return this._comfyuiHost;
  }

  get comfyuiPort() {
    return this._comfyuiPort;
  }

  get comfyuiWorkflowDir() {
    return this._comfyuiWorkflowDir;
  }

  get ollamaHost() {
    return this._ollamaHost;
  }

  get ollamaPort() {
    return this._ollamaPort;
  }

  get debug() {
    return this._debug;
  }

  get baseDir() {
    return this._baseDir;
  }

  get zhipuApiKey() {
    return this._zhipuApiKey;
  }

  get zhipuApiBaseUrl() {
    return this._zhipuApiBaseUrl;
  }

  get defaultChatModel() {
    return this._defaultChatModel;
  }

  get doubaoApiKey() {
    return this._doubaoApiKey;
  }

  get doubaoApiBaseUrl() {
    return this._doubaoApiBaseUrl;
  }

  get defaultImageModel() {
    return this._defaultImageModel;
  }

  get videoApiKey() {
    return this._videoApiKey;
  }

  get videoApiBaseUrl() {
    return this._videoApiBaseUrl;
  }

  get defaultVideoModel() {
    return this._defaultVideoModel;
  }

  get videoSize() {
    return this._videoSize;
  }

  get videoSeconds() {
    return this._videoSeconds;
  }

  get concurrentScenes() {
    return this._concurrentScenes;
  }

  get useMockVideoApi() {
    return this._useMockVideoApi;
  }

  get useMockChatApi() {
    return this._useMockChatApi;
  }

  get ffmpegPath() {
    return this._ffmpegPath;
  }

  get mergedVideosDir() {
    return path.join(this._baseDir, this._mergedVideosDir);
  }

  get characterReferenceCount() {
    return this._characterReferenceCount;
  }

  get assetsDir() {
    return path.join(this._baseDir, 'assets');
  }

  get projectsDir() {
    return path.join(this._baseDir, 'projects');
  }

  get outputsDir() {
    return path.join(this._baseDir, 'outputs');
  }

  get exportsDir() {
    return path.join(this._baseDir, 'exports');
  }

  get examplesDir() {
    return path.join(this._baseDir, 'examples');
  }

  get uploadsDir() {
    return path.join(this._baseDir, 'uploads');
  }

  get logsDir() {
    return path.join(this._baseDir, 'logs');
  }

  ensureDirectories() {
    const directories = [
      this.assetsDir,
      this.projectsDir,
      this.outputsDir,
      this.exportsDir,
      this.examplesDir,
      this.uploadsDir,
      this.mergedVideosDir,
      this.logsDir
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    const assetSubdirs = ['characters', 'scenes', 'props', 'styles'];
    assetSubdirs.forEach(subdir => {
      const subdirPath = path.join(this.assetsDir, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
      }
    });
  }

  validate(strict = false) {
    const errors = [];

    if (!this._apiKey || this._apiKey === 'your_api_key_here') {
      if (strict) {
        errors.push('NANA_BANANA_API_KEY is required for image generation');
      } else {
        console.warn('\n[WARNING] API key not configured - image generation will not work');
        console.warn('          Configure it in .env file\n');
      }
    }

    if (!this._gradioPort || this._gradioPort < 1 || this._gradioPort > 65535) {
      errors.push('GRADIO_PORT must be between 1 and 65535');
    }

    if (!this._apiPort || this._apiPort < 1 || this._apiPort > 65535) {
      errors.push('API_PORT must be between 1 and 65535');
    }

    if (this._maxUploadSizeMb <= 0) {
      errors.push('MAX_UPLOAD_SIZE_MB must be positive');
    }

    return errors;
  }

  isValid() {
    return this.validate().length === 0;
  }

  printConfig(showSecrets = false) {
    console.log('\n' + '='.repeat(50));
    console.log('AI Storyboard Pro - Configuration (Node.js)');
    console.log('='.repeat(50));

    const apiKeyDisplay = this._apiKey && this._apiKey.length > 8
      ? '***' + this._apiKey.slice(-8)
      : 'NOT SET';

    if (showSecrets) {
      console.log(`API Key: ${this._apiKey || 'NOT SET'}`);
    } else {
      console.log(`API Key: ${apiKeyDisplay}`);
    }
    console.log(`API Base URL: ${this._apiBaseUrl}`);
    console.log(`\nGradio Server: ${this._gradioHost}:${this._gradioPort}`);
    console.log(`API Server: ${this._apiHost}:${this._apiPort}`);
    console.log(`\nCORS Origins: ${this._corsOrigins.join(', ')}`);
    console.log(`\nMax Upload Size: ${this._maxUploadSizeMb} MB`);
    console.log(`Allowed Extensions: ${this._allowedExtensions.join(', ')}`);

    if (this._comfyuiHost) {
      console.log(`\nComfyUI: ${this._comfyuiHost}:${this._comfyuiPort}`);
    }
    console.log(`Ollama: ${this._ollamaHost}:${this._ollamaPort}`);
    console.log(`\nDebug Mode: ${this._debug}`);
    console.log('='.repeat(50) + '\n');
  }
}

const settings = new Settings();

export function getSettings() {
  return settings;
}

export function reloadSettings() {
  const newSettings = new Settings();
  Object.assign(settings, newSettings);
  return settings;
}

export function needsSetup() {
  const envPath = path.join(PROJECT_ROOT, '.env');
  return !fs.existsSync(envPath);
}

export default settings;
