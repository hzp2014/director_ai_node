import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { StoryboardProject, Character, Scene, Shot, StyleConfig, StyleMode, ShotTemplate, CameraSettings, CompositionSettings, SlotWeights } from './models.js';
import { getTemplate } from './templates.js';
import { generateShotPrompt, generateNegativePrompt, generateStandardShotPrompt } from './promptGenerator.js';
import { createGenerator, GenerationResult } from './imageGenerator.js';
import settings from './config.js';

const EXAMPLE_STORIES = {
  '咖啡厅邂逅': {
    name: '咖啡厅邂逅',
    description: '一个温馨的爱情故事开篇，男女主角在咖啡厅偶遇',
    aspect_ratio: '16:9',
    style: '电影感',
    characters: [
      { name: '李明', description: '28岁，年轻作家，戴黑框眼镜，穿深蓝色毛衣，气质文艺' },
      { name: '王薇', description: '26岁，设计师，长发披肩，穿白色连衣裙，清新优雅' }
    ],
    scenes: [
      { name: '咖啡厅内部', description: '现代简约风格咖啡厅，落地玻璃窗，午后阳光斜射，木质桌椅，绿植点缀' },
      { name: '咖啡厅门口', description: '咖啡厅玻璃门，门上有复古招牌，街道可见' }
    ],
    shots: [
      { template: '全景', description: '咖啡厅外观全景，阳光明媚，温馨的下午时光', characters: [], scene: '咖啡厅门口' },
      { template: '中景', description: '李明独自坐在靠窗位置，正在笔记本电脑前写作，偶尔抬头思考', characters: ['李明'], scene: '咖啡厅内部' },
      { template: '全景', description: '王薇推门走进咖啡厅，阳光在她身后形成光晕', characters: ['王薇'], scene: '咖啡厅门口' },
      { template: '中景', description: '王薇环顾四周寻找座位，目光扫过整个咖啡厅', characters: ['王薇'], scene: '咖啡厅内部' },
      { template: '过肩', description: '从李明背后视角，看到王薇朝这边走来', characters: ['李明', '王薇'], scene: '咖啡厅内部' },
      { template: '特写', description: '李明抬头，眼神中带着惊讶和欣赏', characters: ['李明'], scene: '咖啡厅内部' },
      { template: '特写', description: '王薇微微一笑，礼貌地问能否拼桌', characters: ['王薇'], scene: '咖啡厅内部' },
      { template: '中景', description: '两人面对面坐着，开始交谈，气氛逐渐热络', characters: ['李明', '王薇'], scene: '咖啡厅内部' }
    ]
  },
  '都市追逐': {
    name: '都市追逐',
    description: '紧张刺激的动作场景，主角在城市中被追逐',
    aspect_ratio: '16:9',
    style: '电影感',
    characters: [
      { name: '陈警官', description: '35岁，刑警，短发干练，穿深色夹克，眼神锐利' },
      { name: '神秘人', description: '身穿黑色风衣，戴帽子，面容模糊，身手敏捷' }
    ],
    scenes: [
      { name: '夜间街道', description: '城市夜景，霓虹灯闪烁，雨后湿滑的街道，反射着灯光' },
      { name: '小巷', description: '狭窄的后巷，堆满杂物，灯光昏暗，阴影重重' }
    ],
    shots: [
      { template: '全景', description: '雨后的城市夜景，霓虹灯倒映在湿漉漉的街面上', characters: [], scene: '夜间街道' },
      { template: '跟随', description: '陈警官在街道上奔跑，追逐前方的身影', characters: ['陈警官'], scene: '夜间街道' },
      { template: '低角度', description: '神秘人跃过障碍物，身形矫健', characters: ['神秘人'], scene: '小巷' },
      { template: '过肩', description: '陈警官追入小巷，看到前方分岔路口', characters: ['陈警官'], scene: '小巷' },
      { template: '特写', description: '陈警官喘着粗气，眼神警觉地观察四周', characters: ['陈警官'], scene: '小巷' },
      { template: '全景', description: '小巷尽头，神秘人的身影消失在黑暗中', characters: ['神秘人'], scene: '小巷' }
    ]
  },
  '温馨家庭': {
    name: '温馨家庭',
    description: '家庭日常温馨场景，展现亲情',
    aspect_ratio: '16:9',
    style: '电影感',
    characters: [
      { name: '妈妈', description: '38岁，温柔贤惠，系着围裙，笑容和蔼' },
      { name: '小美', description: '8岁小女孩，扎着双马尾，穿粉色裙子，活泼可爱' }
    ],
    scenes: [
      { name: '家庭厨房', description: '明亮温馨的厨房，阳光从窗户洒入，整洁有序' },
      { name: '餐厅', description: '木质餐桌，摆放着精美的餐具，墙上有全家福' }
    ],
    shots: [
      { template: '全景', description: '阳光明媚的厨房，妈妈正在准备早餐', characters: ['妈妈'], scene: '家庭厨房' },
      { template: '中景', description: '小美跑进厨房，抱住妈妈的腿', characters: ['妈妈', '小美'], scene: '家庭厨房' },
      { template: '特写', description: '妈妈低头看着小美，眼中满是慈爱', characters: ['妈妈'], scene: '家庭厨房' },
      { template: '中景', description: '妈妈牵着小美的手走向餐桌', characters: ['妈妈', '小美'], scene: '餐厅' },
      { template: '全景', description: '母女俩坐在餐桌前，享用温馨的早餐时光', characters: ['妈妈', '小美'], scene: '餐厅' }
    ]
  }
};

