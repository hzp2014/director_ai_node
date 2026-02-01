import { v4 as uuidv4 } from 'uuid';

export const AssetGenerationStatus = {
  PENDING: 'pending',
  GENERATING: 'generating',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REVIEW_PENDING: 'review_pending'
};

export const GeneratedAssetType = {
  CHARACTER: 'character',
  SCENE: 'scene',
  PROP: 'prop'
};

export const ShotTemplate = {
  T1_ESTABLISHING_WIDE: 'T1_establishing_wide',
  T2_ENVIRONMENT_MEDIUM: 'T2_environment_medium',
  T3_FRAMED_SHOT: 'T3_framed_shot',
  T4_STANDARD_MEDIUM: 'T4_standard_medium',
  T5_OVER_SHOULDER: 'T5_over_shoulder',
  T6_CLOSEUP: 'T6_closeup',
  T7_LOW_ANGLE: 'T7_low_angle',
  T8_FOLLOWING: 'T8_following',
  T9_POV: 'T9_pov'
};

export const StyleMode = {
  PRESET: 'preset',
  REFERENCE_IMAGE: 'reference_image',
  CUSTOM_TEXT: 'custom_text'
};

export class CameraSettings {
  constructor({
    distance = 'medium',
    vertical_angle = 0,
    horizontal_angle = 0,
    focal_length = 50
  } = {}) {
    this.distance = distance;
    this.vertical_angle = vertical_angle;
    this.horizontal_angle = horizontal_angle;
    this.focal_length = focal_length;
  }

  toDict() {
    return {
      distance: this.distance,
      vertical_angle: this.vertical_angle,
      horizontal_angle: this.horizontal_angle,
      focal_length: this.focal_length
    };
  }

  static fromDict(data) {
    return new CameraSettings(data);
  }
}

export class CompositionSettings {
  constructor({
    subject_scale = 0.5,
    horizon_position = 'middle',
    depth_layers = 2,
    rule_of_thirds = true,
    subject_position = 'center',
    foreground_blur = false,
    background_blur = false
  } = {}) {
    this.subject_scale = subject_scale;
    this.horizon_position = horizon_position;
    this.depth_layers = depth_layers;
    this.rule_of_thirds = rule_of_thirds;
    this.subject_position = subject_position;
    this.foreground_blur = foreground_blur;
    this.background_blur = background_blur;
  }

  toDict() {
    return {
      subject_scale: this.subject_scale,
      horizon_position: this.horizon_position,
      depth_layers: this.depth_layers,
      rule_of_thirds: this.rule_of_thirds,
      subject_position: this.subject_position,
      foreground_blur: this.foreground_blur,
      background_blur: this.background_blur
    };
  }

  static fromDict(data) {
    return new CompositionSettings(data);
  }
}

export class SlotWeights {
  constructor({
    character = 0.8,
    scene = 0.6,
    props = 0.5,
    style = 0.4
  } = {}) {
    this.character = character;
    this.scene = scene;
    this.props = props;
    this.style = style;
  }

  normalize(max_total = 2.5) {
    const total = this.character + this.scene + this.props + this.style;
    if (total > max_total) {
      const scale = max_total / total;
      return new SlotWeights({
        character: this.character * scale,
        scene: this.scene * scale,
        props: this.props * scale,
        style: this.style * scale
      });
    }
    return this;
  }

  toDict() {
    return {
      character: this.character,
      scene: this.scene,
      props: this.props,
      style: this.style
    };
  }

  static fromDict(data) {
    return new SlotWeights(data);
  }
}

export class CharacterAppearance {
  constructor({
    gender = '',
    age = '',
    ethnicity = '',
    skin_tone = '',
    height = '',
    body_type = '',
    face_shape = '',
    eye_color = '',
    eye_shape = '',
    nose = '',
    lips = '',
    hair_color = '',
    hair_style = '',
    hair_texture = '',
    facial_hair = '',
    glasses = '',
    scars = '',
    tattoos = '',
    other_features = ''
  } = {}) {
    this.gender = gender;
    this.age = age;
    this.ethnicity = ethnicity;
    this.skin_tone = skin_tone;
    this.height = height;
    this.body_type = body_type;
    this.face_shape = face_shape;
    this.eye_color = eye_color;
    this.eye_shape = eye_shape;
    this.nose = nose;
    this.lips = lips;
    this.hair_color = hair_color;
    this.hair_style = hair_style;
    this.hair_texture = hair_texture;
    this.facial_hair = facial_hair;
    this.glasses = glasses;
    this.scars = scars;
    this.tattoos = tattoos;
    this.other_features = other_features;
  }

