import { v4 as uuidv4 } from 'uuid';
import aiClient, { ChatMessage } from './aiClient.js';
import videoGenerator from './videoGenerator.js';
import settings from './config.js';
import logger from './logger.js';
import { Screenplay, Scene, SceneStatus, ScreenplayStatus, ScreenplayProgress } from './screenplayModels.js';

class ScreenplayService {
  constructor() {
    this.currentScreenplay = null;
    this.isCancelled = false;
    this.userOriginalImages = null;
    this.characterReferenceUrls = null;
    this.progressCallbacks = [];
  }

  async generateScreenplay(userPrompt, { userImages = null, onProgress = null } = {}) {
    this.isCancelled = false;
    this.userOriginalImages = userImages;
    logger.info('剧本生成', `开始处理用户请求: ${userPrompt}`);

    if (userImages && userImages.length > 0) {
      logger.info('剧本生成', `用户提供了 ${userImages.length} 张参考图片`);
    }

    try {
      let characterAnalysis = null;

      if (userImages && userImages.length > 0) {
        this._emitProgress(0.05, '正在分析图片特征...', onProgress);
        characterAnalysis = await this._analyzeUserImage(userImages[0]);
        logger.success('图片分析', '角色特征提取完成');
      }

      this._emitProgress(0.1, '正在规划剧本...', onProgress);
      const screenplayJson = await this._callGLMForScreenplay(userPrompt, characterAnalysis);

      if (this.isCancelled) {
        logger.warn('剧本生成', '用户取消操作');
        throw new Error('操作已取消');
      }

      this._emitProgress(0.2, '正在解析剧本...', onProgress);
      const screenplay = this._parseScreenplay(screenplayJson);
      this.currentScreenplay = screenplay;

      logger.success('剧本生成', `剧本生成成功: ${screenplay.scriptTitle}, ${screenplay.scenes.length} 个场景`);
      this._emitProgress(0.3, '剧本规划完成！开始生成图片...', onProgress);

      await this._generateAllImages(screenplay, (progress, status) => {
        const totalProgress = 0.3 + (progress * 0.4);
        this._emitProgress(totalProgress, status, onProgress);
      });

      if (this.isCancelled) {
        logger.warn('剧本生成', '用户取消操作');
        throw new Error('操作已取消');
      }

      await this._generateAllVideos(screenplay, (progress, status) => {
        const totalProgress = 0.7 + (progress * 0.3);
        this._emitProgress(totalProgress, status, onProgress);
      });

      if (this.isCancelled) {
        logger.warn('剧本生成', '用户取消操作');
        throw new Error('操作已取消');
      }

      logger.success('剧本生成', `全部完成！${this.currentScreenplay.scriptTitle}`);
      this._emitProgress(1.0, '全部完成！', onProgress);

      this.userOriginalImages = null;

      return this.currentScreenplay;
    } catch (error) {
      this.userOriginalImages = null;
      logger.error('剧本生成', '生成失败', error);
      throw error;
    }
  }