export class ProjectService {
  constructor() {
    this.currentProject = null;
  }

  get TEMPLATE_MAP() {
    return {
      '全景': ShotTemplate.T1_ESTABLISHING_WIDE,
      '中景': ShotTemplate.T4_STANDARD_MEDIUM,
      '特写': ShotTemplate.T6_CLOSEUP,
      '过肩': ShotTemplate.T5_OVER_SHOULDER,
      '低角度': ShotTemplate.T7_LOW_ANGLE,
      '跟随': ShotTemplate.T8_FOLLOWING
    };
  }

  get STYLE_MAP() {
    return {
      '电影感': ['Cinematic', 'realistic', 'cinematic'],
      '动漫风': ['Anime', 'anime', 'natural'],
      '漫画风': ['Comic', 'comic', 'natural'],
      '写实风': ['Realistic', 'realistic', 'natural'],
      '水彩画': ['Watercolor', 'watercolor', 'natural']
    };
  }

  createProject(name, aspectRatio = '16:9') {
    this.currentProject = new StoryboardProject({
      name,
      aspect_ratio: aspectRatio
    });

    return {
      success: true,
      message: `项目「${name}」创建成功`,
      project: this.getProjectInfo()
    };
  }

  getProjectInfo() {
    if (this.currentProject === null) {
      return null;
    }

    const projectId = this.currentProject.id || uuidv4().substring(0, 8);

    return {
      id: projectId,
      name: this.currentProject.name,
      aspect_ratio: this.currentProject.aspect_ratio,
      characters: this.currentProject.characters.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        ref_images: c.ref_images
      })),
      scenes: this.currentProject.scenes.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description
      })),
      shots: this.currentProject.shots.map(s => ({
        id: `shot_${s.shot_number}`,
        shot_number: s.shot_number,
        template: s.template ? s.template.value : 'medium',
        description: s.description,
        characters: s.characters_in_shot,
        scene_id: s.scene_id,
        output_image: s.output_image,
        generated_prompt: s.generated_prompt
      })),
      stats: {
        character_count: this.currentProject.characters.length,
        scene_count: this.currentProject.scenes.length,
        shot_count: this.currentProject.shots.length,
        completed_count: this.currentProject.shots.filter(s => s.output_image).length
      }
    };
  }

  setStyle(styleName) {
    if (this.currentProject === null) {
      return { success: false, message: '请先创建项目' };
    }

    const [preset, render, light] = this.STYLE_MAP[styleName] || ['Cinematic', 'realistic', 'cinematic'];

    this.currentProject.style = new StyleConfig({
      mode: StyleMode.PRESET,
      preset_name: preset,
      render_type: render,
      lighting_style: light,
      weight: 0.4
    });

    return { success: true, message: `风格已设为「${styleName}」` };
  }

  loadExample(storyName) {
    if (!EXAMPLE_STORIES[storyName]) {
      return { success: false, message: `未找到范例「${storyName}」` };
    }

    const example = EXAMPLE_STORIES[storyName];

    this.currentProject = new StoryboardProject({
      name: example.name,
      aspect_ratio: example.aspect_ratio
    });

    this.setStyle(example.style);

    for (const charData of example.characters) {
      const char = new Character({
        name: charData.name,
        description: charData.description,
        ref_images: [],
        consistency_weight: 0.85
      });
      this.currentProject.characters.push(char);
    }

    for (const sceneData of example.scenes) {
      const scene = new Scene({
        name: sceneData.name,
        description: sceneData.description,
        space_ref_image: '',
        consistency_weight: 0.7
      });
      this.currentProject.scenes.push(scene);
    }

    for (const shotData of example.shots) {
      this._addShotFromData(shotData);
    }

    return {
      success: true,
      message: `已加载范例「${storyName}」`,
      project: this.getProjectInfo()
    };
  }

  _addShotFromData(shotData) {
    const templateType = this.TEMPLATE_MAP[shotData.template] || ShotTemplate.T4_STANDARD_MEDIUM;
    const templateDef = getTemplate(templateType);

    const charIds = [];
    for (const cname of shotData.characters || []) {
      for (const c of this.currentProject.characters) {
        if (c.name === cname) {
          charIds.push(c.id);
          break;
        }
      }
    }

    let sceneId = '';
    for (const s of this.currentProject.scenes) {
      if (s.name === shotData.scene) {
        sceneId = s.id;
        break;
      }
    }

    const shot = new Shot({
      shot_number: this.currentProject.shots.length + 1,
      template: templateType,
      description: shotData.description,
      characters_in_shot: charIds,
      scene_id: sceneId,
      camera: templateDef ? templateDef.camera : new CameraSettings(),
      composition: templateDef ? templateDef.composition : new CompositionSettings(),
      slot_weights: new SlotWeights({
        character: templateDef ? templateDef.weight_profile.character : 0.85,
        scene: templateDef ? templateDef.weight_profile.scene : 0.5,
        props: templateDef ? templateDef.weight_profile.props : 0.6,
        style: templateDef ? templateDef.weight_profile.style : 0.4
      })
    });

    shot.generated_prompt = generateShotPrompt(shot, this.currentProject);
    this.currentProject.shots.push(shot);

    return shot;
  }
}

