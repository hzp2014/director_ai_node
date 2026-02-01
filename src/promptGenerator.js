import { getTemplate, SHOT_TEMPLATES } from './templates.js';
import { ShotTemplate, Shot, StoryboardProject, SlotWeights } from './models.js';

function getTemplateKeyFromCN(cnName) {
  const templateMap = {
    '全景': ShotTemplate.T1_ESTABLISHING_WIDE,
    '中景': ShotTemplate.T4_STANDARD_MEDIUM,
    '特写': ShotTemplate.T6_CLOSEUP,
    '过肩': ShotTemplate.T5_OVER_SHOULDER,
    '低角度': ShotTemplate.T7_LOW_ANGLE,
    '跟随': ShotTemplate.T8_FOLLOWING
  };
  return templateMap[cnName];
}

function buildCameraPrompt(template, shot) {
  const camera = shot.camera || template.camera;
  const distanceMap = {
    'extreme_wide': 'extreme wide shot',
    'wide': 'wide shot',
    'medium_wide': 'medium wide shot',
    'medium': 'medium shot',
    'close': 'close-up shot'
  };

  const parts = [distanceMap[camera.distance] || 'medium shot'];

  if (camera.vertical_angle < -20) {
    parts.push('high angle overhead view');
  } else if (camera.vertical_angle < -5) {
    parts.push('high angle shot');
  } else if (camera.vertical_angle > 20) {
    parts.push('low angle heroic shot');
  } else if (camera.vertical_angle > 5) {
    parts.push('slightly low angle');
  }

  if (Math.abs(camera.horizontal_angle) > 15) {
    parts.push('angled perspective');
  }

  if (camera.focal_length <= 24) {
    parts.push('wide lens perspective');
  } else if (camera.focal_length >= 85) {
    parts.push('telephoto compression, shallow depth of field');
  }

  return parts.join(', ');
}

function buildCharacterPrompt(characters, shot, template) {
  if (!characters || characters.length === 0) {
    return '';
  }

  const charDescs = [];

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    if (!shot.characters_in_shot.includes(char.id)) {
      continue;
    }

    const consistencyPrompt = char.getConsistencyPrompt();
    const descParts = [];

    if (consistencyPrompt && consistencyPrompt !== `[${char.name}: ]`) {
      descParts.push(consistencyPrompt);
    } else {
      descParts.push(char.name);
      if (char.description) {
        descParts.push(`(${char.description})`);
      }
    }

    if (template.template_type === ShotTemplate.T5_OVER_SHOULDER) {
      if (i === 0) {
        descParts.push('in foreground (back/shoulder visible, slightly blurred)');
      } else {
        descParts.push('in focus, facing camera');
      }
    }

    if (template.template_type === ShotTemplate.T9_POV) {
      descParts.push('(hands may be visible in frame)');
    }

    if (template.template_type === ShotTemplate.T8_FOLLOWING) {
      descParts.push('seen from behind, back view');
    }

    charDescs.push(descParts.join(' '));
  }

  return charDescs.join(', ');
}

function buildScenePrompt(scene, template) {
  if (!scene) {
    return '';
  }

  const parts = [];

  if (scene.name) {
    parts.push(`in ${scene.name}`);
  }

  if (scene.description) {
    parts.push(scene.description.substring(0, 150));
  }

  if (scene.light_direction) {
    parts.push(`lighting from ${scene.light_direction}`);
  }

  const tempMap = {
    'warm': 'warm golden tones',
    'cool': 'cool blue tones',
    'neutral': 'neutral balanced lighting'
  };
  if (scene.color_temperature && tempMap[scene.color_temperature]) {
    parts.push(tempMap[scene.color_temperature]);
  }

  return parts.join(', ');
}

function buildPropsPrompt(props, shot, template) {
  if (!props || !shot.props_in_shot || shot.props_in_shot.length === 0) {
    return '';
  }

  const propDescs = [];

  for (const prop of props) {
    if (!shot.props_in_shot.includes(prop.id)) {
      continue;
    }

    let desc = prop.name;
    if (prop.material) {
      desc += ` (${prop.material})`;
    }
    if (prop.size_reference) {
      desc += `, ${prop.size_reference}`;
    }

    if (template.template_type === ShotTemplate.T6_CLOSEUP && shot.props_in_shot.length > 0) {
      desc = `focus on ${desc}, detailed view`;
    }

    propDescs.push(desc);
  }

  if (propDescs.length > 0) {
    return 'featuring ' + propDescs.join(', ');
  }
  return '';
}