  async generateFromConfirmed(confirmedScreenplay, { userImages = null, characterImageUrls = null, onProgress = null } = {}) {
    this.isCancelled = false;
    this.userOriginalImages = userImages;
    this.characterReferenceUrls = characterImageUrls;
    this.currentScreenplay = confirmedScreenplay;

    const totalScenes = confirmedScreenplay.scenes.length;
    logger.info('剧本生成（从确认）', `开始并行生成图片和视频: ${confirmedScreenplay.scriptTitle}, ${totalScenes} 个场景`);

    if (characterImageUrls && characterImageUrls.length > 0) {
      logger.info('剧本生成（从确认）', `使用角色三视图: ${characterImageUrls.length} 张`);
    }

    try {
      this.currentScreenplay = this.currentScreenplay.updateStatus(ScreenplayStatus.GENERATING);

      const characterUrls = this.characterReferenceUrls ? this.characterReferenceUrls.slice(0, 2) : [];
      const completedSteps = [];
      const totalSteps = totalScenes * 2;

      const updateProgress = () => {
        const progress = completedSteps.length / totalSteps;
        const completedImages = completedSteps.filter(s => s.startsWith('image_')).length;
        const completedVideos = completedSteps.filter(s => s.startsWith('video_')).length;
        this._emitProgress(progress, `${completedImages}/${totalScenes} 图片完成, ${completedVideos}/${totalScenes} 视频完成`, onProgress);
      };

      const concurrency = settings.concurrentScenes || 3;
      logger.info('剧本生成（从确认）', `并发模式: 每批 ${concurrency} 个场景并行处理`);

      const processScene = async (scene) => {
        const sceneNum = confirmedScreenplay.scenes.indexOf(scene) + 1;
        const sceneIdKey = `scene_${scene.sceneId}`;

        const currentScene = this.currentScreenplay.scenes.find(s => s.sceneId === scene.sceneId);
        if (currentScene.status !== SceneStatus.PENDING) {
          logger.info('剧本生成', `场景 ${sceneNum} 已被处理（状态: ${currentScene.statusDisplayName}），跳过`);
          if (!completedSteps.includes(`image_${sceneIdKey}`)) {
            completedSteps.push(`image_${sceneIdKey}`);
          }
          if (!completedSteps.includes(`video_${sceneIdKey}`)) {
            completedSteps.push(`video_${sceneIdKey}`);
          }
          updateProgress();
          return;
        }

        let imageUrl;

        if (this.isCancelled) {
          throw new Error('操作已取消');
        }

        this.currentScreenplay = this.currentScreenplay.updateScene(
          scene.sceneId,
          scene.copyWith({ status: SceneStatus.IMAGE_GENERATING })
        );

        try {
          if (this.userOriginalImages && this.userOriginalImages.length > 0) {
            logger.info('图片生成', `场景 ${sceneNum} 使用用户原图进行图生图`);
            imageUrl = await this._generateImageWithReference(scene.imagePrompt, this.userOriginalImages);
          } else if (characterUrls.length > 0) {
            logger.info('图片生成', `场景 ${sceneNum} 使用角色三视图进行图生图`);
            imageUrl = await this._generateImageWithCharacterReference(scene.imagePrompt, characterUrls);
          } else {
            logger.warn('图片生成', `场景 ${sceneNum} 没有参考图，使用纯文本生成（人物可能不一致）`);
            imageUrl = await this._generateImage(scene.imagePrompt);
          }

          this.currentScreenplay = this.currentScreenplay.updateScene(
            scene.sceneId,
            scene.copyWith({ imageUrl, status: SceneStatus.IMAGE_COMPLETED })
          );
          logger.success('图片生成', `场景 ${sceneNum} 图片生成完成: ${imageUrl}`);

          completedSteps.push(`image_${sceneIdKey}`);
          updateProgress();
        } catch (error) {
          logger.error('图片生成', `场景 ${sceneNum} 图片生成失败: ${error.message}`);
          this.currentScreenplay = this.currentScreenplay.updateScene(
            scene.sceneId,
            scene.copyWith({ status: SceneStatus.FAILED })
          );
          completedSteps.push(`image_${sceneIdKey}`);
          completedSteps.push(`video_${sceneIdKey}`);
          updateProgress();
          return;
        }

        if (this.isCancelled) {
          throw new Error('操作已取消');
        }

        const updatedScene = this.currentScreenplay.scenes.find(s => s.sceneId === scene.sceneId);
        this.currentScreenplay = this.currentScreenplay.updateScene(
          scene.sceneId,
          updatedScene.copyWith({ status: SceneStatus.VIDEO_GENERATING })
        );

        try {
          const referenceUrls = [];
          referenceUrls.push(...characterUrls);
          if (imageUrl) {
            referenceUrls.push(imageUrl);
          }

          logger.info('视频生成', `场景 ${sceneNum} 参考图: ${referenceUrls.length} 张`);

          const characterDescription = scene.characterDescription;
          let scenePrompt = scene.videoPrompt;
          if (characterDescription) {
            scenePrompt = `Character reference: ${characterDescription}. Scene: ${scene.videoPrompt}`;
          }

          const videoResponse = await videoGenerator.generateVideo({
            imageUrls: referenceUrls,
            prompt: scenePrompt,
            seconds: '5',
            model: 'veo3.1-components',
            sanitizePrompt: true
          });

          const finalResponse = await videoGenerator.pollVideoStatus({
            taskId: videoResponse.id,
            timeout: 600000,
            interval: 2000,
            onProgress: (progress, status) => {
              logger.info('视频生成', `场景 ${sceneNum} 视频生成中... ${progress}%`);
            },
            isCancelled: () => this.isCancelled
          });

          this.currentScreenplay = this.currentScreenplay.updateScene(
            scene.sceneId,
            updatedScene.copyWith({ videoUrl: finalResponse.videoUrl, status: SceneStatus.COMPLETED })
          );
          logger.success('视频生成', `场景 ${sceneNum} 视频生成完成: ${finalResponse.videoUrl}`);

          completedSteps.push(`video_${sceneIdKey}`);
          updateProgress();
        } catch (error) {
          logger.error('视频生成', `场景 ${sceneNum} 视频生成失败: ${error.message}`);
          const failedScene = this.currentScreenplay.scenes.find(s => s.sceneId === scene.sceneId);
          this.currentScreenplay = this.currentScreenplay.updateScene(
            scene.sceneId,
            failedScene.copyWith({ status: SceneStatus.FAILED })
          );
          completedSteps.push(`video_${sceneIdKey}`);
          updateProgress();
        }
      };

      for (let i = 0; i < confirmedScreenplay.scenes.length; i += concurrency) {
        if (this.isCancelled) {
          throw new Error('操作已取消');
        }

        const batchStart = i;
        const batchEnd = Math.min(i + concurrency, confirmedScreenplay.scenes.length);
        const batch = confirmedScreenplay.scenes.slice(batchStart, batchEnd);

        logger.info('剧本生成（从确认）', `处理批次 ${batchStart + 1}-${batchEnd} (${batch.length} 个场景)`);

        await Promise.all(
          batch.map(scene => processScene(scene).catch(error => {
            logger.error('剧本生成（从确认）', `场景处理失败: ${error.message}`);
          }))
        );
      }

      if (this.isCancelled) {
        throw new Error('操作已取消');
      }

      this.currentScreenplay = this.currentScreenplay.updateStatus(ScreenplayStatus.COMPLETED);

      logger.success('剧本生成（从确认）', `全部完成！${this.currentScreenplay.scriptTitle}`);
      this._emitProgress(1.0, '全部完成！', onProgress);

      this.userOriginalImages = null;
      this.characterReferenceUrls = null;

      return this.currentScreenplay;
    } catch (error) {
      this.currentScreenplay = this.currentScreenplay.updateStatus(ScreenplayStatus.FAILED);
      this.userOriginalImages = null;
      this.characterReferenceUrls = null;
      logger.error('剧本生成（从确认）', '生成失败', error);
      throw error;
    }
  }