export class CharacterService {
  constructor(projectService) {
    this.projectService = projectService;
  }

  get project() {
    return this.projectService.currentProject;
  }

  addCharacter(name, description, refImages = []) {
    if (this.project === null) {
      return { success: false, message: '请先创建项目' };
    }

    if (!name.trim()) {
      return { success: false, message: '请输入角色名称' };
    }

    const char = new Character({
      name,
      description,
      ref_images: refImages,
      consistency_weight: 0.85
    });

    this.project.characters.push(char);

    return {
      success: true,
      message: `角色「${name}」已添加`,
      character: { id: char.id, name: char.name, description: char.description }
    };
  }

  deleteCharacter(characterId) {
    if (this.project === null) {
      return { success: false, message: '请先创建项目' };
    }

    for (let i = 0; i < this.project.characters.length; i++) {
      const c = this.project.characters[i];
      if (c.id === characterId || c.name === characterId) {
        this.project.characters.splice(i, 1);
        return { success: true, message: `角色「${c.name}」已删除` };
      }
    }

    return { success: false, message: '未找到该角色' };
  }

  listCharacters() {
    if (this.project === null) {
      return [];
    }

    return this.project.characters.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      ref_image_count: c.ref_images.length
    }));
  }
}

export class SceneService {
  constructor(projectService) {
    this.projectService = projectService;
  }

  get project() {
    return this.projectService.currentProject;
  }

  addScene(name, description, refImage = '') {
    if (this.project === null) {
      return { success: false, message: '请先创建项目' };
    }

    if (!name.trim()) {
      return { success: false, message: '请输入场景名称' };
    }

    const scene = new Scene({
      name,
      description,
      space_ref_image: refImage,
      consistency_weight: 0.7
    });

    this.project.scenes.push(scene);

    return {
      success: true,
      message: `场景「${name}」已添加`,
      scene: { id: scene.id, name: scene.name, description: scene.description }
    };
  }

  deleteScene(sceneId) {
    if (this.project === null) {
      return { success: false, message: '请先创建项目' };
    }

    for (let i = 0; i < this.project.scenes.length; i++) {
      const s = this.project.scenes[i];
      if (s.id === sceneId || s.name === sceneId) {
        this.project.scenes.splice(i, 1);
        return { success: true, message: `场景「${s.name}」已删除` };
      }
    }

    return { success: false, message: '未找到该场景' };
  }

  listScenes() {
    if (this.project === null) {
      return [];
    }

    return this.project.scenes.map(s => ({
      id: s.id,
      name: s.name,
      description: s.description
    }));
  }
}

export class ShotService {
  constructor(projectService) {
    this.projectService = projectService;
  }

  get TEMPLATE_MAP() {
    return ProjectService.prototype.TEMPLATE_MAP;
  }

  get project() {
    return this.projectService.currentProject;
  }