function buildStylePrompt(style) {
  const parts = [];

  const presetStyleMap = {
    'Cartoon2D': '2D cartoon style, flat colors, clean lines, cel shading',
    'Anime': 'anime style, vibrant colors, cel shading, Japanese animation',
    'Comic': 'comic book style, bold outlines, halftone dots',
    'Watercolor': 'watercolor painting style, soft edges, flowing colors',
    'Realistic3D': '3D realistic render, photorealistic 3D, high detail',
    'Cinematic': 'cinematic style, film grain, dramatic lighting, movie quality',
    'GameCG': 'game CG style, high quality 3D render, video game graphics',
    'Cyberpunk': 'cyberpunk style, neon lights, futuristic, sci-fi atmosphere'
  };

  if (style.preset_name && presetStyleMap[style.preset_name]) {
    parts.push(presetStyleMap[style.preset_name]);
  } else {
    const renderMap = {
      'realistic': 'photorealistic rendering',
      'illustration': 'digital illustration style',
      '3d_render': '3D rendered',
      'watercolor': 'watercolor painting style',
      'anime': 'anime style',
      'comic': 'comic book style',
      'cartoon': '2D cartoon style, flat colors, clean lines'
    };
    parts.push(renderMap[style.render_type] || style.render_type);
  }

  const toneMap = {
    'warm': 'warm color palette',
    'cool': 'cool color palette',
    'high_saturation': 'vibrant saturated colors',
    'low_saturation': 'muted desaturated colors',
    'neutral': 'balanced natural colors'
  };
  if (style.color_tone && toneMap[style.color_tone]) {
    parts.push(toneMap[style.color_tone]);
  }

  const lightMap = {
    'natural': 'natural lighting',
    'studio': 'studio lighting setup',
    'neon': 'neon lighting, cyberpunk atmosphere',
    'backlit': 'dramatic backlighting, rim light',
    'cinematic': 'cinematic lighting, film-like'
  };
  if (style.lighting_style && lightMap[style.lighting_style]) {
    parts.push(lightMap[style.lighting_style]);
  }

  const textureMap = {
    'film_grain': 'film grain texture, analog look',
    'digital_clean': 'clean digital render',
    'noise': 'subtle noise texture'
  };
  if (style.texture && textureMap[style.texture]) {
    parts.push(textureMap[style.texture]);
  }

  if (style.custom_description) {
    parts.push(style.custom_description.substring(0, 100));
  }

  return parts.join(', ');
}

function buildActionPrompt(shot) {
  const parts = [];

  if (shot.action) {
    parts.push(shot.action);
  }

  if (shot.dialogue) {
    parts.push(`during dialogue: '${shot.dialogue.substring(0, 80)}...'`);
  }

  if (shot.description) {
    parts.push(shot.description);
  }

  return parts.join(', ');
}

function buildCompositionPrompt(template, shot) {
  const comp = shot.composition || template.composition;
  const parts = [];

  const positionMap = {
    'left_third': 'subject positioned left third',
    'right_third': 'subject positioned right third',
    'center': 'centered composition'
  };
  if (comp.subject_position && comp.rule_of_thirds && positionMap[comp.subject_position]) {
    parts.push(positionMap[comp.subject_position]);
  }

  if (comp.foreground_blur) {
    parts.push('foreground blur');
  }
  if (comp.background_blur) {
    parts.push('background bokeh');
  }

  if (comp.depth_layers >= 3) {
    parts.push('layered depth, foreground-midground-background');
  }

  return parts.join(', ');
}

