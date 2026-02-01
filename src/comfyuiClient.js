import axios from 'axios';
import WebSocket from 'ws';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import settings from './config.js';

export class ComfyUIConfig {
  constructor({
    host = '127.0.0.1',
    port = 8188,
    useHttps = false,
    timeout = 300,
    workflowDir = null,
    workflowFile = null,
    enabled = true,
    model = ''
  } = {}) {
    this.host = host;
    this.port = port;
    this.useHttps = useHttps;
    this.timeout = timeout;
    this.workflowDir = workflowDir;
    this.workflowFile = workflowFile;
    this.enabled = enabled;
    this.model = model;
  }

  get baseUrl() {
    const protocol = this.useHttps ? 'https' : 'http';
    return `${protocol}://${this.host}:${this.port}`;
  }

  get wsUrl() {
    const protocol = this.useHttps ? 'wss' : 'ws';
    return `${protocol}://${this.host}:${this.port}/ws`;
  }

  static fromSettings() {
    try {
      let workflowFile = null;
      if (settings.comfyuiWorkflowFile) {
        const wfPath = path.resolve(settings.comfyuiWorkflowFile);
        workflowFile = wfPath;
      }

      return new ComfyUIConfig({
        host: settings.comfyuiHost || '127.0.0.1',
        port: settings.comfyuiPort || 8188,
        workflowDir: settings.comfyuiWorkflowDir || null,
        workflowFile,
        enabled: settings.comfyuiEnabled,
        model: settings.comfyuiModel || ''
      });
    } catch (error) {
      return new ComfyUIConfig();
    }
  }
}

export class GenerationParams {
  constructor({
    prompt = '',
    negativePrompt = '',
    width = 1024,
    height = 576,
    steps = 20,
    cfgScale = 7.0,
    sampler = 'euler',
    scheduler = 'normal',
    seed = -1,
    denoise = 1.0,
    refImagePath = '',
    refStrength = 0.75
  } = {}) {
    this.prompt = prompt;
    this.negativePrompt = negativePrompt;
    this.width = width;
    this.height = height;
    this.steps = steps;
    this.cfgScale = cfgScale;
    this.sampler = sampler;
    this.scheduler = scheduler;
    this.seed = seed;
    this.denoise = denoise;
    this.refImagePath = refImagePath;
    this.refStrength = refStrength;
  }
}

export class GenerationResult {
  constructor({
    success = false,
    images = [],
    error = '',
    promptId = '',
    generationTime = 0
  } = {}) {
    this.success = success;
    this.images = images;
    this.error = error;
    this.promptId = promptId;
    this.generationTime = generationTime;
  }
}

export class ComfyUIClient {
  constructor(config = null) {
    this.config = config || new ComfyUIConfig();
    this.clientId = uuidv4();
    this.customWorkflow = null;
    this.workflowCache = {};
    this.availableModels = null;
    this.defaultModel = null;

    if (this.config.workflowFile) {
      this._loadConfiguredWorkflow();
    }
  }

  async _loadConfiguredWorkflow() {
    if (!this.config.workflowFile) {
      return;
    }

    try {
      const workflowData = await fs.readFile(this.config.workflowFile, 'utf-8');
      this.customWorkflow = JSON.parse(workflowData);
      console.log(`[ComfyUI] Loaded custom workflow: ${path.basename(this.config.workflowFile)}`);
    } catch (error) {
      console.error(`[ComfyUI] Failed to load workflow: ${error.message}`);
    }
  }

  isEnabled() {
    return this.config.enabled;
  }

  hasCustomWorkflow() {
    return this.customWorkflow !== null;
  }

  getDefaultModel() {
    if (this.config.model) {
      return this.config.model;
    }

    if (this.defaultModel === null) {
      const models = this.getModels();
      if (models && models.length > 0) {
        this.defaultModel = models[0];
        console.log(`[ComfyUI] Auto-detected model: ${this.defaultModel}`);
      } else {
        this.defaultModel = '';
      }
    }

    return this.defaultModel;
  }

  async listWorkflows() {
    if (!this.config.workflowDir) {
      return [];
    }

    try {
      const files = await fs.readdir(this.config.workflowDir);
      const workflows = files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
      return workflows.sort();
    } catch (error) {
      return [];
    }
  }

