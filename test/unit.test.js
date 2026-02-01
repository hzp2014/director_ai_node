import assert from 'node:assert';
import { test, describe, mock } from 'node:test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { 
  CameraSettings, 
  CompositionSettings, 
  Character, 
  CharacterAppearance,
  Shot, 
  StoryboardProject 
} from '../src/models.js';
import { ProjectCreate, CharacterCreate, BaseResponse, DataResponse } from '../src/schemas.js';
import settings from '../src/config.js';

describe('Models', () => {
  describe('CameraSettings', () => {
    test('should create with default values', () => {
      const camera = new CameraSettings();
      assert.strictEqual(camera.distance, 'medium');
      assert.strictEqual(camera.focal_length, 50);
    });

    test('should create with custom values', () => {
      const camera = new CameraSettings({ distance: 'close', focal_length: 35 });
      assert.strictEqual(camera.distance, 'close');
      assert.strictEqual(camera.focal_length, 35);
    });

    test('should serialize to dict', () => {
      const camera = new CameraSettings({ distance: 'far', focal_length: 70 });
      const dict = camera.toDict();
      assert.strictEqual(dict.distance, 'far');
      assert.strictEqual(dict.focal_length, 70);
    });

    test('should deserialize from dict', () => {
      const dict = { distance: 'medium', focal_length: 50 };
      const camera = CameraSettings.fromDict(dict);
      assert.strictEqual(camera.distance, 'medium');
      assert.strictEqual(camera.focal_length, 50);
    });
  });

  describe('CompositionSettings', () => {
    test('should create with default values', () => {
      const composition = new CompositionSettings();
      assert.strictEqual(composition.subject_scale, 0.5);
    });

    test('should serialize and deserialize', () => {
      const composition = new CompositionSettings({ subject_scale: 0.7 });
      const dict = composition.toDict();
      const restored = CompositionSettings.fromDict(dict);
      assert.strictEqual(restored.subject_scale, 0.7);
    });
  });

  describe('Character', () => {
    test('should create character with default values', () => {
      const character = new Character({ name: 'Test' });
      assert.strictEqual(character.name, 'Test');
      assert.strictEqual(character.consistency_weight, 0.8);
    });

    test('should get consistency prompt', () => {
      const appearance = new CharacterAppearance({
        hair_color: 'black',
        eye_color: 'brown',
        skin_tone: 'fair',
        face_shape: 'oval'
      });
      const character = new Character({ 
        name: 'Alice',
        appearance: appearance
      });
      const prompt = character.getConsistencyPrompt();
      assert.ok(prompt.includes('Alice'));
    });

    test('should serialize and deserialize', () => {
      const character = new Character({ name: 'Bob' });
      const dict = character.toDict();
      const restored = Character.fromDict(dict);
      assert.strictEqual(restored.name, 'Bob');
      assert.strictEqual(restored.consistency_weight, 0.8);
    });
  });

  describe('Shot', () => {
    test('should create shot with default values', () => {
      const shot = new Shot({ shot_number: 1 });
      assert.strictEqual(shot.shot_number, 1);
      assert.strictEqual(shot.template, 'T4_standard_medium');
    });

    test('should serialize and deserialize', () => {
      const shot = new Shot({ 
        shot_number: 1, 
        template: 'T6_closeup',
        description: 'Test shot' 
      });
      const dict = shot.toDict();
      const restored = Shot.fromDict(dict);
      assert.strictEqual(restored.shot_number, 1);
      assert.strictEqual(restored.template, 'T6_closeup');
      assert.strictEqual(restored.description, 'Test shot');
    });
  });

  describe('StoryboardProject', () => {
    test('should create project with default values', () => {
      const project = new StoryboardProject({ name: 'Test Project' });
      assert.strictEqual(project.name, 'Test Project');
      assert.strictEqual(project.aspect_ratio, '16:9');
      assert.ok(Array.isArray(project.characters));
      assert.ok(Array.isArray(project.scenes));
      assert.ok(Array.isArray(project.shots));
    });

    test('should get consistency prefix', () => {
      const project = new StoryboardProject({ 
        name: 'Test',
        style_config: {
          style_type: 'preset',
          style_name: 'Ghibli Studio',
          style_mode: 'preset'
        }
      });
      const prefix = project.getConsistencyPrefix();
      assert.ok(prefix.length > 0);
    });

    test('should serialize and deserialize', () => {
      const project = new StoryboardProject({ 
        name: 'Test',
        aspect_ratio: '16:9'
      });
      const dict = project.toDict();
      const restored = StoryboardProject.fromDict(dict);
      assert.strictEqual(restored.name, 'Test');
      assert.strictEqual(restored.aspect_ratio, '16:9');
    });
  });
});

describe('Schemas', () => {
  describe('BaseResponse', () => {
    test('should create base response', () => {
      const response = new BaseResponse(true, 'Success');
      assert.strictEqual(response.success, true);
      assert.strictEqual(response.message, 'Success');
    });

    test('should serialize to JSON', () => {
      const response = new BaseResponse(true, 'Success');
      const json = JSON.stringify(response);
      const parsed = JSON.parse(json);
      assert.strictEqual(parsed.success, true);
      assert.strictEqual(parsed.message, 'Success');
    });
  });

  describe('DataResponse', () => {
    test('should create data response', () => {
      const response = new DataResponse(true, 'Success', { key: 'value' });
      assert.strictEqual(response.success, true);
      assert.strictEqual(response.message, 'Success');
      assert.strictEqual(response.data.key, 'value');
    });
  });

  describe('ProjectCreate', () => {
    test('should validate valid project', () => {
      const projectCreate = new ProjectCreate('Test Project', '16:9');
      const validation = projectCreate.validate();
      assert.strictEqual(validation.valid, true);
    });

    test('should reject empty name', () => {
      const projectCreate = new ProjectCreate('', '16:9');
      const validation = projectCreate.validate();
      assert.strictEqual(validation.valid, false);
    });
  });

  describe('CharacterCreate', () => {
    test('should validate valid character', () => {
      const characterCreate = new CharacterCreate('Alice', 'Young woman');
      const validation = characterCreate.validate();
      assert.strictEqual(validation.valid, true);
    });

    test('should reject empty name', () => {
      const characterCreate = new CharacterCreate('', 'Description');
      const validation = characterCreate.validate();
      assert.strictEqual(validation.valid, false);
    });
  });
});

describe('Config', () => {
  test('should load settings', () => {
    assert.ok(settings.apiPort);
    assert.ok(settings.apiHost);
    assert.ok(settings.imageBackend);
  });

  test('should have baseDir', () => {
    assert.ok(settings.baseDir);
    assert.ok(typeof settings.baseDir === 'string');
  });

  test('should have paths', () => {
    assert.ok(settings.assetsDir);
    assert.ok(settings.projectsDir);
    assert.ok(settings.outputsDir);
  });
});
