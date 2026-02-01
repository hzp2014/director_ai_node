export const StyleType = {
  CINEMATIC: '电影感',
  ANIME: '动漫风',
  COMIC: '漫画风',
  REALISTIC: '写实风',
  WATERCOLOR: '水彩画'
};

export const AspectRatio = {
  RATIO_16_9: '16:9',
  RATIO_9_16: '9:16',
  RATIO_4_3: '4:3',
  RATIO_1_1: '1:1'
};

export const ShotTemplateType = {
  WIDE: '全景',
  MEDIUM: '中景',
  CLOSEUP: '特写',
  OVER_SHOULDER: '过肩',
  LOW_ANGLE: '低角度',
  FOLLOWING: '跟随'
};

export const ExportFormat = {
  JSON: 'json',
  ZIP: 'zip',
  TXT: 'txt',
  FULL: 'full'
};

export class BaseResponse {
  constructor(success, message) {
    this.success = success;
    this.message = message;
  }
}

export class DataResponse extends BaseResponse {
  constructor(success, message, data = null) {
    super(success, message);
    this.data = data;
  }
}

export class ProjectCreate {
  constructor(name, aspect_ratio = AspectRatio.RATIO_16_9) {
    this.name = name;
    this.aspect_ratio = aspect_ratio;
  }

  validate() {
    if (!this.name || this.name.length < 1 || this.name.length > 100) {
      return { valid: false, error: '项目名称长度必须在1-100字符之间' };
    }
    return { valid: true };
  }
}

export class CharacterCreate {
  constructor(name, description = '', ref_images = []) {
    this.name = name;
    this.description = description;
    this.ref_images = ref_images;
  }

  validate() {
    if (!this.name || this.name.length < 1 || this.name.length > 50) {
      return { valid: false, error: '角色名称长度必须在1-50字符之间' };
    }
    if (this.description && this.description.length > 500) {
      return { valid: false, error: '角色描述长度不能超过500字符' };
    }
    return { valid: true };
  }
}

export class SceneCreate {
  constructor(name, description = '', ref_image = '') {
    this.name = name;
    this.description = description;
    this.ref_image = ref_image;
  }

  validate() {
    if (!this.name || this.name.length < 1 || this.name.length > 50) {
      return { valid: false, error: '场景名称长度必须在1-50字符之间' };
    }
    if (this.description && this.description.length > 500) {
      return { valid: false, error: '场景描述长度不能超过500字符' };
    }
    return { valid: true };
  }
}

export class ShotCreate {
  constructor(template, description, character_ids = [], scene_id = '') {
    this.template = template || ShotTemplateType.MEDIUM;
    this.description = description;
    this.character_ids = character_ids;
    this.scene_id = scene_id;
  }

  validate() {
    if (!this.description || this.description.length < 1 || this.description.length > 500) {
      return { valid: false, error: '镜头描述长度必须在1-500字符之间' };
    }
    return { valid: true };
  }
}

export class GenerateShotRequest {
  constructor(shot_number, custom_prompt = '') {
    this.shot_number = shot_number;
    this.custom_prompt = custom_prompt;
  }

  validate() {
    if (!this.shot_number || this.shot_number < 1) {
      return { valid: false, error: '镜头编号必须大于0' };
    }
    return { valid: true };
  }
}

export class SmartImportRequest {
  constructor(filepath, use_claude = true) {
    this.filepath = filepath;
    this.use_claude = use_claude;
  }
}

export class ExportRequest {
  constructor(format = ExportFormat.JSON) {
    this.format = format;
  }
}

export class ApplyImportRequest {
  constructor(json_content) {
    this.json_content = json_content;
  }
}

export class LoadExampleRequest {
  constructor(story_name) {
    this.story_name = story_name;
  }
}
