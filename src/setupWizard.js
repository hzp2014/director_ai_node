import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import axios from 'axios';
import { createComfyUIClientFromSettings } from './comfyuiClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

class SetupWizard {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.envPath = path.join(projectRoot, '.env');
    this.envExamplePath = path.join(projectRoot, '.env.example');
    
    this.config = {};
  }

  async run() {
    console.log('\n' + '='.repeat(60));
    console.log('  AI Storyboard Pro - Node.js Platform Setup Wizard');
    console.log('='.repeat(60) + '\n');
    
    console.log('欢迎使用设置向导！本向导将帮助您配置基本设置。\n');
    
    await this.loadExampleConfig();
    await this.configureImageBackend();
    await this.configureServer();
    await this.configureComfyUI();
    await this.saveConfig();
    
    console.log('\n' + '='.repeat(60));
    console.log('  设置完成！');
    console.log('='.repeat(60));
    console.log('\n您可以运行以下命令启动服务器：');
    console.log('  npm start');
    console.log('\n或使用开发模式：');
    console.log('  npm run dev\n');
    
    this.rl.close();
  }

  async loadExampleConfig() {
    try {
      const content = await fs.readFile(this.envExamplePath, 'utf-8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=');
          this.config[key] = value;
        }
      }
    } catch (error) {
      console.warn('无法加载 .env.example，将使用默认配置');
    }
  }

  async configureImageBackend() {
    console.log('\n--- 图片生成后端配置 ---');
    console.log('可用选项：');
    console.log('  1. api      - 使用 NanaBanana API（需要 API 密钥）');
    console.log('  2. comfyui  - 使用本地 ComfyUI（需要 ComfyUI 运行）');
    console.log('  3. mock     - 测试模式（不生成真实图片）');
    
    const choice = await this.ask('选择后端 [comfyui]: ', 'comfyui');
    
    const validChoices = ['api', 'comfyui', 'mock', '1', '2', '3'];
    if (!validChoices.includes(choice.toLowerCase())) {
      console.log('无效选择，使用默认值：comfyui');
      this.config['IMAGE_BACKEND'] = 'comfyui';
    } else {
      const choiceMap = { '1': 'api', '2': 'comfyui', '3': 'mock' };
      this.config['IMAGE_BACKEND'] = choiceMap[choice] || choice;
    }
    
    if (this.config['IMAGE_BACKEND'] === 'api') {
      const apiKey = await this.ask('输入 NanaBanana API 密钥: ');
      if (apiKey) {
        this.config['NANA_BANANA_API_KEY'] = apiKey;
      }
      
      const baseUrl = await this.ask('输入 API 基础 URL [https://api.nanabanana.pro]: ', 'https://api.nanabanana.pro');
      this.config['NANA_BANANA_BASE_URL'] = baseUrl;
    }
  }

  async configureServer() {
    console.log('\n--- 服务器配置 ---');
    
    const port = await this.ask('API 端口 [8000]: ', '8000');
    this.config['API_PORT'] = port;
    
    const host = await this.ask('API 主机 [0.0.0.0]: ', '0.0.0.0');
    this.config['API_HOST'] = host;
    
    const cors = await this.ask('CORS 允许的源 [*]: ', '*');
    this.config['CORS_ORIGINS'] = cors;
    
    const debug = await this.ask('启用调试模式 [false]: ', 'false');
    this.config['DEBUG'] = debug;
  }

  async configureComfyUI() {
    console.log('\n--- ComfyUI 配置 ---');
    
    const enabled = await this.ask('启用 ComfyUI [true]: ', 'true');
    this.config['COMFYUI_ENABLED'] = enabled;
    
    if (enabled.toLowerCase() === 'true' || enabled === '1' || enabled === 'yes') {
      this.config['COMFYUI_ENABLED'] = 'true';
      
      const host = await this.ask('ComfyUI 主机 [127.0.0.1]: ', '127.0.0.1');
      this.config['COMFYUI_HOST'] = host;
      
      const port = await this.ask('ComfyUI 端口 [8188]: ', '8188');
      this.config['COMFYUI_PORT'] = port;
      
      const testConnection = await this.ask('测试 ComfyUI 连接 [y/N]: ', 'n');
      if (testConnection.toLowerCase() === 'y' || testConnection === 'yes') {
        await this.testComfyUIConnection(host, port);
      }
    } else {
      this.config['COMFYUI_ENABLED'] = 'false';
    }
  }

  async testComfyUIConnection(host = '127.0.0.1', port = 8188) {
    console.log('\n测试 ComfyUI 连接...');
    
    const comfyuiClient = createComfyUIClientFromSettings();
    const [success, message] = await comfyuiClient.testConnection();
    
    if (success) {
      console.log('✓', message);
      
      const models = await comfyuiClient.getModels();
      if (models && models.length > 0) {
        console.log('\n可用模型：');
        models.forEach(model => console.log(`  - ${model}`));
      } else {
        console.log('\n未检测到模型，请确保已下载模型文件');
      }
    } else {
      console.log('✗', message);
      console.log('提示：确保 ComfyUI 正在运行，地址和端口配置正确');
    }
  }

  async saveConfig() {
    console.log('\n--- 保存配置 ---');
    
    let content = '# AI Storyboard Pro - Environment Configuration\n';
    content += '# Generated by Setup Wizard\n';
    content += '# ' + new Date().toISOString() + '\n\n';
    
    for (const [key, value] of Object.entries(this.config)) {
      content += `${key}=${value}\n`;
    }
    
    try {
      await fs.writeFile(this.envPath, content, 'utf-8');
      console.log(`配置已保存到: ${this.envPath}`);
    } catch (error) {
      console.error('保存配置失败:', error.message);
    }
  }

  ask(question, defaultAnswer = '') {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim() || defaultAnswer);
      });
    });
  }
}

async function runWizard() {
  try {
    const wizard = new SetupWizard();
    await wizard.run();
  } catch (error) {
    console.error('Setup wizard error:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runWizard();
}

export { SetupWizard };
export default runWizard;