  toDict() {
    return {
      gender: this.gender,
      age: this.age,
      ethnicity: this.ethnicity,
      skin_tone: this.skin_tone,
      height: this.height,
      body_type: this.body_type,
      face_shape: this.face_shape,
      eye_color: this.eye_color,
      eye_shape: this.eye_shape,
      nose: this.nose,
      lips: this.lips,
      hair_color: this.hair_color,
      hair_style: this.hair_style,
      hair_texture: this.hair_texture,
      facial_hair: this.facial_hair,
      glasses: this.glasses,
      scars: this.scars,
      tattoos: this.tattoos,
      other_features: this.other_features
    };
  }

  static fromDict(data) {
    return new CharacterAppearance(data);
  }

  toPromptString() {
    const parts = [];

    const ageMap = {
      'child': 'young child',
      'teen': 'teenager',
      'young_adult': 'young adult in their 20s',
      'adult': 'adult in their 30s',
      'middle_aged': 'middle-aged person in their 40s-50s',
      'elderly': 'elderly person'
    };

    if (this.gender) parts.push(this.gender);
    if (this.age) parts.push(ageMap[this.age] || this.age);
    if (this.ethnicity) parts.push(`${this.ethnicity} ethnicity`);
    if (this.skin_tone) parts.push(`${this.skin_tone} skin`);
    if (this.height) parts.push(`${this.height} height`);
    if (this.body_type) parts.push(`${this.body_type} build`);
    if (this.face_shape) parts.push(`${this.face_shape} face`);
    if (this.eye_color) parts.push(`${this.eye_color} eyes`);
    if (this.eye_shape) parts.push(`${this.eye_shape} eye shape`);
    if (this.hair_color && this.hair_style) {
      parts.push(`${this.hair_color} ${this.hair_style} hair`);
    } else if (this.hair_color) {
      parts.push(`${this.hair_color} hair`);
    } else if (this.hair_style) {
      parts.push(`${this.hair_style} hair`);
    }
    if (this.hair_texture) parts.push(`${this.hair_texture} hair texture`);
    if (this.facial_hair && this.facial_hair !== 'none') {
      parts.push(`with ${this.facial_hair}`);
    }
    if (this.glasses && this.glasses !== 'none') {
      parts.push(`wearing ${this.glasses} glasses`);
    }
    if (this.scars) parts.push(`scar: ${this.scars}`);
    if (this.tattoos) parts.push(`tattoo: ${this.tattoos}`);
    if (this.other_features) parts.push(this.other_features);

    return parts.join(', ');
  }
}

export class CharacterOutfit {
  constructor({
    top = '',
    top_color = '',
    bottom = '',
    bottom_color = '',
    outerwear = '',
    outerwear_color = '',
    footwear = '',
    accessories = '',
    style_keywords = ''
  } = {}) {
    this.top = top;
    this.top_color = top_color;
    this.bottom = bottom;
    this.bottom_color = bottom_color;
    this.outerwear = outerwear;
    this.outerwear_color = outerwear_color;
    this.footwear = footwear;
    this.accessories = accessories;
    this.style_keywords = style_keywords;
  }

  toDict() {
    return {
      top: this.top,
      top_color: this.top_color,
      bottom: this.bottom,
      bottom_color: this.bottom_color,
      outerwear: this.outerwear,
      outerwear_color: this.outerwear_color,
      footwear: this.footwear,
      accessories: this.accessories,
      style_keywords: this.style_keywords
    };
  }

  static fromDict(data) {
    return new CharacterOutfit(data);
  }

  toPromptString() {
    const parts = [];

    if (this.style_keywords) parts.push(`${this.style_keywords} style`);
    if (this.top) {
      const topDesc = this.top_color ? `${this.top_color} ${this.top}`.trim() : this.top;
      parts.push(`wearing ${topDesc}`);
    }
    if (this.bottom) {
      const bottomDesc = this.bottom_color ? `${this.bottom_color} ${this.bottom}`.trim() : this.bottom;
      parts.push(bottomDesc);
    }
    if (this.outerwear) {
      const outerDesc = this.outerwear_color ? `${this.outerwear_color} ${this.outerwear}`.trim() : this.outerwear;
      parts.push(outerDesc);
    }
    if (this.footwear) parts.push(this.footwear);
    if (this.accessories) parts.push(`accessories: ${this.accessories}`);

    return parts.join(', ');
  }
}