  async retryScene(sceneId, { onProgress = null, forceRegenerateImage = false } = {}) {
    if (!this.currentScreenplay) {
      throw new Error('没有当前剧本');
    }

    const scene = this.currentScreenplay.scenes.find(s => s.sceneId === sceneId);
    if (!scene) {
      throw new Error(`场景 ${sceneId} 不存在`);
    }

    const sceneNum = this.currentScreenplay.scenes.indexOf(scene) + 1;
    const hasImage = scene.imageUrl && scene.imageUrl.length > 0;
    const shouldRegenerateImage = forceRegenerateImage || !hasImage;

    logger.info('场景重试', `开始重试场景 ${sceneNum}, 已有图片: ${hasImage}, 强制重新生成图片: ${forceRegenerateImage}`);

    const characterUrls = this.characterReferenceUrls ? this.characterReferenceUrls.slice(0, 2) : [];

    let imageUrl = scene.imageUrl;

    try {
      if (shouldRegenerateImage) {
        this.currentScreenplay = this.currentScreenplay.updateScene(
          sceneId,
          scene.copyWith({ status: SceneStatus.IMAGE_GENERATING })
        );

        onProgress?.call(0.1, forceRegenerateImage ? `场景 ${sceneNum} 正在重新生成图片...` : `场景 ${sceneNum} 正在生成图片...`);

        if (this.userOriginalImages && this.userOriginalImages.length > 0) {
          logger.info('图片生成', `场景 ${sceneNum} 使用用户原图进行图生图`);
          imageUrl = await this._generateImageWithReference(scene.imagePrompt, this.userOriginalImages);
        } else if (characterUrls.length > 0) {
          logger.info('图片生成', `场景 ${sceneNum} 使用角色三视图进行图生图`);
          imageUrl = await this._generateImageWithCharacterReference(scene.imagePrompt, characterUrls);
        } else {
          logger.warn('图片生成', `场景 ${sceneNum} 没有参考图，使用纯文本生成（人物可能不一致）`);
          imageUrl = await this._generateImage(scene.imagePrompt);
        }

        this.currentScreenplay = this.currentScreenplay.updateScene(
          sceneId,
          scene.copyWith({ imageUrl, status: SceneStatus.IMAGE_COMPLETED })
        );
        logger.success('图片生成', `场景 ${sceneNum} 图片生成完成`);
      } else {
        logger.info('场景重试', `场景 ${sceneNum} 图片已存在，跳过图片生成`);
      }

      onProgress?.call(shouldRegenerateImage ? 0.6 : 0.5, `场景 ${sceneNum} 正在生成视频...`);

      const updatedScene = this.currentScreenplay.scenes.find(s => s.sceneId === sceneId);
      this.currentScreenplay = this.currentScreenplay.updateScene(
        sceneId,
        updatedScene.copyWith({ status: SceneStatus.VIDEO_GENERATING })
      );

      const referenceUrls = [];
      referenceUrls.push(...characterUrls);
      if (imageUrl) {
        referenceUrls.push(imageUrl);
      }

      onProgress?.call(shouldRegenerateImage ? 0.55 : 0.45, `场景 ${sceneNum} 正在准备视频提示词...`);

      let scenePrompt;
      if (scene.customVideoPrompt && scene.customVideoPrompt.length > 0) {
        scenePrompt = scene.customVideoPrompt;
        if (scene.characterDescription) {
          scenePrompt = `Character reference: ${scene.characterDescription}. ${scenePrompt}`;
        }
        logger.info('场景重试', `使用用户自定义提示词: ${scenePrompt}`);
      } else {
        const rewrittenPrompt = await aiClient.rewriteVideoPromptForSafety(
          scene.videoPrompt,
          scene.narration
        );

        if (scene.characterDescription) {
          scenePrompt = `Character reference: ${scene.characterDescription}. Scene: ${rewrittenPrompt}`;
        } else {
          scenePrompt = rewrittenPrompt;
        }

        logger.info('场景重试', `原始提示词: ${scene.videoPrompt}`);
        logger.info('场景重试', `重写后提示词: ${rewrittenPrompt}`);
      }

      const videoResponse = await videoGenerator.generateVideo({
        imageUrls: referenceUrls,
        prompt: scenePrompt,
        seconds: '5',
        model: 'veo3.1-components'
      });

      const finalResponse = await videoGenerator.pollVideoStatus({
        taskId: videoResponse.id,
        timeout: 600000,
        interval: 2000,
        onProgress: (progress, status) => {
          const baseProgress = shouldRegenerateImage ? 0.6 : 0.5;
          const overallProgress = baseProgress + (progress / 100) * (1 - baseProgress);
          onProgress?.call(overallProgress, `场景 ${sceneNum} 视频生成中... ${progress}%`);
        }
      });

      const sceneWithVideo = this.currentScreenplay.scenes.find(s => s.sceneId === sceneId);
      this.currentScreenplay = this.currentScreenplay.updateScene(
        sceneId,
        sceneWithVideo.copyWith({ videoUrl: finalResponse.videoUrl, status: SceneStatus.COMPLETED })
      );
      logger.success('场景重试', `场景 ${sceneNum} 重试成功`);
      onProgress?.call(1.0, `场景 ${sceneNum} 重试完成`);
    } catch (error) {
      logger.error('场景重试', `场景 ${sceneNum} 重试失败: ${error.message}`);
      this.currentScreenplay = this.currentScreenplay.updateScene(
        sceneId,
        scene.copyWith({ status: SceneStatus.FAILED })
      );
      throw error;
    }
  }