export function generateShotPrompt(shot, project, includeTechnical = true) {
  if (!shot || !project) {
    throw new Error('Shot and project are required');
  }

  let template = getTemplate(shot.template);
  if (!template) {
    template = getTemplate(ShotTemplate.T4_STANDARD_MEDIUM);
  }

  const promptParts = [];

  const stylePrompt = buildStylePrompt(project.style);
  if (stylePrompt) {
    promptParts.push(stylePrompt);
  }

  const cameraPrompt = buildCameraPrompt(template, shot);
  if (cameraPrompt) {
    promptParts.push(cameraPrompt);
  }

  if (template.prompt_keywords && template.prompt_keywords.length > 0) {
    promptParts.push(template.prompt_keywords[0]);
  }

  const shotCharacters = shot.characters_in_shot
    .map(charId => project.getCharacterById(charId))
    .filter(c => c !== null);

  const charPrompt = buildCharacterPrompt(shotCharacters, shot, template);
  if (charPrompt) {
    promptParts.push(charPrompt);
  }

  const actionPrompt = buildActionPrompt(shot);
  if (actionPrompt) {
    promptParts.push(actionPrompt);
  }

  const scene = project.getSceneById(shot.scene_id);
  const scenePrompt = buildScenePrompt(scene, template);
  if (scenePrompt) {
    promptParts.push(scenePrompt);
  }

  const shotProps = shot.props_in_shot
    .map(propId => project.getPropById(propId))
    .filter(p => p !== null);

  const propsPrompt = buildPropsPrompt(shotProps, shot, template);
  if (propsPrompt) {
    promptParts.push(propsPrompt);
  }

  const compPrompt = buildCompositionPrompt(template, shot);
  if (compPrompt) {
    promptParts.push(compPrompt);
  }

  if (includeTechnical) {
    promptParts.push('8K resolution, highly detailed');
  }

  return promptParts.join(', ');
}

export function generateStandardShotPrompt(shot, project) {
  if (!shot || !project) {
    throw new Error('Shot and project are required');
  }

  let template = getTemplate(shot.template);
  if (!template) {
    template = getTemplate(ShotTemplate.T4_STANDARD_MEDIUM);
  }

  const scene = project.getSceneById(shot.scene_id);

  return {
    subject: generateSubject(shot, project),
    shot_type: generateShotTypeDetail(shot, template),
    atmosphere: generateAtmosphere(shot, scene, project.style),
    environment: generateEnvironmentDescription(scene, shot),
    camera_movement: CAMERA_MOVEMENT_MAP[shot.template] || '固定',
    angle: generateAngleDetail(shot, template),
    special_technique: generateSpecialTechnique(template, shot),
    composition: COMPOSITION_MAP[shot.template] || '三分法',
    style_consistency: generateStyleConsistency(project.style),
    dynamic_control: generateDynamicControlDetail(shot, template)
  };
}

export function generateStandardPromptText(shot, project) {
  const prompt = generateStandardShotPrompt(shot, project);

  const lines = [];
  lines.push(`【主体】${prompt.subject}`);
  lines.push(`【景别】${prompt.shot_type}`);
  lines.push(`【氛围】${prompt.atmosphere}`);
  lines.push(`【环境】${prompt.environment}`);
  lines.push(`【运镜】${prompt.camera_movement}`);
  lines.push(`【视角】${prompt.angle}`);
  lines.push(`【技法】${prompt.special_technique}`);
  lines.push(`【构图】${prompt.composition}`);
  lines.push(`【风格】${prompt.style_consistency}`);
  lines.push(`【动态】${prompt.dynamic_control}`);

  return lines.join('\n');
}