export class Character {
  constructor({
    id = null,
    name = '',
    ref_images = [],
    features_locked = ['face', 'body_type', 'hair'],
    costume_locked = false,
    consistency_weight = 0.8,
    description = '',
    appearance = null,
    outfit = null
  } = {}) {
    this.id = id || `char_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
    this.name = name;
    this.ref_images = ref_images;
    this.features_locked = features_locked;
    this.costume_locked = costume_locked;
    this.consistency_weight = consistency_weight;
    this.description = description;
    this.appearance = appearance || new CharacterAppearance();
    this.outfit = outfit || new CharacterOutfit();
  }

  toDict() {
    return {
      id: this.id,
      name: this.name,
      ref_images: this.ref_images,
      features_locked: this.features_locked,
      costume_locked: this.costume_locked,
      consistency_weight: this.consistency_weight,
      description: this.description,
      appearance: this.appearance.toDict(),
      outfit: this.outfit.toDict()
    };
  }

  static fromDict(data) {
    const { appearance, outfit, ...rest } = data;
    const character = new Character(rest);
    if (appearance) character.appearance = CharacterAppearance.fromDict(appearance);
    if (outfit) character.outfit = CharacterOutfit.fromDict(outfit);
    return character;
  }

  getConsistencyPrompt() {
    const parts = [`[${this.name}:`];

    const appearanceStr = this.appearance.toPromptString();
    if (appearanceStr) parts.push(appearanceStr);

    if (this.costume_locked) {
      const outfitStr = this.outfit.toPromptString();
      if (outfitStr) parts.push(outfitStr);
    }

    if (!appearanceStr && this.description) {
      parts.push(this.description);
    }

    parts.push(']');
    return parts.join(' ');
  }
}

export class Scene {
  constructor({
    id = null,
    name = '',
    space_ref_image = '',
    atmosphere_ref_image = '',
    description = '',
    locked_features = ['space_structure'],
    light_direction = '',
    color_temperature = '',
    consistency_weight = 0.6
  } = {}) {
    this.id = id || `scene_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
    this.name = name;
    this.space_ref_image = space_ref_image;
    this.atmosphere_ref_image = atmosphere_ref_image;
    this.description = description;
    this.locked_features = locked_features;
    this.light_direction = light_direction;
    this.color_temperature = color_temperature;
    this.consistency_weight = consistency_weight;
  }

  toDict() {
    return {
      id: this.id,
      name: this.name,
      space_ref_image: this.space_ref_image,
      atmosphere_ref_image: this.atmosphere_ref_image,
      description: this.description,
      locked_features: this.locked_features,
      light_direction: this.light_direction,
      color_temperature: this.color_temperature,
      consistency_weight: this.consistency_weight
    };
  }

  static fromDict(data) {
    return new Scene(data);
  }
}

export class Prop {
  constructor({
    id = null,
    name = '',
    ref_image = '',
    size_reference = '',
    material = '',
    consistency_weight = 0.7
  } = {}) {
    this.id = id || `prop_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
    this.name = name;
    this.ref_image = ref_image;
    this.size_reference = size_reference;
    this.material = material;
    this.consistency_weight = consistency_weight;
  }

  toDict() {
    return {
      id: this.id,
      name: this.name,
      ref_image: this.ref_image,
      size_reference: this.size_reference,
      material: this.material,
      consistency_weight: this.consistency_weight
    };
  }

  static fromDict(data) {
    return new Prop(data);
  }
}

export class StyleConfig {
  constructor({
    mode = StyleMode.PRESET,
    preset_name = '',
    ref_image = '',
    custom_description = '',
    render_type = 'realistic',
    color_tone = 'neutral',
    lighting_style = 'natural',
    texture = 'digital_clean',
    weight = 0.4
  } = {}) {
    this.mode = mode;
    this.preset_name = preset_name;
    this.ref_image = ref_image;
    this.custom_description = custom_description;
    this.render_type = render_type;
    this.color_tone = color_tone;
    this.lighting_style = lighting_style;
    this.texture = texture;
    this.weight = weight;
  }

  toDict() {
    return {
      mode: this.mode,
      preset_name: this.preset_name,
      ref_image: this.ref_image,
      custom_description: this.custom_description,
      render_type: this.render_type,
      color_tone: this.color_tone,
      lighting_style: this.lighting_style,
      texture: this.texture,
      weight: this.weight
    };
  }

  static fromDict(data) {
    return new StyleConfig({
      ...data,
      mode: data.mode || StyleMode.PRESET
    });
  }
}

export class StandardShotPrompt {
  constructor({
    subject = '',
    shot_type = '',
    atmosphere = '',
    environment = '',
    camera_movement = '',
    angle = '',
    special_technique = '',
    composition = '',
    style_consistency = '',
    dynamic_control = ''
  } = {}) {
    this.subject = subject;
    this.shot_type = shot_type;
    this.atmosphere = atmosphere;
    this.environment = environment;
    this.camera_movement = camera_movement;
    this.angle = angle;
    this.special_technique = special_technique;
    this.composition = composition;
    this.style_consistency = style_consistency;
    this.dynamic_control = dynamic_control;
  }

  toDict() {
    return {
      subject: this.subject,
      shot_type: this.shot_type,
      atmosphere: this.atmosphere,
      environment: this.environment,
      camera_movement: this.camera_movement,
      angle: this.angle,
      special_technique: this.special_technique,
      composition: this.composition,
      style_consistency: this.style_consistency,
      dynamic_control: this.dynamic_control
    };
  }

  static fromDict(data) {
    return new StandardShotPrompt({
      subject: data.subject || '',
      shot_type: data.shot_type || '',
      atmosphere: data.atmosphere || '',
      environment: data.environment || '',
      camera_movement: data.camera_movement || '',
      angle: data.angle || '',
      special_technique: data.special_technique || '',
      composition: data.composition || '',
      style_consistency: data.style_consistency || '',
      dynamic_control: data.dynamic_control || ''
    });
  }

  toFormattedString() {
    const lines = [];

    if (this.subject) lines.push(`主体: ${this.subject}`);
    if (this.shot_type) lines.push(`景别: ${this.shot_type}`);
    if (this.atmosphere) lines.push(`氛围: ${this.atmosphere}`);
    if (this.environment) lines.push(`环境: ${this.environment}`);
    if (this.camera_movement) lines.push(`运镜: ${this.camera_movement}`);
    if (this.angle) lines.push(`视角: ${this.angle}`);
    if (this.special_technique) lines.push(`特殊拍摄手法: ${this.special_technique}`);
    if (this.composition) lines.push(`构图: ${this.composition}`);
    if (this.style_consistency) lines.push(`风格统一: ${this.style_consistency}`);
    if (this.dynamic_control) lines.push(`动态控制: ${this.dynamic_control}`);

    return lines.join('\n');
  }
}

export class Shot {
  constructor({
    shot_number = 1,
    template = ShotTemplate.T4_STANDARD_MEDIUM,
    description = '',
    characters_in_shot = [],
    scene_id = '',
    props_in_shot = [],
    camera = null,
    composition = null,
    slot_weights = null,
    dialogue = '',
    action = '',
    generated_prompt = '',
    standard_prompt = null,
    output_image = '',
    output_video = '',
    consistency_score = 0.0
  } = {}) {
    this.shot_number = shot_number;
    this.template = template;
    this.description = description;
    this.characters_in_shot = characters_in_shot;
    this.scene_id = scene_id;
    this.props_in_shot = props_in_shot;
    this.camera = camera || new CameraSettings();
    this.composition = composition || new CompositionSettings();
    this.slot_weights = slot_weights || new SlotWeights();
    this.dialogue = dialogue;
    this.action = action;
    this.generated_prompt = generated_prompt;
    this.standard_prompt = standard_prompt || new StandardShotPrompt();
    this.output_image = output_image;
    this.output_video = output_video;
    this.consistency_score = consistency_score;
  }

  toDict() {
    return {
      shot_number: this.shot_number,
      template: this.template,
      description: this.description,
      characters_in_shot: this.characters_in_shot,
      scene_id: this.scene_id,
      props_in_shot: this.props_in_shot,
      camera: this.camera.toDict(),
      composition: this.composition.toDict(),
      slot_weights: this.slot_weights.toDict(),
      dialogue: this.dialogue,
      action: this.action,
      generated_prompt: this.generated_prompt,
      standard_prompt: this.standard_prompt.toDict(),
      output_image: this.output_image,
      output_video: this.output_video,
      consistency_score: this.consistency_score
    };
  }

  static fromDict(data) {
    return new Shot({
      shot_number: data.shot_number || 1,
      template: data.template || ShotTemplate.T4_STANDARD_MEDIUM,
      description: data.description || '',
      characters_in_shot: data.characters_in_shot || [],
      scene_id: data.scene_id || '',
      props_in_shot: data.props_in_shot || [],
      camera: data.camera ? CameraSettings.fromDict(data.camera) : null,
      composition: data.composition ? CompositionSettings.fromDict(data.composition) : null,
      slot_weights: data.slot_weights ? SlotWeights.fromDict(data.slot_weights) : null,
      dialogue: data.dialogue || '',
      action: data.action || '',
      generated_prompt: data.generated_prompt || '',
      standard_prompt: data.standard_prompt ? StandardShotPrompt.fromDict(data.standard_prompt) : null,
      output_image: data.output_image || '',
      output_video: data.output_video || '',
      consistency_score: data.consistency_score || 0.0
    });
  }
}

export class StoryboardProject {
  constructor({
    name = 'Untitled Project',
    created_at = null,
    updated_at = null,
    version = '1.0',
    aspect_ratio = '16:9',
    characters = [],
    scenes = [],
    props = [],
    style = null,
    narrative_text = '',
    shots = [],
    generation_seed = -1,
    lock_seed = true
  } = {}) {
    this.name = name;
    this.created_at = created_at || new Date().toISOString();
    this.updated_at = updated_at || new Date().toISOString();
    this.version = version;
    this.aspect_ratio = aspect_ratio;
    this.characters = characters;
    this.scenes = scenes;
    this.props = props;
    this.style = style || new StyleConfig();
    this.narrative_text = narrative_text;
    this.shots = shots;
    this.generation_seed = generation_seed;
    this.lock_seed = lock_seed;
  }

  getCharacterById(charId) {
    return this.characters.find(c => c.id === charId) || null;
  }

  getSceneById(sceneId) {
    return this.scenes.find(s => s.id === sceneId) || null;
  }

  getPropById(propId) {
    return this.props.find(p => p.id === propId) || null;
  }

  getConsistencyPrefix() {
    const parts = [];

    const styleParts = [];
    const renderMap = {
      'realistic': 'photorealistic',
      'illustration': 'digital illustration',
      '3d_render': '3D rendered',
      'watercolor': 'watercolor style',
      'anime': 'anime style',
      'comic': 'comic book style'
    };

    if (this.style.render_type) {
      styleParts.push(renderMap[this.style.render_type] || this.style.render_type);
    }

    const toneMap = {
      'warm': 'warm color palette',
      'cool': 'cool color palette',
      'high_saturation': 'vibrant colors',
      'low_saturation': 'muted colors'
    };
    if (this.style.color_tone && toneMap[this.style.color_tone]) {
      styleParts.push(toneMap[this.style.color_tone]);
    }

    const lightMap = {
      'natural': 'natural lighting',
      'studio': 'studio lighting',
      'cinematic': 'cinematic lighting',
      'neon': 'neon lighting'
    };
    if (this.style.lighting_style && lightMap[this.style.lighting_style]) {
      styleParts.push(lightMap[this.style.lighting_style]);
    }

    if (this.style.custom_description) {
      styleParts.push(this.style.custom_description.substring(0, 80));
    }

    if (styleParts.length > 0) {
      parts.push(`[Style: ${styleParts.join(', ')}]`);
    }

    for (const char of this.characters.slice(0, 3)) {
      const charPrompt = char.getConsistencyPrompt();
      if (charPrompt && charPrompt !== `[${char.name}: ]`) {
        parts.push(charPrompt);
      }
    }

    return parts.join(' ') || '';
  }

  toDict() {
    return {
      project_meta: {
        name: this.name,
        created_at: this.created_at,
        updated_at: new Date().toISOString(),
        version: this.version,
        aspect_ratio: this.aspect_ratio,
        generation_seed: this.generation_seed,
        lock_seed: this.lock_seed
      },
      references: {
        characters: this.characters.map(c => c.toDict()),
        scenes: this.scenes.map(s => s.toDict()),
        props: this.props.map(p => p.toDict()),
        style: this.style.toDict()
      },
      narrative: this.narrative_text,
      storyboard: this.shots.map(s => s.toDict())
    };
  }

  static fromDict(data) {
    const meta = data.project_meta || {};
    const refs = data.references || {};

    return new StoryboardProject({
      name: meta.name || 'Untitled Project',
      created_at: meta.created_at,
      updated_at: meta.updated_at,
      version: meta.version || '1.0',
      aspect_ratio: meta.aspect_ratio || '16:9',
      generation_seed: meta.generation_seed ?? -1,
      lock_seed: meta.lock_seed ?? true,
      characters: (refs.characters || []).map(c => Character.fromDict(c)),
      scenes: (refs.scenes || []).map(s => Scene.fromDict(s)),
      props: (refs.props || []).map(p => Prop.fromDict(p)),
      style: refs.style ? StyleConfig.fromDict(refs.style) : null,
      narrative_text: data.narrative || '',
      shots: (data.storyboard || []).map(s => Shot.fromDict(s))
    });
  }
}

export class GeneratedAsset {
  constructor({
    id = null,
    asset_type = GeneratedAssetType.CHARACTER,
    name = '',
    description = '',
    prompt = '',
    negative_prompt = '',
    status = AssetGenerationStatus.PENDING,
    image_path = '',
    ref_image_path = '',
    generation_params = {},
    review_score = 0.0,
    review_summary = '',
    review_issues = [],
    review_suggestions = [],
    created_at = null,
    generation_time = 0.0
  } = {}) {
    this.id = id || `asset_${uuidv4().replace(/-/g, '').substring(0, 8)}`;
    this.asset_type = asset_type;
    this.name = name;
    this.description = description;
    this.prompt = prompt;
    this.negative_prompt = negative_prompt;
    this.status = status;
    this.image_path = image_path;
    this.ref_image_path = ref_image_path;
    this.generation_params = generation_params;
    this.review_score = review_score;
    this.review_summary = review_summary;
    this.review_issues = review_issues;
    this.review_suggestions = review_suggestions;
    this.created_at = created_at || new Date().toISOString();
    this.generation_time = generation_time;
  }

  toDict() {
    return {
      id: this.id,
      asset_type: this.asset_type,
      name: this.name,
      description: this.description,
      prompt: this.prompt,
      negative_prompt: this.negative_prompt,
      status: this.status,
      image_path: this.image_path,
      ref_image_path: this.ref_image_path,
      generation_params: this.generation_params,
      review_score: this.review_score,
      review_summary: this.review_summary,
      review_issues: this.review_issues,
      review_suggestions: this.review_suggestions,
      created_at: this.created_at,
      generation_time: this.generation_time
    };
  }

  static fromDict(data) {
    return new GeneratedAsset({
      id: data.id,
      asset_type: data.asset_type || GeneratedAssetType.CHARACTER,
      name: data.name || '',
      description: data.description || '',
      prompt: data.prompt || '',
      negative_prompt: data.negative_prompt || '',
      status: data.status || AssetGenerationStatus.PENDING,
      image_path: data.image_path || '',
      ref_image_path: data.ref_image_path || '',
      generation_params: data.generation_params || {},
      review_score: data.review_score || 0.0,
      review_summary: data.review_summary || '',
      review_issues: data.review_issues || [],
      review_suggestions: data.review_suggestions || [],
      created_at: data.created_at,
      generation_time: data.generation_time || 0.0
    });
  }
}

export class ComfyUISettings {
  constructor({
    host = '127.0.0.1',
    port = 8188,
    use_https = false,
    custom_workflow_path = '',
    default_model = '',
    timeout = 300
  } = {}) {
    this.host = host;
    this.port = port;
    this.use_https = use_https;
    this.custom_workflow_path = custom_workflow_path;
    this.default_model = default_model;
    this.timeout = timeout;
  }

  toDict() {
    return {
      host: this.host,
      port: this.port,
      use_https: this.use_https,
      custom_workflow_path: this.custom_workflow_path,
      default_model: this.default_model,
      timeout: this.timeout
    };
  }

  static fromDict(data) {
    return new ComfyUISettings({
      host: data.host || '127.0.0.1',
      port: data.port || 8188,
      use_https: data.use_https || false,
      custom_workflow_path: data.custom_workflow_path || '',
      default_model: data.default_model || '',
      timeout: data.timeout || 300
    });
  }
}