  addShot(templateName, description, characterIds = [], sceneId = '') {
    if (this.project === null) {
      return { success: false, message: '请先创建项目' };
    }

    const templateType = this.TEMPLATE_MAP[templateName] || ShotTemplate.T4_STANDARD_MEDIUM;
    const templateDef = getTemplate(templateType);

    const shot = new Shot({
      shot_number: this.project.shots.length + 1,
      template: templateType,
      description,
      characters_in_shot: characterIds,
      scene_id: sceneId,
      camera: templateDef ? templateDef.camera : new CameraSettings(),
      composition: templateDef ? templateDef.composition : new CompositionSettings(),
      slot_weights: new SlotWeights({
        character: templateDef ? templateDef.weight_profile?.character || 0.85 : 0.85,
        scene: templateDef ? templateDef.weight_profile?.scene || 0.5 : 0.5,
        props: templateDef ? templateDef.weight_profile?.props || 0.6 : 0.6,
        style: templateDef ? templateDef.weight_profile?.style || 0.4 : 0.4
      })
    });

    shot.generated_prompt = generateShotPrompt(shot, this.project);
    this.project.shots.push(shot);

    return {
      success: true,
      message: `镜头 ${shot.shot_number} 已添加`,
      shot: {
        id: shot.id,
        shot_number: shot.shot_number,
        generated_prompt: shot.generated_prompt
      }
    };
  }

  deleteShot(shotNumber) {
    if (this.project === null) {
      return { success: false, message: '请先创建项目' };
    }

    const idx = shotNumber - 1;
    if (idx >= 0 && idx < this.project.shots.length) {
      this.project.shots.splice(idx, 1);

      for (let i = 0; i < this.project.shots.length; i++) {
        this.project.shots[i].shot_number = i + 1;
      }

      return { success: true, message: '镜头已删除' };
    }

    return { success: false, message: '无效的镜头编号' };
  }

  moveShot(shotNumber, direction) {
    if (this.project === null) {
      return { success: false, message: '请先创建项目' };
    }

    const idx = shotNumber - 1;
    if (idx < 0 || idx >= this.project.shots.length) {
      return { success: false, message: '无效的镜头编号' };
    }

    if (direction === 'up' && idx > 0) {
      [this.project.shots[idx], this.project.shots[idx - 1]] = [this.project.shots[idx - 1], this.project.shots[idx]];
    } else if (direction === 'down' && idx < this.project.shots.length - 1) {
      [this.project.shots[idx], this.project.shots[idx + 1]] = [this.project.shots[idx + 1], this.project.shots[idx]];
    } else {
      return { success: false, message: '无法移动' };
    }

    for (let i = 0; i < this.project.shots.length; i++) {
      this.project.shots[i].shot_number = i + 1;
    }

    return {
      success: true,
      message: `镜头已${direction === 'up' ? '上移' : '下移'}`
    };
  }

  listShots() {
    if (this.project === null) {
      return [];
    }

    const result = [];
    for (const s of this.project.shots) {
      const template = getTemplate(s.template);

      const charNames = [];
      for (const cid of s.characters_in_shot) {
        for (const c of this.project.characters) {
          if (c.id === cid) {
            charNames.push(c.name);
            break;
          }
        }
      }

      let sceneName = '';
      for (const sc of this.project.scenes) {
        if (sc.id === s.scene_id) {
          sceneName = sc.name;
          break;
        }
      }

      result.push({
        id: `shot_${s.shot_number}`,
        shot_number: s.shot_number,
        template: template ? template.name_cn : '标准',
        scene: sceneName,
        characters: charNames,
        description: s.description,
        status: s.output_image ? 'completed' : 'pending',
        output_image: s.output_image
      });
    }

    return result;
  }
}

export class GenerationService {
  constructor(projectService) {
    this.projectService = projectService;
    this.generator = createGenerator(settings.imageBackend, {
      api_key: settings.apiKey,
      base_url: settings.apiBaseUrl,
      host: settings.comfyuiHost,
      port: settings.comfyuiPort,
      workflow_path: settings.comfyuiWorkflowDir
    });
  }

  get project() {
    return this.projectService.currentProject;
  }

