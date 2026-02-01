import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import settings from './config.js';
import logger from './logger.js';
import { services } from './services.js';
import {
  BaseResponse,
  DataResponse,
  ProjectCreate,
  CharacterCreate,
  SceneCreate,
  ShotCreate
} from './schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = settings.apiPort;
const HOST = settings.apiHost;

settings.ensureDirectories();

const upload = multer({
  dest: settings.uploadsDir,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

app.use(cors({
  origin: settings.corsOrigins
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/assets', express.static(settings.assetsDir));
app.use('/outputs', express.static(settings.outputsDir));
app.use('/exports', express.static(settings.exportsDir));
app.use('/examples', express.static(settings.examplesDir));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.json({
    name: 'AI Storyboard Pro - Node.js Platform',
    version: '1.0.0',
    status: 'running',
    description: 'AI-powered professional storyboard generation platform',
    endpoints: {
      health: '/health',
      status: '/api/status',
      examples: '/api/examples',
      api: '/api',
      docs: {
        projects: '/api/projects',
        characters: '/api/projects/:id/characters',
        scenes: '/api/projects/:id/scenes',
        shots: '/api/projects/:id/shots'
      }
    },
    info: 'This is an API server. Use the endpoints above to interact with the service.'
  });
});

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.get('/api/status', (req, res) => {
  res.json(new DataResponse(true, 'Server operational', {
    backend: settings.imageBackend,
    comfyui_enabled: settings.comfyuiEnabled,
    debug: settings.debug
  }));
});

app.get('/api/projects', (req, res) => {
  try {
    const projectInfo = services.project.getProjectInfo();
    if (projectInfo) {
      res.json(new DataResponse(true, '获取项目信息成功', projectInfo));
    } else {
      res.status(404).json(new BaseResponse(false, '当前没有项目，请先创建项目'));
    }
  } catch (error) {
    logger.error('Get project error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { name, aspect_ratio } = req.body;
    const projectCreate = new ProjectCreate(name, aspect_ratio);

    const validation = projectCreate.validate();
    if (!validation.valid) {
      return res.status(400).json(new BaseResponse(false, validation.error));
    }

    const result = services.project.createProject(name, aspect_ratio);
    res.json(result);
  } catch (error) {
    logger.error('Create project error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.put('/api/projects/:id', (req, res) => {
  try {
    const { name, aspect_ratio } = req.body;
    if (name) {
      services.project.currentProject.name = name;
    }
    if (aspect_ratio) {
      services.project.currentProject.aspect_ratio = aspect_ratio;
    }
    res.json(new BaseResponse(true, '项目更新成功'));
  } catch (error) {
    logger.error('Update project error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.delete('/api/projects/:id', (req, res) => {
  try {
    services.project.currentProject = null;
    res.json(new BaseResponse(true, '项目已删除'));
  } catch (error) {
    logger.error('Delete project error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.put('/api/projects/:id/style', (req, res) => {
  try {
    const { style } = req.body;
    if (!style) {
      return res.status(400).json(new BaseResponse(false, '请指定风格'));
    }
    const result = services.project.setStyle(style);
    res.json(result);
  } catch (error) {
    logger.error('Set style error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.post('/api/projects/:id/load-example', (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json(new BaseResponse(false, '请指定示例名称'));
    }
    const result = services.project.loadExample(name);
    res.json(result);
  } catch (error) {
    logger.error('Load example error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.get('/api/examples', (req, res) => {
  try {
    const examples = services.getExampleStories();
    res.json(new DataResponse(true, '获取示例列表成功', { examples }));
  } catch (error) {
    logger.error('Get examples error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.get('/api/projects/:id/characters', (req, res) => {
  try {
    const characters = services.character.listCharacters();
    res.json(new DataResponse(true, '获取角色列表成功', { characters }));
  } catch (error) {
    logger.error('Get characters error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.post('/api/projects/:id/characters', (req, res) => {
  try {
    const { name, description, ref_images } = req.body;
    if (!name) {
      return res.status(400).json(new BaseResponse(false, '请输入角色名称'));
    }
    const result = services.character.addCharacter(name, description, ref_images || []);
    res.json(result);
  } catch (error) {
    logger.error('Add character error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.delete('/api/projects/:id/characters/:charId', (req, res) => {
  try {
    const { charId } = req.params;
    const result = services.character.deleteCharacter(charId);
    res.json(result);
  } catch (error) {
    logger.error('Delete character error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.get('/api/projects/:id/scenes', (req, res) => {
  try {
    const scenes = services.scene.listScenes();
    res.json(new DataResponse(true, '获取场景列表成功', { scenes }));
  } catch (error) {
    logger.error('Get scenes error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.post('/api/projects/:id/scenes', (req, res) => {
  try {
    const { name, description, ref_image } = req.body;
    if (!name) {
      return res.status(400).json(new BaseResponse(false, '请输入场景名称'));
    }
    const result = services.scene.addScene(name, description, ref_image || '');
    res.json(result);
  } catch (error) {
    logger.error('Add scene error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.delete('/api/projects/:id/scenes/:sceneId', (req, res) => {
  try {
    const { sceneId } = req.params;
    const result = services.scene.deleteScene(sceneId);
    res.json(result);
  } catch (error) {
    logger.error('Delete scene error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.get('/api/projects/:id/shots', (req, res) => {
  try {
    const shots = services.shot.listShots();
    res.json(new DataResponse(true, '获取镜头列表成功', { shots }));
  } catch (error) {
    logger.error('Get shots error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.post('/api/projects/:id/shots', (req, res) => {
  try {
    const { template, description, characters, scene_id } = req.body;
    if (!template) {
      return res.status(400).json(new BaseResponse(false, '请指定镜头模板'));
    }
    const result = services.shot.addShot(template, description, characters || [], scene_id || '');
    res.json(result);
  } catch (error) {
    logger.error('Add shot error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.put('/api/projects/:id/shots/:shotNum', (req, res) => {
  try {
    const { shotNum } = req.params;
    const { template, description, characters, scene_id } = req.body;
    const idx = parseInt(shotNum) - 1;
    
    if (idx < 0 || idx >= services.project.currentProject.shots.length) {
      return res.status(404).json(new BaseResponse(false, '镜头不存在'));
    }
    
    const shot = services.project.currentProject.shots[idx];
    if (template) {
      shot.template = template;
    }
    if (description) {
      shot.description = description;
    }
    if (characters) {
      shot.characters_in_shot = characters;
    }
    if (scene_id) {
      shot.scene_id = scene_id;
    }
    
    res.json(new BaseResponse(true, '镜头更新成功'));
  } catch (error) {
    logger.error('Update shot error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.delete('/api/projects/:id/shots/:shotNum', (req, res) => {
  try {
    const { shotNum } = req.params;
    const result = services.shot.deleteShot(parseInt(shotNum));
    res.json(result);
  } catch (error) {
    logger.error('Delete shot error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.put('/api/projects/:id/shots/:shotNum/move', (req, res) => {
  try {
    const { shotNum } = req.params;
    const { direction } = req.body;
    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json(new BaseResponse(false, 'direction 必须是 up 或 down'));
    }
    const result = services.shot.moveShot(parseInt(shotNum), direction);
    res.json(result);
  } catch (error) {
    logger.error('Move shot error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.post('/api/projects/:id/shots/:shotNum/generate', async (req, res) => {
  try {
    const { shotNum } = req.params;
    const { custom_prompt } = req.body;
    const result = await services.generation.generateShot(parseInt(shotNum), custom_prompt || '');
    res.json(result);
  } catch (error) {
    logger.error('Generate shot error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.post('/api/projects/:id/generate-all', async (req, res) => {
  try {
    const result = await services.generation.generateAll();
    res.json(result);
  } catch (error) {
    logger.error('Generate all error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.post('/api/export', async (req, res) => {
  try {
    const { format } = req.body;
    if (!format) {
      return res.status(400).json(new BaseResponse(false, '请指定导出格式（json 或 txt）'));
    }
    const result = await services.import_export.exportProject(format);
    res.json(result);
  } catch (error) {
    logger.error('Export error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.post('/api/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(new BaseResponse(false, '请上传文件'));
    }

    const { path: filepath, originalname } = req.file;
    const ext = path.extname(originalname).toLowerCase();

    if (ext === '.json') {
      const fs = await import('fs');
      const content = await fs.promises.readFile(filepath, 'utf-8');
      const data = JSON.parse(content);
      
      services.project.currentProject = {
        ...data,
        characters: data.characters || [],
        scenes: data.scenes || [],
        shots: data.shots || []
      };

      res.json(new BaseResponse(true, '项目导入成功'));
    } else {
      res.status(400).json(new BaseResponse(false, '不支持的文件格式，仅支持 JSON'));
    }
  } catch (error) {
    logger.error('Import error', { error: error.message, stack: error.stack });
    res.status(500).json(new BaseResponse(false, error.message));
  }
});

app.use((req, res) => {
  res.status(404).json(new BaseResponse(false, '接口不存在'));
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, path: req.path, method: req.method });
  res.status(500).json(new BaseResponse(false, err.message || '内部服务器错误'));
});

app.listen(PORT, HOST, () => {
  logger.info('AI Storyboard Pro - Node.js Platform');
  logger.info('='.repeat(50));
  logger.info('服务器已启动', { address: `http://${HOST}:${PORT}` });
  logger.info('后端配置', { backend: settings.imageBackend, debug: settings.debug });
  logger.info('目录配置', { 
    assets: settings.assetsDir, 
    projects: settings.projectsDir, 
    outputs: settings.outputsDir,
    exports: settings.exportsDir,
    uploads: settings.uploadsDir 
  });
  
  console.log('\n' + '='.repeat(50));
  console.log(`AI Storyboard Pro - Node.js Platform`);
  console.log('='.repeat(50));
  console.log(`\n🚀 服务器已启动`);
  console.log(`📍 地址: http://${HOST}:${PORT}`);
  console.log(`🔧 后端: ${settings.imageBackend}`);
  console.log(`🐛 调试模式: ${settings.debug ? '开启' : '关闭'}`);
  console.log(`\n📁 目录配置:`);
  console.log(`   Assets: ${settings.assetsDir}`);
  console.log(`   Projects: ${settings.projectsDir}`);
  console.log(`   Outputs: ${settings.outputsDir}`);
  console.log(`   Exports: ${settings.exportsDir}`);
  console.log(`   Uploads: ${settings.uploadsDir}`);
  console.log('\n' + '='.repeat(50) + '\n');
});

process.on('SIGINT', () => {
  logger.info('正在关闭服务器...');
  console.log('\n\n👋 正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('收到终止信号，正在关闭...');
  console.log('\n\n👋 收到终止信号，正在关闭...');
  process.exit(0);
});