  async loadWorkflow(name) {
    if (!this.config.workflowDir) {
      return [false, 'Workflow directory not configured'];
    }

    const workflowPath = path.join(this.config.workflowDir, `${name}.json`);
    return this.loadWorkflowFromFile(workflowPath);
  }

  async getWorkflow(name) {
    if (name in this.workflowCache) {
      return this.workflowCache[name];
    }

    if (!this.config.workflowDir) {
      return null;
    }

    const workflowPath = path.join(this.config.workflowDir, `${name}.json`);
    try {
      const workflowData = await fs.readFile(workflowPath, 'utf-8');
      const workflow = JSON.parse(workflowData);
      this.workflowCache[name] = workflow;
      return workflow;
    } catch (error) {
      return null;
    }
  }

  clearWorkflowCache() {
    this.workflowCache = {};
  }

  async testConnection() {
    try {
      const response = await axios.get(`${this.config.baseUrl}/system_stats`, { timeout: 5000 });
      if (response.status === 200) {
        const stats = response.data;
        const gpuName = stats.devices && stats.devices[0] ? stats.devices[0].name : 'Unknown';
        return [true, `ComfyUI connected. GPU: ${gpuName}`];
      } else {
        return [false, `Connection failed: HTTP ${response.status}`];
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return [false, `Cannot connect to ${this.config.baseUrl}`];
      }
      return [false, `Connection error: ${error.message}`];
    }
  }

