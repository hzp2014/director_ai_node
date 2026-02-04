/**
 * 剧本解析服务
 * 解析AI生成的剧本JSON
 */

import type { ScreenplayDraft, SceneDraft, CharacterInfo } from '@/types'

export class ScreenplayParser {
  /**
   * 解析剧本JSON
   */
  static parseScreenplayDraft(jsonString: string): ScreenplayDraft | null {
    try {
      // 尝试直接解析
      const parsed = JSON.parse(jsonString)
      return this.validateScreenplayDraft(parsed)
    } catch (error) {
      // 如果直接解析失败，尝试提取JSON
      return this.extractAndParseJson(jsonString)
    }
  }

  /**
   * 从文本中提取并解析JSON
   */
  private static extractAndParseJson(text: string): ScreenplayDraft | null {
    // 尝试找到JSON代码块
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      try {
        const parsed = JSON.parse(jsonBlockMatch[1]);
        return this.validateScreenplayDraft(parsed);
      } catch (e) {
        // 继续尝试其他方法
      }
    }

    // 尝试找到花括号包围的JSON
    const jsonObjectMatch = text.match(/\{[\s\S]*\}/);
    if (jsonObjectMatch) {
      try {
        const parsed = JSON.parse(jsonObjectMatch[0]);
        return this.validateScreenplayDraft(parsed);
      } catch (e) {
        // 继续尝试其他方法
      }
    }

    return null;
  }

  /**
   * 验证剧本草稿结构
   */
  private static validateScreenplayDraft(data: any): ScreenplayDraft | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const required = ['title', 'genre', 'episodes', 'characters', 'scenes'];
    for (const field of required) {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`);
        return null;
      }
    }

    // 验证并转换类型
    const draft: ScreenplayDraft = {
      id: `draft-${Date.now()}`,
      title: String(data.title),
      genre: String(data.genre),
      episodes: Number(data.episodes),
      characters: this.validateCharacters(data.characters),
      scenes: this.validateScenes(data.scenes),
      status: 'pending_review' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return draft;
  }

  /**
   * 验证角色数据
   */
  private static validateCharacters(characters: any[]): CharacterInfo[] {
    if (!Array.isArray(characters)) {
      return [];
    }

    return characters
      .filter(c => c && typeof c === 'object')
      .map(c => ({
        name: String(c.name || ''),
        description: String(c.description || ''),
        appearance: String(c.appearance || ''),
        personality: String(c.personality || ''),
      }))
      .filter(c => c.name.length > 0);
  }

  /**
   * 验证场景数据
   */
  private static validateScenes(scenes: any[]): SceneDraft[] {
    if (!Array.isArray(scenes)) {
      return [];
    }

    return scenes
      .filter(s => s && typeof s === 'object')
      .map((s, index) => ({
        id: `scene-${Date.now()}-${index}`,
        episodeNumber: Number(s.episodeNumber || 1),
        sceneNumber: Number(s.sceneNumber || index + 1),
        location: String(s.location || ''),
        description: String(s.description || ''),
        dialogue: this.validateDialogue(s.dialogue || []),
        action: String(s.action || ''),
        duration: Number(s.duration || 30),
      }))
      .filter(s => s.location.length > 0);
  }

  /**
   * 验证对话数据
   */
  private static validateDialogue(dialogue: any[]): Array<{
    character: string
    text: string
    emotion?: string
    action?: string
  }> {
    if (!Array.isArray(dialogue)) {
      return [];
    }

    return dialogue
      .filter(d => d && typeof d === 'object')
      .map(d => ({
        character: String(d.character || ''),
        text: String(d.text || ''),
        emotion: d.emotion ? String(d.emotion) : undefined,
        action: d.action ? String(d.action) : undefined,
      }))
      .filter(d => d.character.length > 0 && d.text.length > 0);
  }

  /**
   * 格式化剧本为可读文本
   */
  static formatScreenplayAsText(draft: ScreenplayDraft): string {
    let text = `# ${draft.title}\n\n`;
    text += `**类型**: ${draft.genre}\n`;
    text += `**集数**: ${draft.episodes}\n\n`;

    text += `## 角色\n\n`;
    for (const char of draft.characters) {
      text += `### ${char.name}\n`;
      text += `- 描述: ${char.description}\n`;
      text += `- 外貌: ${char.appearance}\n`;
      text += `- 性格: ${char.personality}\n\n`;
    }

    text += `## 场景\n\n`;
    for (const scene of draft.scenes) {
      text += `### 第${scene.episodeNumber}集 - 场景${scene.sceneNumber}\n`;
      text += `**地点**: ${scene.location}\n`;
      text += `**描述**: ${scene.description}\n`;
      text += `**动作**: ${scene.action}\n`;
      text += `**时长**: ${scene.duration}秒\n\n`;

      if (scene.dialogue.length > 0) {
        text += `**对话**:\n`;
        for (const line of scene.dialogue) {
          text += `- **${line.character}**: ${line.text}`;
          if (line.emotion) text += ` (${line.emotion})`;
          if (line.action) text += ` [${line.action}]`;
          text += `\n`;
        }
        text += `\n`;
      }
    }

    return text;
  }
}