export function suggestNextShotTemplate(previousShot) {
  const transitions = {
    [ShotTemplate.T1_ESTABLISHING_WIDE]: [ShotTemplate.T2_ENVIRONMENT_MEDIUM, ShotTemplate.T4_STANDARD_MEDIUM],
    [ShotTemplate.T2_ENVIRONMENT_MEDIUM]: [ShotTemplate.T4_STANDARD_MEDIUM, ShotTemplate.T5_OVER_SHOULDER],
    [ShotTemplate.T3_FRAMED_SHOT]: [ShotTemplate.T4_STANDARD_MEDIUM, ShotTemplate.T6_CLOSEUP],
    [ShotTemplate.T4_STANDARD_MEDIUM]: [ShotTemplate.T6_CLOSEUP, ShotTemplate.T5_OVER_SHOULDER, ShotTemplate.T2_ENVIRONMENT_MEDIUM],
    [ShotTemplate.T5_OVER_SHOULDER]: [ShotTemplate.T4_STANDARD_MEDIUM, ShotTemplate.T6_CLOSEUP],
    [ShotTemplate.T6_CLOSEUP]: [ShotTemplate.T4_STANDARD_MEDIUM, ShotTemplate.T5_OVER_SHOULDER, ShotTemplate.T7_LOW_ANGLE],
    [ShotTemplate.T7_LOW_ANGLE]: [ShotTemplate.T4_STANDARD_MEDIUM, ShotTemplate.T6_CLOSEUP],
    [ShotTemplate.T8_FOLLOWING]: [ShotTemplate.T4_STANDARD_MEDIUM, ShotTemplate.T6_CLOSEUP],
    [ShotTemplate.T9_POV]: [ShotTemplate.T4_STANDARD_MEDIUM, ShotTemplate.T6_CLOSEUP]
  };

  if (!previousShot || !previousShot.template) {
    return ShotTemplate.T1_ESTABLISHING_WIDE;
  }

  const possibleTransitions = transitions[previousShot.template] || [ShotTemplate.T4_STANDARD_MEDIUM];
  const randomIndex = Math.floor(Math.random() * possibleTransitions.length);
  return possibleTransitions[randomIndex];
}

export function enhancePromptWithWeights(prompt, weights) {
  if (!weights) {
    return prompt;
  }

  const enhancements = [];

  if (weights.character > 0.7) {
    enhancements.push('character emphasis');
  }

  if (weights.scene > 0.7) {
    enhancements.push('environmental detail');
  }

  if (weights.props > 0.6) {
    enhancements.push('props included');
  }

  if (weights.style > 0.5) {
    enhancements.push('consistent style');
  }

  if (enhancements.length > 0) {
    return `${prompt} | ${enhancements.join(', ')}`;
  }

  return prompt;
}

const SHOT_TYPE_MAP = {
  [ShotTemplate.T1_ESTABLISHING_WIDE]: '远景/全景',
  [ShotTemplate.T2_ENVIRONMENT_MEDIUM]: '全景/中全景',
  [ShotTemplate.T3_FRAMED_SHOT]: '中景 (框式)',
  [ShotTemplate.T4_STANDARD_MEDIUM]: '中景',
  [ShotTemplate.T5_OVER_SHOULDER]: '中近景 (过肩)',
  [ShotTemplate.T6_CLOSEUP]: '特写/近景',
  [ShotTemplate.T7_LOW_ANGLE]: '中景 (仰拍)',
  [ShotTemplate.T8_FOLLOWING]: '中全景 (跟拍)',
  [ShotTemplate.T9_POV]: '主观视角'
};

const CAMERA_MOVEMENT_MAP = {
  [ShotTemplate.T1_ESTABLISHING_WIDE]: '固定/缓慢横摇',
  [ShotTemplate.T2_ENVIRONMENT_MEDIUM]: '固定/轻微推拉',
  [ShotTemplate.T3_FRAMED_SHOT]: '固定',
  [ShotTemplate.T4_STANDARD_MEDIUM]: '固定/轻微推',
  [ShotTemplate.T5_OVER_SHOULDER]: '固定/轻微横移',
  [ShotTemplate.T6_CLOSEUP]: '固定/缓推',
  [ShotTemplate.T7_LOW_ANGLE]: '固定/缓慢仰升',
  [ShotTemplate.T8_FOLLOWING]: '跟移/稳定器跟拍',
  [ShotTemplate.T9_POV]: '手持/主观移动'
};

const ANGLE_MAP = {
  [ShotTemplate.T1_ESTABLISHING_WIDE]: '高角度俯拍 (上帝视角)',
  [ShotTemplate.T2_ENVIRONMENT_MEDIUM]: '平视/微俯',
  [ShotTemplate.T3_FRAMED_SHOT]: '平视',
  [ShotTemplate.T4_STANDARD_MEDIUM]: '平视',
  [ShotTemplate.T5_OVER_SHOULDER]: '平视/微仰',
  [ShotTemplate.T6_CLOSEUP]: '平视/微仰',
  [ShotTemplate.T7_LOW_ANGLE]: '低角度仰拍',
  [ShotTemplate.T8_FOLLOWING]: '中低角度/略高',
  [ShotTemplate.T9_POV]: '主观第一人称'
};

