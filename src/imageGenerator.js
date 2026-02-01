import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import settings from './config.js';

export class GenerationResult {
  constructor({
    success = false,
    image_path = '',
    error = null,
    metadata = {}
  } = {}) {
    this.success = success;
    this.image_path = image_path;
    this.error = error;
    this.metadata = metadata;
  }
}

export class ImageGenerator {
  constructor(apiKey) {
    this.api_key = apiKey;
  }

  async generate(prompt, options = {}) {
    throw new Error('Subclasses must implement generate() method');
  }

  async generateWithSeed(prompt, seed) {
    return this.generate(prompt, { seed });
  }
}

export class ApiImageGenerator extends ImageGenerator {
  constructor(apiKey, baseUrl) {
    super(apiKey);
    this.base_url = baseUrl || 'https://api.nanabanana.pro';
  }

  async generate(prompt, options = {}) {
    try {
      const { width = 1024, height = 576 } = options;

      const sizeMap = {
        '1024x576': '1024x1024',
        '512x512': '512x512',
        '1024x1024': '1024x1024',
        '1920x1080': '1024x1024'
      };
      const size = sizeMap[`${width}x${height}`] || '1024x1024';

      const requestBody = {
        model: 'dall-e-3',
        prompt,
        n: 1,
        size
      };

      const response = await axios.post(
        `${this.base_url}/v1/images/generations`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${this.api_key}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      if (response.data && response.data.data && response.data.data.length > 0) {
        return new GenerationResult({
          success: true,
          image_path: response.data.data[0].url,
          metadata: {
            revised_prompt: response.data.data[0].revised_prompt
          }
        });
      }

      return new GenerationResult({
        success: false,
        error: 'Invalid response from API'
      });
    } catch (error) {
      console.error('API generation error:', error.message);
      if (error.response && error.response.data) {
        console.error('API response:', JSON.stringify(error.response.data));
      }
      return new GenerationResult({
        success: false,
        error: error.response?.data?.message || error.message
      });
    }
  }

  getNegativePrompt() {
    return 'blurry, out of focus, low quality, distorted, deformed, ugly, bad anatomy, worst quality, low resolution';
  }
}

export class ComfyUIImageGenerator extends ImageGenerator {
  constructor(host, port, workflowPath) {
    super('');
    this.host = host || '127.0.0.1';
    this.port = port || 8188;
    this.base_url = `http://${this.host}:${this.port}`;
    this.workflow_path = workflowPath;
  }

  async generate(prompt, options = {}) {
    try {
      const {
        width = 1024,
        height = 576,
        steps = 30,
        seed = -1
      } = options;

      const workflow = await this.buildWorkflow(prompt, {
        width,
        height,
        steps,
        seed: seed >= 0 ? seed : Math.floor(Math.random() * 4294967295)
      });

      const response = await axios.post(
        `${this.base_url}/prompt`,
        { prompt: workflow },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 300000
        }
      );

      const promptId = response.data.prompt_id;
      const result = await this.waitForCompletion(promptId);

      if (result.success) {
        return new GenerationResult({
          success: true,
          image_path: result.image_path,
          metadata: {
            seed: seed >= 0 ? seed : undefined,
            prompt_id: promptId
          }
        });
      }

      return result;
    } catch (error) {
      console.error('ComfyUI generation error:', error.message);
      return new GenerationResult({
        success: false,
        error: error.message
      });
    }
  }

  async buildWorkflow(prompt, options) {
    if (this.workflow_path) {
      const fs = await import('fs');
      const workflowData = fs.readFileSync(this.workflow_path, 'utf-8');
      const workflow = JSON.parse(workflowData);
      return this.customizeWorkflow(workflow, prompt, options);
    }

    return this.getDefaultWorkflow(prompt, options);
  }