  async startSceneGeneration(sceneId, { onProgress = null } = {}) {
    if (!this.currentScreenplay) {
      throw new Error('没有当前剧本');
    }

    const scene = this.currentScreenplay.scenes.find(s => s.sceneId === sceneId);
    if (!scene) {
      throw new Error(`场景 ${sceneId} 不存在`);
    }

    if (scene.status !== SceneStatus.PENDING) {
      logger.warn('手动生成', `场景 ${sceneId} 状态为 ${scene.statusDisplayName}，无法手动触发`);
      if (scene.status === SceneStatus.FAILED) {
        logger.info('手动生成', `场景 ${sceneId} 为失败状态，转为重试`);
        await this.retryScene(sceneId, { onProgress, forceRegenerateImage: true });
      }
      return;
    }

    const sceneNum = this.currentScreenplay.scenes.indexOf(scene) + 1;
    logger.info('手动生成', `🖐️ 手动触发场景 ${sceneNum} 生成`);

    await this.retryScene(sceneId, { onProgress, forceRegenerateImage: true });
  }

  async startAllPendingScenesGeneration({ onProgress = null } = {}) {
    if (!this.currentScreenplay) {
      throw new Error('没有当前剧本');
    }

    const pendingScenes = this.currentScreenplay.scenes.filter(s => s.status === SceneStatus.PENDING);

    if (pendingScenes.length === 0) {
      logger.info('手动生成', '没有待处理的场景');
      onProgress?.call(1.0, '所有场景已完成');
      return;
    }

    logger.info('手动生成', `🖐️ 开始手动生成 ${pendingScenes.length} 个场景（串行模式）`);

    let completed = 0;
    for (const scene of pendingScenes) {
      if (this.isCancelled) {
        logger.warn('手动生成', '用户取消操作');
        throw new Error('操作已取消');
      }

      const currentScene = this.currentScreenplay.scenes.find(s => s.sceneId === scene.sceneId);
      if (currentScene.status !== SceneStatus.PENDING) {
        logger.info('手动生成', `场景 ${scene.sceneId} 已被处理，跳过`);
        completed++;
        continue;
      }

      const sceneNum = this.currentScreenplay.scenes.indexOf(scene) + 1;
      const overallProgress = completed / pendingScenes.length;
      onProgress?.call(overallProgress, `正在生成场景 ${sceneNum}...`);

      try {
        await this.startSceneGeneration(
          scene.sceneId,
          {
            onProgress: (progress, status) => {
              const sceneProgress = completed / pendingScenes.length;
              const inSceneProgress = progress / pendingScenes.length;
              onProgress?.call(sceneProgress + inSceneProgress, status);
            }
          }
        );
        completed++;
      } catch (error) {
        logger.error('手动生成', `场景 ${sceneNum} 生成失败: ${error.message}`);
        completed++;
      }
    }

    onProgress?.call(1.0, '手动生成完成');
    logger.success('手动生成', `手动生成完成，共处理 ${completed} 个场景`);
  }