const COMPOSITION_MAP = {
  [ShotTemplate.T1_ESTABLISHING_WIDE]: '对称构图/三分法/引导线',
  [ShotTemplate.T2_ENVIRONMENT_MEDIUM]: '三分法/人景均衡',
  [ShotTemplate.T3_FRAMED_SHOT]: '框式构图/层次构图',
  [ShotTemplate.T4_STANDARD_MEDIUM]: '三分法/中心构图',
  [ShotTemplate.T5_OVER_SHOULDER]: '三分法/前景虚化',
  [ShotTemplate.T6_CLOSEUP]: '中心构图/三分法',
  [ShotTemplate.T7_LOW_ANGLE]: '对角线/三分法/仰角透视',
  [ShotTemplate.T8_FOLLOWING]: '中心构图/纵深引导',
  [ShotTemplate.T9_POV]: '主观视线/焦点构图'
};

const DYNAMIC_CONTROL_MAP = {
  [ShotTemplate.T1_ESTABLISHING_WIDE]: '静态/轻微动态',
  [ShotTemplate.T2_ENVIRONMENT_MEDIUM]: '轻微动态',
  [ShotTemplate.T3_FRAMED_SHOT]: '静态',
  [ShotTemplate.T4_STANDARD_MEDIUM]: '轻微动态/中等动态',
  [ShotTemplate.T5_OVER_SHOULDER]: '轻微动态',
  [ShotTemplate.T6_CLOSEUP]: '静态/微表情动态',
  [ShotTemplate.T7_LOW_ANGLE]: '中等动态/静态威压',
  [ShotTemplate.T8_FOLLOWING]: '中等动态/动态',
  [ShotTemplate.T9_POV]: '动态/主观运动'
};

function generateAtmosphere(shot, scene, style) {
  const atmosphereParts = [];

  const toneAtmosphere = {
    'warm': '温暖',
    'cool': '冷峻',
    'high_saturation': '鲜艳活跃',
    'low_saturation': '沉稳内敛',
    'neutral': '平实自然'
  };
  if (style.color_tone && toneAtmosphere[style.color_tone]) {
    atmosphereParts.push(toneAtmosphere[style.color_tone]);
  }

  const lightAtmosphere = {
    'natural': '自然舒适',
    'studio': '专业精致',
    'neon': '赛博朋克/未来感',
    'backlit': '神秘/戏剧性',
    'cinematic': '电影质感'
  };
  if (style.lighting_style && lightAtmosphere[style.lighting_style]) {
    atmosphereParts.push(lightAtmosphere[style.lighting_style]);
  }

  if (scene && scene.color_temperature) {
    const tempAtmosphere = {
      'warm': '温馨',
      'cool': '清冷',
      'neutral': '中性'
    };
    if (tempAtmosphere[scene.color_temperature]) {
      atmosphereParts.push(tempAtmosphere[scene.color_temperature]);
    }
  }

  return atmosphereParts.length > 0 ? atmosphereParts.join('/') : '自然';
}

function generateEnvironmentDescription(scene, shot) {
  if (!scene) {
    return '未指定场景';
  }

  const envParts = [];

  if (scene.name) {
    envParts.push(scene.name);
  }

  if (scene.description) {
    envParts.push(scene.description.substring(0, 60));
  }

  if (scene.light_direction) {
    envParts.push(`光源: ${scene.light_direction}`);
  }

  return envParts.length > 0 ? envParts.join(', ') : '未指定';
}

