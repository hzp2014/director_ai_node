import { ShotTemplate, CameraSettings, CompositionSettings, SlotWeights } from './models.js';

export const SHOT_TEMPLATES = {
  [ShotTemplate.T1_ESTABLISHING_WIDE]: {
    name: 'T1 全景 - 建立镜头',
    description: '全景展示，用于确立场景和环境',
    camera: new CameraSettings({ distance: 'extreme_wide', focal_length: 24 }),
    composition: new CompositionSettings({ subject_scale: 0.2, horizon_position: 'middle' }),
    weight_profile: { scene: 0.8, character: 0.3, props: 0.3, style: 0.4 },
    example_prompt: 'wide establishing shot of a cityscape at sunset',
    use_cases: ['scene_intro', 'location_reveal', 'environment_context']
  },
  [ShotTemplate.T2_ENVIRONMENT_MEDIUM]: {
    name: 'T2 环境中景',
    description: '人物与环境平衡的中景镜头',
    camera: new CameraSettings({ distance: 'medium_wide', focal_length: 35 }),
    composition: new CompositionSettings({ subject_scale: 0.4, horizon_position: 'middle' }),
    weight_profile: { scene: 0.6, character: 0.5, props: 0.4, style: 0.4 },
    example_prompt: 'environmental medium shot showing character in context',
    use_cases: ['character_in_scene', 'spatial_relationship', 'mood_setting']
  },
  [ShotTemplate.T3_FRAMED_SHOT]: {
    name: 'T3 框式镜头',
    description: '通过框架构图增强层次感',
    camera: new CameraSettings({ distance: 'medium', focal_length: 50 }),
    composition: new CompositionSettings({ subject_scale: 0.5, depth_layers: 3, rule_of_thirds: true }),
    weight_profile: { scene: 0.7, character: 0.6, props: 0.5, style: 0.4 },
    example_prompt: 'framed shot with foreground elements creating natural frame',
    use_cases: ['depth_emphasis', 'voyeuristic_feel', 'visual_interest']
  },
  [ShotTemplate.T4_STANDARD_MEDIUM]: {
    name: 'T4 标准中景',
    description: '叙事主力镜头，半身构图',
    camera: new CameraSettings({ distance: 'medium', focal_length: 50 }),
    composition: new CompositionSettings({ subject_scale: 0.6, subject_position: 'center' }),
    weight_profile: { character: 0.85, scene: 0.5, props: 0.6, style: 0.4 },
    example_prompt: 'standard medium shot of character from waist up',
    use_cases: ['dialogue', 'character_expression', 'standard_narrative']
  },
  [ShotTemplate.T5_OVER_SHOULDER]: {
    name: 'T5 过肩镜头',
    description: '对话场景常用镜头，建立空间关系',
    camera: new CameraSettings({ distance: 'medium', horizontal_angle: 15, focal_length: 50 }),
    composition: new CompositionSettings({ subject_scale: 0.5, subject_position: 'right_third' }),
    weight_profile: { character: 0.8, scene: 0.6, props: 0.5, style: 0.4 },
    example_prompt: 'over-the-shoulder shot looking past character to subject',
    use_cases: ['dialogue', 'conversation', 'relationship_dynamics']
  },
  [ShotTemplate.T6_CLOSEUP]: {
    name: 'T6 特写镜头',
    description: '强调情绪和表情的特写',
    camera: new CameraSettings({ distance: 'close', focal_length: 85 }),
    composition: new CompositionSettings({ subject_scale: 0.8, background_blur: true }),
    weight_profile: { character: 0.9, scene: 0.3, props: 0.2, style: 0.3 },
    example_prompt: 'tight close-up of face showing emotion',
    use_cases: ['emotion_emphasis', 'character_focus', 'intimate_moment']
  },
  [ShotTemplate.T7_LOW_ANGLE]: {
    name: 'T7 低角度镜头',
    description: '表现力量、权威或压迫感',
    camera: new CameraSettings({ distance: 'medium', vertical_angle: 30, focal_length: 35 }),
    composition: new CompositionSettings({ subject_scale: 0.7, horizon_position: 'lower_third' }),
    weight_profile: { character: 0.85, scene: 0.5, props: 0.4, style: 0.4 },
    example_prompt: 'low angle shot looking up at powerful figure',
    use_cases: ['power_dynamics', 'authority', 'dramatic_effect']
  },
  [ShotTemplate.T8_FOLLOWING]: {
    name: 'T8 跟随镜头',
    description: '沉浸式跟踪，增加动态感',
    camera: new CameraSettings({ distance: 'medium', focal_length: 35 }),
    composition: new CompositionSettings({ subject_scale: 0.5, subject_position: 'center' }),
    weight_profile: { character: 0.8, scene: 0.6, props: 0.4, style: 0.3 },
    example_prompt: 'following shot tracking character in motion',
    use_cases: ['action_sequence', 'character_movement', 'immersive_experience']
  },
  [ShotTemplate.T9_POV]: {
    name: 'T9 主观镜头',
    description: '第一人称视角，增强代入感',
    camera: new CameraSettings({ distance: 'medium', focal_length: 50 }),
    composition: new CompositionSettings({ subject_scale: 0.5, horizon_position: 'middle' }),
    weight_profile: { character: 0.9, scene: 0.5, props: 0.4, style: 0.4 },
    example_prompt: 'POV shot showing what character sees',
    use_cases: ['immersion', 'character_perspective', 'subjective_experience']
  }
};

export function getTemplate(templateKey) {
  return SHOT_TEMPLATES[templateKey] || null;
}

export function getTemplateChoicesCN() {
  return Object.entries(SHOT_TEMPLATES).map(([key, template]) => ({
    value: key,
    label: template.name,
    description: template.description
  }));
}

export function getTemplateSummary(templateKey) {
  const template = getTemplate(templateKey);
  if (!template) return '';

  const summary = [
    template.name,
    template.description,
    `Camera: ${template.camera.distance} at ${template.camera.focal_length}mm`,
    `Subject Scale: ${template.composition.subject_scale}`
  ];
  return summary.join(' | ');
}

export const TEMPLATE_QUICK_REF = {
  '全景': ShotTemplate.T1_ESTABLISHING_WIDE,
  '中景': ShotTemplate.T4_STANDARD_MEDIUM,
  '特写': ShotTemplate.T6_CLOSEUP,
  '过肩': ShotTemplate.T5_OVER_SHOULDER,
  '低角度': ShotTemplate.T7_LOW_ANGLE,
  '跟随': ShotTemplate.T8_FOLLOWING
};