  updateSceneCustomPrompt(sceneId, customPrompt) {
    if (!this.currentScreenplay) {
      throw new Error('没有当前剧本');
    }

    const scene = this.currentScreenplay.scenes.find(s => s.sceneId === sceneId);
    if (!scene) {
      throw new Error(`场景 ${sceneId} 不存在`);
    }

    logger.info('场景更新', `场景 ${scene.sceneId} 设置自定义提示词: ${customPrompt}`);

    this.currentScreenplay = this.currentScreenplay.updateScene(
      sceneId,
      scene.copyWith({ customVideoPrompt: customPrompt })
    );
  }

  cancel() {
    logger.warn('剧本控制器', '用户请求取消操作');
    this.isCancelled = true;
  }

  async _analyzeUserImage(imageBase64) {
    try {
      logger.info('图片分析', '开始分析用户图片...');
      const analysis = await aiClient.analyzeImageForCharacter(imageBase64);
      logger.success('图片分析', '分析完成');
      return analysis;
    } catch (error) {
      logger.error('图片分析', '分析失败', error);
      return '';
    }
  }

  async _callGLMForScreenplay(userPrompt, characterAnalysis) {
    try {
      let enhancedPrompt = userPrompt;
      if (characterAnalysis && characterAnalysis.length > 0) {
        enhancedPrompt = `用户需求：${userPrompt}

用户提供的参考图片角色特征分析：
${characterAnalysis}

请根据上述角色特征分析结果，生成剧本中的 character_description 字段，确保生成的角色形象与用户提供的图片一致。`;
      }

      const messages = [
        { role: 'user', content: enhancedPrompt }
      ];

      logger.info('GLM-4.7', '发送剧本规划请求（使用文本模型）');

      const buffer = [];
      for await (const chunk of aiClient.sendToGLMStream(messages)) {
        if (this.isCancelled) {
          throw new Error('操作已取消');
        }
        if (chunk.isContent) {
          buffer.push(chunk.text);
        }
      }

      const response = buffer.join('');
      logger.success('GLM-4.7', `收到响应，长度: ${response.length}`);
      return response;
    } catch (error) {
      logger.error('GLM-4.7', '请求失败', error);
      throw new Error(`GLM 请求失败: ${error.message}`);
    }
  }