function generateSpecialTechnique(template, shot) {
  const techniques = [];

  switch (template.template_type) {
    case ShotTemplate.T1_ESTABLISHING_WIDE:
      techniques.push('航拍/大范围固定机位');
      break;
    case ShotTemplate.T3_FRAMED_SHOT:
      techniques.push('利用门窗/建筑元素形成画框');
      break;
    case ShotTemplate.T5_OVER_SHOULDER:
      techniques.push('浅景深虚化前景');
      break;
    case ShotTemplate.T6_CLOSEUP:
      techniques.push('浅景深/背景虚化');
      break;
    case ShotTemplate.T7_LOW_ANGLE:
      techniques.push('广角镜头增强透视');
      break;
    case ShotTemplate.T8_FOLLOWING:
      techniques.push('稳定器/斯坦尼康跟拍');
      break;
    case ShotTemplate.T9_POV:
      techniques.push('手持拍摄模拟主观');
      break;
  }

  if (shot.composition.foreground_blur) {
    techniques.push('前景虚化');
  }
  if (shot.composition.background_blur) {
    techniques.push('背景虚化');
  }
  if (shot.composition.depth_layers >= 3) {
    techniques.push('多层景深');
  }

  return techniques.length > 0 ? techniques.join(', ') : '标准拍摄';
}

function generateStyleConsistency(style) {
  const parts = [];

  const renderCn = {
    'realistic': '写实风格',
    'illustration': '插画风格',
    '3d_render': '3D渲染',
    'watercolor': '水彩风格',
    'anime': '动漫风格',
    'comic': '漫画风格'
  };
  if (style.render_type && renderCn[style.render_type]) {
    parts.push(renderCn[style.render_type]);
  }

  const toneCn = {
    'warm': '暖色调',
    'cool': '冷色调',
    'high_saturation': '高饱和度',
    'low_saturation': '低饱和度',
    'neutral': '中性色调'
  };
  if (style.color_tone && toneCn[style.color_tone]) {
    parts.push(toneCn[style.color_tone]);
  }

  const lightCn = {
    'natural': '自然光',
    'studio': '影棚灯光',
    'neon': '霓虹灯光',
    'backlit': '逆光',
    'cinematic': '电影灯光'
  };
  if (style.lighting_style && lightCn[style.lighting_style]) {
    parts.push(lightCn[style.lighting_style]);
  }

  const textureCn = {
    'film_grain': '胶片颗粒感',
    'digital_clean': '数码清晰',
    'noise': '轻微噪点'
  };
  if (style.texture && textureCn[style.texture]) {
    parts.push(textureCn[style.texture]);
  }

  return parts.length > 0 ? parts.join(', ') : '标准风格';
}

function generateSubject(shot, project) {
  const subjects = [];

  for (const charId of shot.characters_in_shot) {
    const char = project.getCharacterById(charId);
    if (char) {
      subjects.push(char.name);
    }
  }

  for (const propId of shot.props_in_shot) {
    const prop = project.getPropById(propId);
    if (prop) {
      subjects.push(prop.name);
    }
  }

  return subjects.length > 0 ? subjects.join('、') : '环境/空镜';
}

function generateShotTypeDetail(shot, template) {
  const baseType = SHOT_TYPE_MAP[shot.template] || '中景';

  if (shot.description) {
    return `${baseType} - ${shot.description}`;
  }
  return baseType;
}

function generateAngleDetail(shot, template) {
  const baseAngle = ANGLE_MAP[shot.template] || '平视';

  const details = [baseAngle];

  if (shot.action) {
    details.push(shot.action);
  }

  return details.length > 1 ? details.join('，') : details[0];
}

function generateDynamicControlDetail(shot, template) {
  const baseDynamic = DYNAMIC_CONTROL_MAP[shot.template] || '轻微动态';

  if (shot.action) {
    return shot.action;
  }
  if (shot.description) {
    return `${baseDynamic} - ${shot.description.substring(0, 50)}`;
  }
  return baseDynamic;
}

export function generateNegativePrompt(template) {
  const baseNegative = [
    'blurry', 'low quality', 'distorted', 'deformed',
    'bad anatomy', 'wrong proportions', 'extra limbs',
    'cropped', 'watermark', 'signature', 'text'
  ];

  if (template && template.template_type === ShotTemplate.T6_CLOSEUP) {
    baseNegative.push('too far', 'full body', 'wide shot');
  }

  if (template && template.template_type === ShotTemplate.T1_ESTABLISHING_WIDE) {
    baseNegative.push('too close', 'face focus', 'portrait');
  }

  if (template && template.template_type === ShotTemplate.T9_POV) {
    baseNegative.push('face of viewer visible', 'self visible');
  }

  return baseNegative.join(', ');
}