  async getModels() {
    try {
      const response = await axios.get(`${this.config.baseUrl}/object_info/CheckpointLoaderSimple`, { timeout: 10000 });
      if (response.status === 200) {
        const data = response.data;
        const models = data.CheckpointLoaderSimple?.input?.required?.ckpt_name?.[0] || [];
        return models;
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  async uploadImage(imagePath, subfolder = '') {
    try {
      await fs.access(imagePath);
    } catch (error) {
      return [false, `Image not found: ${imagePath}`];
    }

    try {
      const formData = new FormData();
      const imageBuffer = await fs.readFile(imagePath);
      formData.append('image', new Blob([imageBuffer]), path.basename(imagePath));

      if (subfolder) {
        formData.append('subfolder', subfolder);
      }

      const response = await axios.post(`${this.config.baseUrl}/upload/image`, formData, {
        headers: formData.getHeaders(),
        timeout: 30000
      });

      if (response.status === 200) {
        const result = response.data;
        return [true, result.name || ''];
      } else {
        return [false, `Upload failed: HTTP ${response.status}`];
      }
    } catch (error) {
      return [false, `Upload error: ${error.message}`];
    }
  }

  setCustomWorkflow(workflow) {
    this.customWorkflow = workflow;
  }

  async loadWorkflowFromFile(filepath) {
    try {
      const workflowData = await fs.readFile(filepath, 'utf-8');
      this.customWorkflow = JSON.parse(workflowData);
      return [true, 'Workflow loaded successfully'];
    } catch (error) {
      return [false, `Failed to load workflow: ${error.message}`];
    }
  }

  _prepareTxt2ImgWorkflow(params, model = '') {
    const workflow = JSON.parse(JSON.stringify(this.DEFAULT_TXT2IMG_WORKFLOW));

    workflow['3']['inputs']['seed'] = params.seed >= 0 ? params.seed : Math.floor(Date.now() / 1000) % (2 ** 32);
    workflow['3']['inputs']['steps'] = params.steps;
    workflow['3']['inputs']['cfg'] = params.cfgScale;
    workflow['3']['inputs']['sampler_name'] = params.sampler;
    workflow['3']['inputs']['scheduler'] = params.scheduler;

    workflow['5']['inputs']['width'] = params.width;
    workflow['5']['inputs']['height'] = params.height;

    workflow['6']['inputs']['text'] = params.prompt;
    workflow['7']['inputs']['text'] = params.negativePrompt;

    const modelToUse = model || this.getDefaultModel();
    if (modelToUse) {
      workflow['4']['inputs']['ckpt_name'] = modelToUse;
    }

    return workflow;
  }

  _prepareImg2ImgWorkflow(params, uploadedImage, model = '') {
    const workflow = JSON.parse(JSON.stringify(this.DEFAULT_IMG2IMG_WORKFLOW));

    workflow['1']['inputs']['image'] = uploadedImage;

    workflow['3']['inputs']['seed'] = params.seed >= 0 ? params.seed : Math.floor(Date.now() / 1000) % (2 ** 32);
    workflow['3']['inputs']['steps'] = params.steps;
    workflow['3']['inputs']['cfg'] = params.cfgScale;
    workflow['3']['inputs']['sampler_name'] = params.sampler;
    workflow['3']['inputs']['scheduler'] = params.scheduler;
    workflow['3']['inputs']['denoise'] = params.denoise;

    workflow['6']['inputs']['text'] = params.prompt;
    workflow['7']['inputs']['text'] = params.negativePrompt;

    const modelToUse = model || this.getDefaultModel();
    if (modelToUse) {
      workflow['4']['inputs']['ckpt_name'] = modelToUse;
    }

    return workflow;
  }

  async queuePrompt(workflow) {
    try {
      const payload = {
        prompt: workflow,
        client_id: this.clientId
      };

      const response = await axios.post(`${this.config.baseUrl}/prompt`, payload, { timeout: 30000 });

      if (response.status === 200) {
        const result = response.data;
        const promptId = result.prompt_id || '';

        if (promptId) {
          return [true, promptId];
        }

        if (result.error) {
          return [false, `ComfyUI error: ${result.error}`];
        }

        return [true, promptId];
      } else {
        return [false, `Queue failed: HTTP ${response.status}`];
      }
    } catch (error) {
      return [false, `Queue error: ${error.message}`];
    }
  }

  async waitForCompletion(promptId, progressCallback = null) {
    return new Promise((resolve, reject) => {
      const wsUrl = `${this.config.wsUrl}?clientId=${this.clientId}`;
      const ws = new WebSocket(wsUrl);

      const outputImages = [];
      let executionError = null;

      let timeoutId = setTimeout(() => {
        ws.close();
        resolve([false, ['Timeout waiting for completion']]);
      }, this.config.timeout * 1000);

      ws.on('message', (data) => {
        if (Buffer.isBuffer(data)) {
          return;
        }

        try {
          const message = JSON.parse(data.toString());
          const msgType = message.type || '';

          if (msgType === 'progress') {
            const current = message.data?.value || 0;
            const total = message.data?.max || 100;
            if (progressCallback) {
              progressCallback(current, total);
            }
          } else if (msgType === 'executing') {
            const node = message.data?.node;
            if (node === null) {
              ws.close();
            }
          } else if (msgType === 'executed') {
            const nodeOutput = message.data?.output || {};
            const images = nodeOutput.images || [];
            for (const img of images) {
              outputImages.push(img.filename || '');
            }
            const videos = nodeOutput.videos || [];
            for (const vid of videos) {
              outputImages.push(vid.filename || '');
            }
            const gifs = nodeOutput.gifs || [];
            for (const gif of gifs) {
              outputImages.push(gif.filename || '');
            }
          } else if (msgType === 'execution_error') {
            const errorData = message.data || {};
            executionError = errorData.exception_message || 'Unknown execution error';
            const nodeId = errorData.node_id || 'unknown';
            const nodeType = errorData.node_type || 'unknown';
            executionError = `Node ${nodeId} (${nodeType}): ${executionError}`;
            ws.close();
          } else if (msgType === 'execution_cached') {
            // Cached nodes, continue
          }
        } catch (error) {
          // Skip malformed messages
        }
      });

      ws.on('close', () => {
        clearTimeout(timeoutId);

        if (executionError) {
          resolve([false, [executionError]]);
        }

        if (outputImages.length === 0) {
          resolve([false, ['No output files generated']]);
        }

        resolve([true, outputImages]);
      });

      ws.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve([false, [`WebSocket error: ${error.message}`]]);
      });
    });
  }

  async getImage(filename, subfolder = '', folderType = 'output') {
    try {
      const params = {
        filename,
        subfolder,
        type: folderType
      };
      const response = await axios.get(`${this.config.baseUrl}/view`, {
        params,
        responseType: 'arraybuffer',
        timeout: 30000
      });

      if (response.status === 200) {
        return Buffer.from(response.data);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async textToImage(params, model = '', outputDir = '', progressCallback = null) {
    const startTime = Date.now();
    const result = new GenerationResult();

    let workflow;
    if (this.customWorkflow) {
      workflow = JSON.parse(JSON.stringify(this.customWorkflow));
      this._injectParamsToWorkflow(workflow, params);
    } else {
      workflow = this._prepareTxt2ImgWorkflow(params, model);
    }

    const [success, promptId] = await this.queuePrompt(workflow);
    if (!success) {
      result.error = promptId;
      return result;
    }

    result.promptId = promptId;

    const [success2, outputFiles] = await this.waitForCompletion(promptId, progressCallback);
    if (!success2) {
      result.error = outputFiles[0] || 'Unknown error';
      return result;
    }

    if (outputDir) {
      await fs.mkdir(outputDir, { recursive: true });
    }

    for (const filename of outputFiles) {
      if (filename) {
        const imageData = await this.getImage(filename);
        if (imageData) {
          if (outputDir) {
            const savePath = path.join(outputDir, filename);
            await fs.writeFile(savePath, imageData);
            result.images.push(savePath);
          } else {
            result.images.push(imageData.toString('base64'));
          }
        }
      }
    }

    result.success = result.images.length > 0;
    result.generationTime = (Date.now() - startTime) / 1000;
    return result;
  }

  async imageToImage(params, model = '', outputDir = '', progressCallback = null) {
    const startTime = Date.now();
    const result = new GenerationResult();

    if (!params.refImagePath) {
      result.error = 'Reference image path is required';
      return result;
    }

    const [success, uploadedName] = await this.uploadImage(params.refImagePath);
    if (!success) {
      result.error = `Failed to upload reference image: ${uploadedName}`;
      return result;
    }

    const workflow = this._prepareImg2ImgWorkflow(params, uploadedName, model);

    const [success2, promptId] = await this.queuePrompt(workflow);
    if (!success2) {
      result.error = promptId;
      return result;
    }

    result.promptId = promptId;

    const [success3, outputFiles] = await this.waitForCompletion(promptId, progressCallback);
    if (!success3) {
      result.error = outputFiles[0] || 'Unknown error';
      return result;
    }

    if (outputDir) {
      await fs.mkdir(outputDir, { recursive: true });
    }

    for (const filename of outputFiles) {
      if (filename) {
        const imageData = await this.getImage(filename);
        if (imageData) {
          if (outputDir) {
            const savePath = path.join(outputDir, filename);
            await fs.writeFile(savePath, imageData);
            result.images.push(savePath);
          } else {
            result.images.push(imageData.toString('base64'));
          }
        }
      }
    }

    result.success = result.images.length > 0;
    result.generationTime = (Date.now() - startTime) / 1000;
    return result;
  }

  _injectParamsToWorkflow(workflow, params) {
    let promptInjected = false;

    for (const nodeId of Object.keys(workflow)) {
      const node = workflow[nodeId];
      const classType = node.class_type || '';
      const inputs = node.inputs || {};

      if (classType === 'PrimitiveStringMultiline') {
        if ('value' in inputs) {
          inputs.value = params.prompt;
          promptInjected = true;
        }
      } else if (classType === 'CLIPTextEncode') {
        if ('text' in inputs) {
          if (typeof inputs.text === 'string') {
            if (inputs.text === '' || inputs.text === 'positive') {
              inputs.text = params.prompt;
              promptInjected = true;
            } else if (inputs.text === 'negative') {
              inputs.text = params.negativePrompt;
            }
          }
        }
      } else if (classType === 'EmptyLatentImage') {
        if ('width' in inputs) {
          inputs.width = params.width;
        }
        if ('height' in inputs) {
          inputs.height = params.height;
        }
      } else if (classType === 'EmptySD3LatentImage') {
        if ('width' in inputs) {
          inputs.width = params.width;
        }
        if ('height' in inputs) {
          inputs.height = params.height;
        }
      } else if (classType === 'KSampler') {
        if ('seed' in inputs) {
          inputs.seed = params.seed >= 0 ? params.seed : Math.floor(Date.now() / 1000) % (2 ** 32);
        }
      } else if (classType === 'LoadImage') {
        if (params.refImagePath && 'image' in inputs) {
          // Handled separately in image_to_image
        }
      }
    }

    return promptInjected;
  }

  async interrupt() {
    try {
      const response = await axios.post(`${this.config.baseUrl}/interrupt`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async getQueueStatus() {
    try {
      const response = await axios.get(`${this.config.baseUrl}/queue`, { timeout: 5000 });
      if (response.status === 200) {
        return response.data;
      }
      return {};
    } catch (error) {
      return {};
    }
  }

  get DEFAULT_TXT2IMG_WORKFLOW() {
    return {
      '3': {
        'inputs': {
          'seed': 0,
          'steps': 20,
          'cfg': 7.0,
          'sampler_name': 'euler',
          'scheduler': 'normal',
          'denoise': 1.0,
          'model': ['4', 0],
          'positive': ['6', 0],
          'negative': ['7', 0],
          'latent_image': ['5', 0]
        },
        'class_type': 'KSampler'
      },
      '4': {
        'inputs': {
          'ckpt_name': 'sd_xl_base_1.0.safetensors'
        },
        'class_type': 'CheckpointLoaderSimple'
      },
      '5': {
        'inputs': {
          'width': 1024,
          'height': 576,
          'batch_size': 1
        },
        'class_type': 'EmptyLatentImage'
      },
      '6': {
        'inputs': {
          'text': '',
          'clip': ['4', 1]
        },
        'class_type': 'CLIPTextEncode'
      },
      '7': {
        'inputs': {
          'text': '',
          'clip': ['4', 1]
        },
        'class_type': 'CLIPTextEncode'
      },
      '8': {
        'inputs': {
          'samples': ['3', 0],
          'vae': ['4', 2]
        },
        'class_type': 'VAEDecode'
      },
      '9': {
        'inputs': {
          'filename_prefix': 'ComfyUI',
          'images': ['8', 0]
        },
        'class_type': 'SaveImage'
      }
    };
  }

  get DEFAULT_IMG2IMG_WORKFLOW() {
    return {
      '1': {
        'inputs': {
          'image': '',
          'upload': 'image'
        },
        'class_type': 'LoadImage'
      },
      '2': {
        'inputs': {
          'pixels': ['1', 0],
          'vae': ['4', 2]
        },
        'class_type': 'VAEEncode'
      },
      '3': {
        'inputs': {
          'seed': 0,
          'steps': 20,
          'cfg': 7.0,
          'sampler_name': 'euler',
          'scheduler': 'normal',
          'denoise': 0.75,
          'model': ['4', 0],
          'positive': ['6', 0],
          'negative': ['7', 0],
          'latent_image': ['2', 0]
        },
        'class_type': 'KSampler'
      },
      '4': {
        'inputs': {
          'ckpt_name': 'sd_xl_base_1.0.safetensors'
        },
        'class_type': 'CheckpointLoaderSimple'
      },
      '6': {
        'inputs': {
          'text': '',
          'clip': ['4', 1]
        },
        'class_type': 'CLIPTextEncode'
      },
      '7': {
        'inputs': {
          'text': '',
          'clip': ['4', 1]
        },
        'class_type': 'CLIPTextEncode'
      },
      '8': {
        'inputs': {
          'samples': ['3', 0],
          'vae': ['4', 2]
        },
        'class_type': 'VAEDecode'
      },
      '9': {
        'inputs': {
          'filename_prefix': 'ComfyUI',
          'images': ['8', 0]
        },
        'class_type': 'SaveImage'
      }
    };
  }
}

export function createComfyUIClient(host = '127.0.0.1', port = 8188, workflowDir = null) {
  const config = new ComfyUIConfig({ host, port, workflowDir });
  return new ComfyUIClient(config);
}

export function createComfyUIClientFromSettings() {
  const config = ComfyUIConfig.fromSettings();
  return new ComfyUIClient(config);
}