  _parseScreenplay(screenplayJson) {
    try {
      const data = JSON.parse(screenplayJson);
      return new Screenplay({
        taskId: data.task_id || uuidv4(),
        scriptTitle: data.script_title || data.scriptTitle || 'Untitled',
        scenes: (data.scenes || []).map((sceneData, index) => new Scene({
          sceneId: sceneData.scene_id || index + 1,
          narration: sceneData.narration || '',
          imagePrompt: sceneData.image_prompt || sceneData.imagePrompt || '',
          videoPrompt: sceneData.video_prompt || sceneData.videoPrompt || '',
          characterDescription: sceneData.character_description || sceneData.characterDescription || '',
          imageUrl: sceneData.image_url || sceneData.imageUrl || null,
          videoUrl: sceneData.video_url || sceneData.videoUrl || null
        }))
      });
    } catch (error) {
      logger.error('剧本解析', `解析失败: ${error.message}`);
      throw new Error(`剧本解析失败: ${error.message}`);
    }
  }

  async _generateAllImages(screenplay, onProgress) {
    const scenes = screenplay.scenes;
    let completed = 0;

    const characterDescription = scenes.length > 0 ? scenes[0].characterDescription : '';

    if (characterDescription) {
      logger.info('人物一致性', `人物描述: ${characterDescription}`);
    }

    const hasCharacterRefs = this.characterReferenceUrls && this.characterReferenceUrls.length > 0;
    if (hasCharacterRefs) {
      logger.info('人物一致性', `使用角色三视图: ${this.characterReferenceUrls.length} 张`);
    }

    for (let i = 0; i < scenes.length; i++) {
      if (this.isCancelled) {
        logger.warn('图片生成', '用户取消操作');
        throw new Error('操作已取消');
      }

      const scene = scenes[i];

      if (scene.imageUrl) {
        completed++;
        continue;
      }

      this.currentScreenplay = this.currentScreenplay.updateScene(
        scene.sceneId,
        scene.copyWith({ status: SceneStatus.IMAGE_GENERATING })
      );

      onProgress(
        completed / scenes.length,
        `正在生成场景 ${i + 1}/${scenes.length} 的图片...`
      );

      try {
        let imageUrl;

        if (i === 0 && this.userOriginalImages && this.userOriginalImages.length > 0) {
          logger.info('图片生成', '场景 1 使用用户原图进行图生图');
          imageUrl = await this._generateImageWithReference(scene.imagePrompt, this.userOriginalImages);
        } else if (i > 0 && hasCharacterRefs) {
          logger.info('图片生成', `场景 ${i + 1} 使用角色三视图进行图生图`);
          imageUrl = await this._generateImageWithCharacterReference(scene.imagePrompt, this.characterReferenceUrls);
        } else {
          let enhancedPrompt = scene.imagePrompt;
          if (i > 0 && characterDescription) {
            enhancedPrompt = `Character reference: ${characterDescription}. Scene: ${scene.imagePrompt}`;
            logger.info('图片生成', `场景 ${i + 1} 使用文本描述（无三视图）`);
          }
          imageUrl = await this._generateImage(enhancedPrompt);
        }

        const updatedScene = scene.copyWith({
          imageUrl,
          status: SceneStatus.IMAGE_COMPLETED
        });
        this.currentScreenplay = this.currentScreenplay.updateScene(scene.sceneId, updatedScene);

        completed++;
        logger.success('图片生成', `场景 ${scene.sceneId} 图片生成完成: ${imageUrl}`);
      } catch (error) {
        logger.error('图片生成', `场景 ${scene.sceneId} 图片生成失败: ${error.message}`);
        const failedScene = scene.copyWith({ status: SceneStatus.FAILED });
        this.currentScreenplay = this.currentScreenplay.updateScene(scene.sceneId, failedScene);
        completed++;
      }
    }

    onProgress(1.0, '图片生成完成');
  }