  async generateShot(shotNumber, customPrompt = '') {
    if (this.project === null) {
      return { success: false, message: '请先创建项目' };
    }

    const idx = shotNumber - 1;
    if (idx < 0 || idx >= this.project.shots.length) {
      return { success: false, message: '无效的镜头编号' };
    }

    const shot = this.project.shots[idx];
    const prompt = customPrompt.trim() || shot.generated_prompt;

    if (!prompt) {
      shot.generated_prompt = generateShotPrompt(shot, this.project);
    }

    const template = getTemplate(shot.template);
    const negativePrompt = generateNegativePrompt(template);

    const result = await this.generator.generate(
      shot.generated_prompt || prompt,
      {
        width: 1024,
        height: 576,
        negative_prompt: negativePrompt
      }
    );

    if (result.success) {
      shot.output_image = result.image_path;
      return {
        success: true,
        message: `镜头 ${shotNumber} 生成完成`,
        image_path: result.image_path,
        metadata: result.metadata
      };
    } else {
      return { success: false, message: `生成失败: ${result.error}` };
    }
  }

  async generateAll() {
    if (this.project === null) {
      return { success: false, message: '请先创建项目' };
    }

    if (this.project.shots.length === 0) {
      return { success: false, message: '请先添加镜头' };
    }

    let success = 0;
    const total = this.project.shots.length;
    const results = [];

    for (const shot of this.project.shots) {
      if (!shot.output_image) {
        if (!shot.generated_prompt) {
          shot.generated_prompt = generateShotPrompt(shot, this.project);
        }

        const template = getTemplate(shot.template);
        const negativePrompt = generateNegativePrompt(template);

        const result = await this.generator.generate(
          shot.generated_prompt,
          {
            width: 1024,
            height: 576,
            negative_prompt: negativePrompt
          }
        );

        if (result.success) {
          shot.output_image = result.image_path;
          success++;
          results.push({
            shot_number: shot.shot_number,
            success: true,
            image_path: result.image_path
          });
        } else {
          results.push({
            shot_number: shot.shot_number,
            success: false,
            error: result.error
          });
        }
      }
    }

    return {
      success: true,
      message: `已生成 ${success}/${total} 个镜头`,
      results
    };
  }
}

export class ImportExportService {
  constructor(projectService) {
    this.projectService = projectService;
  }

  get project() {
    return this.projectService.currentProject;
  }

  async exportProject(formatType) {
    if (this.project === null) {
      return { success: false, message: '请先创建项目' };
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `${this.project.name}_${timestamp}.${formatType}`;
    const filepath = path.join(settings.exportsDir, filename);

    if (formatType === 'json') {
      const jsonContent = JSON.stringify(this.project.toDict(), null, 2);
      await fs.writeFile(filepath, jsonContent, 'utf-8');
      return { success: true, message: `已导出 ${filename}`, filepath };
    } else if (formatType === 'txt') {
      const lines = this._generateScriptText();
      await fs.writeFile(filepath, lines.join('\n'), 'utf-8');
      return { success: true, message: `已导出 ${filename}`, filepath };
    }

    return { success: false, message: '未知格式' };
  }

  _generateScriptText() {
    const lines = [
      `分镜脚本: ${this.project.name}`,
      `画面比例: ${this.project.aspect_ratio}`,
      '',
      '='.repeat(50),
      '角色列表:',
      '='.repeat(50)
    ];

    for (const char of this.project.characters) {
      lines.push(`  - ${char.name}: ${char.description}`);
    }

    lines.push('', '='.repeat(50), '场景列表:', '='.repeat(50));

    for (const scene of this.project.scenes) {
      lines.push(`  - ${scene.name}: ${scene.description}`);
    }

    lines.push('', '='.repeat(50), '分镜列表:', '='.repeat(50), '');

    for (const shot of this.project.shots) {
      const template = getTemplate(shot.template);
      const charNames = this.project.characters
        .filter(c => shot.characters_in_shot.includes(c.id))
        .map(c => c.name);

      const sceneName = this.project.scenes.find(s => s.id === shot.scene_id)?.name || '';

      lines.push(
        `镜头 ${shot.shot_number}`,
        `  类型: ${template ? template.name_cn : '标准'}`,
        `  场景: ${sceneName}`,
        `  角色: ${charNames.length > 0 ? charNames.join(', ') : '无'}`,
        `  描述: ${shot.description}`,
        ''
      );
    }

    return lines;
  }
}

export class ServiceContainer {
  constructor() {
    this.project = new ProjectService();
    this.character = new CharacterService(this.project);
    this.scene = new SceneService(this.project);
    this.shot = new ShotService(this.project);
    this.generation = new GenerationService(this.project);
    this.import_export = new ImportExportService(this.project);
  }

  getExampleStories() {
    return Object.entries(EXAMPLE_STORIES).map(([name, story]) => ({
      name,
      description: story.description,
      character_count: story.characters.length,
      scene_count: story.scenes.length,
      shot_count: story.shots.length
    }));
  }
}

export const services = new ServiceContainer();
