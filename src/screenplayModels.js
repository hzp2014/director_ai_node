import { v4 as uuidv4 } from 'uuid';
import aiClient, { ChatMessage } from './aiClient.js';
import videoGenerator from './videoGenerator.js';
import logger from './logger.js';

export const ScreenplayStatus = {
  DRAFTING: 'drafting',
  CONFIRMED: 'confirmed',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const SceneStatus = {
  PENDING: 'pending',
  IMAGE_GENERATING: 'image_generating',
  IMAGE_COMPLETED: 'image_completed',
  VIDEO_GENERATING: 'video_generating',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const SceneStatusDisplay = {
  [SceneStatus.PENDING]: '等待中',
  [SceneStatus.IMAGE_GENERATING]: '生成图片中',
  [SceneStatus.IMAGE_COMPLETED]: '图片已完成',
  [SceneStatus.VIDEO_GENERATING]: '生成视频中',
  [SceneStatus.COMPLETED]: '已完成',
  [SceneStatus.FAILED]: '失败'
};

class Scene {
  constructor({
    sceneId,
    narration,
    imagePrompt,
    videoPrompt,
    characterDescription,
    imageUrl = null,
    videoUrl = null,
    status = SceneStatus.PENDING,
    customVideoPrompt = null
  } = {}) {
    this.sceneId = sceneId;
    this.narration = narration;
    this.imagePrompt = imagePrompt;
    this.videoPrompt = videoPrompt;
    this.characterDescription = characterDescription;
    this.imageUrl = imageUrl;
    this.videoUrl = videoUrl;
    this.status = status;
    this.customVideoPrompt = customVideoPrompt;
  }

  toJson() {
    return {
      scene_id: this.sceneId,
      narration: this.narration,
      image_prompt: this.imagePrompt,
      video_prompt: this.videoPrompt,
      character_description: this.characterDescription,
      image_url: this.imageUrl,
      video_url: this.videoUrl,
      status: this.status,
      custom_video_prompt: this.customVideoPrompt
    };
  }

  static fromJson(json) {
    return new Scene({
      sceneId: json.scene_id,
      narration: json.narration,
      imagePrompt: json.image_prompt,
      videoPrompt: json.video_prompt,
      characterDescription: json.character_description || json.characterDescription || '',
      imageUrl: json.image_url,
      videoUrl: json.video_url,
      status: json.status || SceneStatus.PENDING,
      customVideoPrompt: json.custom_video_prompt
    });
  }

  copyWith({
    sceneId,
    narration,
    imagePrompt,
    videoPrompt,
    characterDescription,
    imageUrl,
    videoUrl,
    status,
    customVideoPrompt
  } = {}) {
    return new Scene({
      sceneId: sceneId !== undefined ? sceneId : this.sceneId,
      narration: narration !== undefined ? narration : this.narration,
      imagePrompt: imagePrompt !== undefined ? imagePrompt : this.imagePrompt,
      videoPrompt: videoPrompt !== undefined ? videoPrompt : this.videoPrompt,
      characterDescription: characterDescription !== undefined ? characterDescription : this.characterDescription,
      imageUrl: imageUrl !== undefined ? imageUrl : this.imageUrl,
      videoUrl: videoUrl !== undefined ? videoUrl : this.videoUrl,
      status: status !== undefined ? status : this.status,
      customVideoPrompt: customVideoPrompt !== undefined ? customVideoPrompt : this.customVideoPrompt
    });
  }

  get statusDisplayName() {
    return SceneStatusDisplay[this.status] || this.status;
  }
}

class Screenplay {
  constructor({
    taskId = null,
    scriptTitle,
    scenes = [],
    status = ScreenplayStatus.DRAFTING
  } = {}) {
    this.taskId = taskId || uuidv4();
    this.scriptTitle = scriptTitle;
    this.scenes = scenes;
    this.status = status;
  }

  toJson() {
    return {
      task_id: this.taskId,
      script_title: this.scriptTitle,
      scenes: this.scenes.map(scene => scene.toJson()),
      status: this.status
    };
  }

  static fromJson(json) {
    return new Screenplay({
      taskId: json.task_id,
      scriptTitle: json.script_title,
      scenes: (json.scenes || []).map(scene => Scene.fromJson(scene)),
      status: json.status || ScreenplayStatus.DRAFTING
    });
  }

  get progress() {
    if (this.scenes.length === 0) return 0.0;

    const totalSteps = this.scenes.length * 2;
    let completedSteps = 0;

    for (const scene of this.scenes) {
      switch (scene.status) {
        case SceneStatus.IMAGE_GENERATING:
          completedSteps += 1;
          break;
        case SceneStatus.IMAGE_COMPLETED:
          completedSteps += 1;
          break;
        case SceneStatus.VIDEO_GENERATING:
          completedSteps += 2;
          break;
        case SceneStatus.COMPLETED:
          completedSteps += 2;
          break;
        case SceneStatus.PENDING:
        case SceneStatus.FAILED:
        default:
          break;
      }
    }

    return completedSteps / totalSteps;
  }

  get statusDescription() {
    if (this.status === ScreenplayStatus.DRAFTING) {
      return '剧本草稿，等待确认';
    }

    if (this.status === ScreenplayStatus.FAILED) {
      return '生成失败';
    }

    const pendingCount = this.scenes.filter(s => s.status === SceneStatus.PENDING).length;
    const imageGeneratingCount = this.scenes.filter(s => s.status === SceneStatus.IMAGE_GENERATING).length;
    const videoGeneratingCount = this.scenes.filter(s => s.status === SceneStatus.VIDEO_GENERATING).length;
    const completedCount = this.scenes.filter(s => s.status === SceneStatus.COMPLETED).length;
    const failedCount = this.scenes.filter(s => s.status === SceneStatus.FAILED).length;

    if (failedCount > 0) {
      return `部分场景失败 (${failedCount}/${this.scenes.length})`;
    }

    if (completedCount === this.scenes.length) {
      return '全部完成！';
    }

    if (videoGeneratingCount > 0) {
      return `正在生成视频 (${completedCount}/${this.scenes.length} 完成)`;
    }

    if (imageGeneratingCount > 0) {
      return `正在生成图片 (${completedCount}/${this.scenes.length} 完成)`;
    }

    if (pendingCount === this.scenes.length) {
      return '准备开始...';
    }

    return '处理中...';
  }

  copyWith({
    taskId,
    scriptTitle,
    scenes,
    status
  } = {}) {
    return new Screenplay({
      taskId: taskId !== undefined ? taskId : this.taskId,
      scriptTitle: scriptTitle !== undefined ? scriptTitle : this.scriptTitle,
      scenes: scenes !== undefined ? scenes : [...this.scenes],
      status: status !== undefined ? status : this.status
    });
  }

  updateScene(sceneId, updatedScene) {
    const newScenes = this.scenes.map(scene =>
      scene.sceneId === sceneId ? updatedScene : scene
    );

    return this.copyWith({ scenes: newScenes });
  }

  updateStatus(newStatus) {
    return this.copyWith({ status: newStatus });
  }

  getNextPendingScene() {
    return this.scenes.find(scene => scene.status === SceneStatus.PENDING);
  }

  getNextSceneForVideo() {
    return this.scenes.find(scene => scene.status === SceneStatus.IMAGE_COMPLETED);
  }

  get isAllCompleted() {
    return this.scenes.every(scene => scene.status === SceneStatus.COMPLETED);
  }

  get hasFailed() {
    return this.scenes.some(scene => scene.status === SceneStatus.FAILED);
  }
}

export class ScreenplayProgress {
  constructor({ progress, status, timestamp }) {
    this.progress = progress;
    this.status = status;
    this.timestamp = timestamp || new Date();
  }

  toString() {
    return `ScreenplayProgress(${(this.progress * 100).round()}%, ${this.status})`;
  }
}

export { Scene, Screenplay };