  async _generateAllVideos(screenplay, onProgress) {
    const currentScenes = this.currentScreenplay.scenes;
    const scenesWithImages = currentScenes.filter(s => s.imageUrl);

    if (scenesWithImages.length === 0) {
      logger.warn('视频生成', '没有可用的分镜图片');
      throw new Error('没有可用的分镜图片来生成视频');
    }

    logger.info('视频生成', `准备为 ${scenesWithImages.length} 个场景生成视频`);

    const characterUrls = this.characterReferenceUrls ? this.characterReferenceUrls.slice(0, 2) : [];
    logger.info('视频生成', `使用角色三视图: ${characterUrls.length} 张`);

    const sceneVideoUrls = [];

    for (let i = 0; i < scenesWithImages.length; i++) {
      if (this.isCancelled) {
        throw new Error('操作已取消');
      }

      const scene = scenesWithImages[i];
      const sceneProgress = i / scenesWithImages.length;
      onProgress(sceneProgress, `正在生成场景 ${i + 1}/${scenesWithImages.length} 的视频...`);

      this.currentScreenplay = this.currentScreenplay.updateScene(
        scene.sceneId,
        scene.copyWith({ status: SceneStatus.VIDEO_GENERATING })
      );

      try {
        const referenceUrls = [];
        referenceUrls.push(...characterUrls);
        referenceUrls.push(scene.imageUrl);

        logger.info('视频生成', `场景 ${i + 1} 参考图: ${referenceUrls.length} 张 (角色: ${characterUrls.length}, 分镜: 1)`);

        const characterDescription = scene.characterDescription;
        let scenePrompt = scene.videoPrompt;
        if (characterDescription) {
          scenePrompt = `Character reference: ${characterDescription}. Scene: ${scene.videoPrompt}`;
        }

        const videoResponse = await videoGenerator.generateVideo({
          imageUrls: referenceUrls,
          prompt: scenePrompt,
          seconds: '5',
          model: 'veo3.1-components',
          sanitizePrompt: true
        });

        let finalResponse;
        if (videoResponse.isCompleted) {
          finalResponse = videoResponse;
        } else {
          finalResponse = await videoGenerator.pollVideoStatus({
            taskId: videoResponse.id,
            timeout: 300000,
            interval: 2000,
            onProgress: (progress, status) => {
              const overallProgress = (i + progress / 100) / scenesWithImages.length;
              onProgress(overallProgress, `场景 ${i + 1} 视频生成中... ${progress}%`);
            },
            isCancelled: () => this.isCancelled
          });
        }

        const updatedScene = scene.copyWith({
          videoUrl: finalResponse.videoUrl,
          status: SceneStatus.COMPLETED
        });
        this.currentScreenplay = this.currentScreenplay.updateScene(scene.sceneId, updatedScene);

        if (finalResponse.videoUrl) {
          sceneVideoUrls.push(finalResponse.videoUrl);
        }

        logger.success('视频生成', `场景 ${scene.sceneId} 视频生成完成: ${finalResponse.videoUrl}`);
      } catch (error) {
        logger.error('视频生成', `场景 ${scene.sceneId} 视频生成失败: ${error.message}`);
        const failedScene = scene.copyWith({ status: SceneStatus.FAILED });
        this.currentScreenplay = this.currentScreenplay.updateScene(scene.sceneId, failedScene);
      }
    }

    if (this.isCancelled) {
      throw new Error('操作已取消');
    }

    logger.success('视频生成', `所有场景视频生成完成: ${sceneVideoUrls.length}/${scenesWithImages.length} 成功`);
    onProgress(1.0, '所有场景视频生成完成！');

    if (sceneVideoUrls.length > 1) {
      logger.info('视频生成', `共有 ${sceneVideoUrls.length} 个分镜视频，可进行合并`);
    }
  }

  async _generateImage(prompt) {
    logger.warn('图片生成', '_generateImage 方法需要实现');
    return 'https://example.com/mock-image.jpg';
  }

  async _generateImageWithReference(prompt, referenceImages) {
    logger.warn('图片生成', '_generateImageWithReference 方法需要实现');
    return 'https://example.com/mock-image.jpg';
  }

  async _generateImageWithCharacterReference(prompt, characterImageUrls) {
    logger.warn('图片生成', '_generateImageWithCharacterReference 方法需要实现');
    return 'https://example.com/mock-image.jpg';
  }

  _emitProgress(progress, status, callback) {
    if (callback) {
      callback(progress, status);
    }
    this.progressCallbacks.forEach(cb => cb(new ScreenplayProgress({ progress, status })));
  }
}

const screenplayService = new ScreenplayService();

export { ScreenplayService, Screenplay, Scene, SceneStatus, ScreenplayStatus, ScreenplayProgress };
export default screenplayService;
