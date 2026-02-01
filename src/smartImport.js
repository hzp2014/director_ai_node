import path from 'path';
import fs from 'fs/promises';

export class FileParser {
  /**
   * 解析纯文本文件
   */
  static async parseText(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return content;
    } catch (error) {
      if (error.code === 'EILSEQ') {
        try {
          const content = await fs.readFile(filepath, 'binary');
          return content.toString('gbk');
        } catch (error2) {
          return `[错误] 文本解析失败: ${error2.message}`;
        }
      }
      return `[错误] 文本解析失败: ${error.message}`;
    }
  }

  /**
   * 解析Markdown文件
   */
  static async parseMarkdown(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      return content;
    } catch (error) {
      return `[错误] Markdown解析失败: ${error.message}`;
    }
  }

  /**
   * 解析HTML文件
   */
  static async parseHtml(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      const text = content
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      return lines.join('\n');
    } catch (error) {
      return `[错误] HTML解析失败: ${error.message}`;
    }
  }

  /**
   * 解析图片文件（返回描述占位符）
   */
  static async parseImage(filepath) {
    try {
      const stats = await fs.stat(filepath);
      const filename = path.basename(filepath);
      
      return `[图片文件]
文件名: ${filename}
文件大小: ${stats.size} bytes

请根据图片内容描述场景或角色。
图片路径: ${filepath}`;
    } catch (error) {
      return `[错误] 图片解析失败: ${error.message}`;
    }
  }

  /**
   * 解析JSON文件
   */
  static async parseJson(filepath) {
    try {
      const content = await fs.readFile(filepath, 'utf-8');
      JSON.parse(content);
      return content;
    } catch (error) {
      return `[错误] JSON解析失败: ${error.message}`;
    }
  }

  /**
   * 根据文件类型自动选择解析器
   */
  static async parseFile(filepath) {
    const ext = path.extname(filepath).toLowerCase();
    const filename = path.basename(filepath);
    
    const parsers = {
      '.txt': { type: '文本', parser: FileParser.parseText },
      '.md': { type: 'Markdown', parser: FileParser.parseMarkdown },
      '.markdown': { type: 'Markdown', parser: FileParser.parseMarkdown },
      '.html': { type: 'HTML', parser: FileParser.parseHtml },
      '.htm': { type: 'HTML', parser: FileParser.parseHtml },
      '.jpg': { type: '图片', parser: FileParser.parseImage },
      '.jpeg': { type: '图片', parser: FileParser.parseImage },
      '.png': { type: '图片', parser: FileParser.parseImage },
      '.gif': { type: '图片', parser: FileParser.parseImage },
      '.json': { type: 'JSON', parser: FileParser.parseJson }
    };
    
    if (ext in parsers) {
      const { type, parser } = parsers[ext];
      const content = await parser(filepath);
      return { type, content };
    }
    
    return {
      type: '未知',
      content: `[错误] 不支持的文件格式: ${ext}`
    };
  }
}

export class DefaultAnalyzer {
  /**
   * 生成默认分析模板
   */
  static generateDefaultAnalysis(content, fileType) {
    const lines = content.split('\n');
    const title = lines[0]?.substring(0, 50) || '未命名项目';
    
    const defaultJson = {
      project_name: title,
      description: `从${fileType}文件导入的项目`,
      aspect_ratio: '16:9',
      style: '电影感',
      characters: [
        {
          name: '角色1',
          description: '请填写角色描述'
        },
        {
          name: '角色2',
          description: '请填写角色描述'
        }
      ],
      scenes: [
        {
          name: '场景1',
          description: '请填写场景描述'
        }
      ],
      shots: [
        {
          template: '全景',
          description: '开场镜头 - 请编辑描述',
          characters: [],
          scene: '场景1'
        },
        {
          template: '中景',
          description: '主要镜头 - 请编辑描述',
          characters: ['角色1'],
          scene: '场景1'
        }
      ]
    };
    
    return JSON.stringify(defaultJson, null, 2);
  }
}

export class SmartImporter {
  constructor() {
    this.parser = new FileParser();
    this.analyzer = new DefaultAnalyzer();
  }

  /**
   * 导入文件并分析
   */
  async importFile(filepath, useClaude = false) {
    const result = {
      success: false,
      file_type: '',
      raw_content: '',
      analyzed_json: '',
      message: ''
    };
    
    try {
      await fs.access(filepath);
    } catch (error) {
      result.message = `文件不存在: ${filepath}`;
      return result;
    }
    
    const { type, content } = await FileParser.parseFile(filepath);
    result.file_type = type;
    result.raw_content = content;
    
    if (content.startsWith('[错误]')) {
      result.message = content;
      return result;
    }
    
    try {
      if (type === 'JSON') {
        result.analyzed_json = content;
        result.success = true;
        result.message = `成功导入${type}文件`;
      } else {
        const analyzedJson = DefaultAnalyzer.generateDefaultAnalysis(content, type);
        result.analyzed_json = analyzedJson;
        result.success = true;
        result.message = `已从${type}文件生成默认模板`;
      }
    } catch (error) {
      result.success = false;
      result.message = `分析失败: ${error.message}`;
    }
    
    return result;
  }

  /**
   * 导入多个文件并合并分析
   */
  async importMultipleFiles(filepaths) {
    const allContent = [];
    const fileTypes = [];
    const failedFiles = [];
    
    for (const filepath of filepaths) {
      try {
        await fs.access(filepath);
        const { type, content } = await FileParser.parseFile(filepath);
        
        if (!content.startsWith('[错误]')) {
          const filename = path.basename(filepath);
          allContent.push(`=== ${filename} (${type}) ===\n${content}`);
          fileTypes.push(type);
        } else {
          failedFiles.push(`${path.basename(filepath)}: ${content}`);
        }
      } catch (error) {
        failedFiles.push(`${path.basename(filepath)}: ${error.message}`);
      }
    }
    
    const result = {
      success: false,
      file_types: fileTypes,
      raw_content: '',
      analyzed_json: '',
      message: '',
      failed_files: failedFiles
    };
    
    if (allContent.length === 0) {
      result.message = '没有成功解析任何文件';
      return result;
    }
    
    result.raw_content = allContent.join('\n\n');
    const combinedType = [...new Set(fileTypes)].join('+');
    result.analyzed_json = DefaultAnalyzer.generateDefaultAnalysis(
      result.raw_content,
      combinedType
    );
    result.success = true;
    result.message = `成功分析${allContent.length}个文件`;
    
    return result;
  }
}

export function validateAndFixJson(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    
    const requiredFields = ['project_name', 'characters', 'scenes', 'shots'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        if (['characters', 'scenes', 'shots'].includes(field)) {
          data[field] = [];
        } else {
          data[field] = '未命名';
        }
      }
    }
    
    data.description = data.description || '';
    data.aspect_ratio = data.aspect_ratio || '16:9';
    data.style = data.style || '电影感';
    
    return {
      valid: true,
      fixedJson: JSON.stringify(data, null, 2),
      error: ''
    };
  } catch (error) {
    return {
      valid: false,
      fixedJson: jsonStr,
      error: `JSON格式错误: ${error.message}`
    };
  }
}