  getDefaultWorkflow(prompt, options) {
    const nodeId = Date.now();
    return {
      [nodeId]: {
        class_type: 'KSampler',
        inputs: {
          seed: options.seed,
          steps: options.steps,
          cfg: 7.5,
          sampler_name: 'euler',
          scheduler: 'normal',
          denoise: 1,
          model: ['4', 0],
          positive: ['6', 0],
          negative: ['7', 0],
          latent_image: ['5', 0]
        }
      },
      [nodeId + 1]: {
        class_type: 'VAEDecode',
        inputs: {
          samples: [`${nodeId}`, 0],
          vae: ['4', 2]
        }
      },
      [nodeId + 2]: {
        class_type: 'SaveImage',
        inputs: {
          filename_prefix: `generated_${Date.now()}`,
          images: [`${nodeId + 1}`, 0]
        }
      },
      4: {
        class_type: 'CheckpointLoaderSimple',
        inputs: {
          ckpt_name: 'v1-5-pruned.ckpt'
        }
      },
      5: {
        class_type: 'EmptyLatentImage',
        inputs: {
          width: options.width,
          height: options.height,
          batch_size: 1
        }
      },
      6: {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: prompt,
          clip: ['4', 1]
        }
      },
      7: {
        class_type: 'CLIPTextEncode',
        inputs: {
          text: 'blurry, out of focus, low quality',
          clip: ['4', 1]
        }
      }
    };
  }

  customizeWorkflow(workflow, prompt, options) {
    for (const nodeId in workflow) {
      const node = workflow[nodeId];
      if (node.class_type === 'KSampler') {
        node.inputs.seed = options.seed;
        node.inputs.steps = options.steps;
      } else if (node.class_type === 'CLIPTextEncode') {
        if (node.inputs.text && !node.inputs.text.includes('blurry')) {
          node.inputs.text = prompt;
        }
      } else if (node.class_type === 'EmptyLatentImage') {
        node.inputs.width = options.width;
        node.inputs.height = options.height;
      }
    }
    return workflow;
  }

  async waitForCompletion(promptId, maxWait = 300, interval = 2) {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait * 1000) {
      const response = await axios.get(
        `${this.base_url}/history/${promptId}`
      );

      const history = response.data;
      if (history && history[promptId]) {
        const outputs = history[promptId].outputs;
        for (const nodeId in outputs) {
          const nodeOutput = outputs[nodeId];
          if (nodeOutput.images && nodeOutput.images.length > 0) {
            const image = nodeOutput.images[0];
            const imagePath = `${this.base_url}/view?filename=${image.filename}&subfolder=${image.subfolder || ''}&type=${image.type}`;
            return new GenerationResult({
              success: true,
              image_path: imagePath
            });
          }
        }
      }

      await new Promise(resolve => setTimeout(resolve, interval * 1000));
    }

    return new GenerationResult({
      success: false,
      error: 'Generation timeout'
    });
  }
}

export class MockImageGenerator extends ImageGenerator {
  constructor() {
    super('');
  }

  async generate(prompt, options = {}) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { width = 1024, height = 576 } = options;
    const mockImagePath = `mock_${width}x${height}_${Date.now()}.png`;

    console.log(`[MOCK] Generated image for prompt: ${prompt.substring(0, 100)}...`);
    console.log(`[MOCK] Mock image path: ${mockImagePath}`);

    return new GenerationResult({
      success: true,
      image_path: mockImagePath,
      metadata: {
        mock: true,
        generation_time: 1.0
      }
    });
  }
}

export function createGenerator(backend, options = {}) {
  switch (backend) {
    case 'api':
      return new ApiImageGenerator(
        options.api_key || settings.apiKey,
        options.base_url || settings.apiBaseUrl
      );

    case 'comfyui':
      return new ComfyUIImageGenerator(
        options.host || settings.comfyuiHost,
        options.port || settings.comfyuiPort,
        options.workflow_path || settings.comfyuiWorkflowDir
      );

    case 'mock':
      return new MockImageGenerator();

    default:
      console.warn(`Unknown backend: ${backend}, falling back to mock`);
      return new MockImageGenerator();
  }
}

export async function testConnection(backend) {
  const generator = createGenerator(backend);

  try {
    const result = await generator.generate('test prompt', { width: 512, height: 512, steps: 1 });
    return {
      success: result.success,
      message: result.success ? 'Connection successful' : result.error
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}
