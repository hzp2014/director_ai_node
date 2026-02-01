# 视频生成与AI对话功能补充任务文档

## 任务概述

参考 `/Users/jsonhuang/git/director_ai_copy/android` 安卓/Flutter项目的实现，将视频生成、AI对话、视频合并等核心功能补充到当前Node.js项目中。

## 功能对比分析

### 当前Node.js项目已实现的功能 ✅

1. **基础框架**
   - Express.js Web服务器
   - RESTful API接口
   - 配置管理（环境变量）
   - 日志系统
   - 文件上传处理

2. **数据模型** (`src/models.js`)
   - 角色模型
   - 场景模型
   - 镜头模型
   - 分镜项目模型
   - 风格配置

3. **提示词生成** (`src/promptGenerator.js`)
   - 镜头提示词生成
   - 标准提示词生成
   - 镜头模板建议

4. **图片生成** (`src/imageGenerator.js`)
   - API图片生成
   - ComfyUI图片生成

5. **智能导入** (`src/smartImport.js`)
   - 多格式文件导入
   - JSON/Markdown/HTML解析

### 从安卓项目需要补充的功能 ❌

1. **视频生成API集成**
   - 苍何/兔子API客户端
   - 视频生成接口（支持多图参考）
   - 视频轮询机制
   - 视频生成状态管理

2. **AI对话客户端**
   - GLM-4.7流式对话（智谱AI）
   - GLM-4.5V/豆包ARK图片分析
   - 提示词净化和重写
   - 思考过程处理

3. **剧本管理系统**
   - 剧本生成流程
   - 场景状态管理
   - 并发控制
   - 进度跟踪

4. **视频合并服务**
   - FFmpeg视频合并
   - 临时文件管理
   - 合并进度跟踪

5. **角色一致性管理**
   - 角色三视图生成
   - 角色特征提取
   - 跨场景人物一致性

## 详细实现任务

### 任务1: 视频生成API客户端 (`src/videoGenerator.js`)

**功能要求：**
- 实现视频生成API客户端（苍何/兔子API）
- 支持多图参考（最多3张）
- 支持多种视频模型（veo3.1、veo3.1-components、sora-1、sora-2-pro）
- 实现视频轮询机制
- 支持Mock模式用于测试

**API端点：**
- `POST /v1/videos` - 提交视频生成任务
- `GET /v1/videos/{taskId}` - 查询任务状态

**数据模型：**
```javascript
class VideoGenerationResponse {
  id              // 任务ID
  object          // 对象类型 "video"
  model           // 使用的模型
  status          // 状态: pending/processing/completed/failed
  progress        // 进度 0-100
  createdAt       // 创建时间戳
  seconds         // 视频时长
  videoUrl        // 视频URL（完成后）
  error           // 错误信息（失败时）
}
```

**环境变量：**
- `VIDEO_API_KEY` - 视频生成API密钥
- `VIDEO_API_BASE_URL` - API基础URL
- `VIDEO_MODEL` - 默认视频模型

**关键方法：**
```javascript
- generateVideo(prompt, imageUrls, seconds, model, sanitizePrompt)
- pollVideoStatus(taskId, timeout, interval, onProgress, isCancelled)
- isVideoCompleted(response)
- isVideoFailed(response)
```

---

### 任务2: AI对话客户端 (`src/aiClient.js`)

**功能要求：**
- 实现智谱GLM-4.7流式对话客户端
- 实现豆包ARK/GPT-4V图片分析客户端
- 支持工具调用（function calling）
- 处理思考过程（reasoning_content）
- 提示词净化和重写

**API端点：**
- 智谱AI: `https://open.bigmodel.cn/api/paas/v4/chat/completions`
- 豆包ARK: `https://ark.cn-beijing.volces.com/api/v3/chat/completions`

**数据模型：**
```javascript
class ChatMessage {
  role        // system/user/assistant
  content     // 消息内容
  reasoningContent? // 思考过程（智谱GLM-4.7）
  toolCalls?  // 工具调用
}

class StreamChunk {
  isContent      // 是否为内容块
  isReasoning    // 是否为思考过程
  text           // 文本内容
  toolCalls      // 工具调用
}
```

**环境变量：**
- `ZHIPU_API_KEY` - 智谱AI API密钥
- `DOUBAO_API_KEY` - 豆包ARK API密钥

**关键方法：**
```javascript
// 智谱GLM-4.7对话
- sendToGLMStream(messages, model, temperature, maxTokens)
- sendToGLM(messages, model, temperature, maxTokens)

// 豆包ARK图片分析
- analyzeImageForCharacter(imageBase64, mimeType)

// 提示词处理
- sanitizeVideoPrompt(prompt)
- rewriteVideoPromptForSafety(originalPrompt, sceneNarration)
```

---

### 任务3: 剧本管理服务 (`src/screenplayService.js`)

**功能要求：**
- 实现剧本生成流程控制器
- 场景状态管理
- 并发控制（可配置并发数）
- 进度跟踪和回调
- 失败重试机制

**数据模型：**
```javascript
enum ScreenplayStatus {
  drafting,      // 草稿阶段
  confirmed,     // 用户已确认
  generating,    // 正在生成
  completed,     // 全部完成
  failed         // 生成失败
}

enum SceneStatus {
  pending,           // 等待处理
  imageGenerating,   // 正在生成图片
  imageCompleted,    // 图片生成完成
  videoGenerating,   // 正在生成视频
  completed,         // 全部完成
  failed             // 失败
}

class Screenplay {
  taskId           // 任务ID
  scriptTitle      // 剧本标题
  scenes           // 场景列表
  status           // 剧本状态
}

class Scene {
  sceneId               // 场景ID
  narration             // 中文旁白
  imagePrompt           // 生图提示词
  videoPrompt           // 视频动效提示词
  characterDescription  // 人物特征描述
  imageUrl?             // 生成的图片URL
  videoUrl?             // 生成的视频URL
  status                // 场景状态
  customVideoPrompt?    // 自定义视频提示词
}
```

**关键方法：**
```javascript
// 剧本生成
- generateScreenplay(userPrompt, userImages, onProgress)
- generateFromConfirmed(confirmedScreenplay, userImages, characterImageUrls, onProgress)

// 场景管理
- updateScene(sceneId, updatedScene)
- getNextPendingScene()
- getNextSceneForVideo()
- retryScene(sceneId, onProgress, forceRegenerateImage)
- startSceneGeneration(sceneId, onProgress)
- startAllPendingScenesGeneration(onProgress)

// 进度管理
- get progress           // 总体进度 0.0-1.0
- get statusDescription   // 状态描述
- get isAllCompleted      // 是否全部完成
- get hasFailed           // 是否有失败
```

**环境变量：**
- `CONCURRENT_SCENES` - 并发场景数（默认3）

---

### 任务4: 视频合并服务 (`src/videoMerger.js`)

**功能要求：**
- 使用FFmpeg合并多个视频文件
- 无损视频合并
- 进度跟踪
- 临时文件管理

**环境变量：**
- `FFMPEG_PATH` - FFmpeg可执行文件路径（可选，默认使用系统PATH）

**关键方法：**
```javascript
- mergeVideos(inputPaths, outputPath, onProgress)
- mergeVideosLossless(inputPaths, outputPath)
- getMergedVideos()
- clearMergedVideos()
- getMergedVideosSize()
- getMergedVideosCount()
```

**依赖包：**
- 需要安装 `fluent-ffmpeg` 包

---

### 任务5: 配置更新 (`src/config.js`)

**新增配置项：**
```javascript
// API配置
zhipuApiKey           // 智谱AI API密钥
doubaoApiKey          // 豆包ARK API密钥
videoApiKey           // 视频生成API密钥

// API端点
zhipuApiBaseUrl        // 智谱AI API基础URL
doubaoApiBaseUrl       // 豆包ARK API基础URL
videoApiBaseUrl        // 视频生成API基础URL

// 模型配置
defaultChatModel       // 默认对话模型
defaultImageModel      // 默认图片分析模型
defaultVideoModel      // 默认视频模型

// 并发配置
concurrentScenes       // 并发场景数

// Mock模式
useMockVideoApi        // 是否使用Mock视频API
useMockChatApi         // 是否使用Mock对话API

// 视频合并
ffmpegPath             // FFmpeg路径
mergedVideosDir        // 合并视频目录
```

---

### 任务6: API路由扩展 (`src/app.js`)

**新增路由：**

```javascript
// 视频生成
POST /api/projects/:id/generate-video    // 生成单个场景视频
POST /api/projects/:id/generate-all-videos // 生成所有场景视频
GET  /api/video/status/:taskId            // 查询视频生成状态

// 剧本管理
POST /api/screenplay                       // 生成剧本
POST /api/screenplay/:id/confirm          // 确认剧本
POST /api/screenplay/:id/generate         // 生成图片和视频
POST /api/screenplay/:id/retry/:sceneId   // 重试场景
POST /api/screenplay/:id/start/:sceneId   // 手动触发场景生成
GET  /api/screenplay/:id/progress          // 获取生成进度

// 视频合并
POST /api/videos/merge                     // 合并视频
GET  /api/videos/merged                   // 获取合并视频列表
DELETE /api/videos/merged                  // 清理所有合并视频

// AI对话
POST /api/ai/chat                         // AI对话
POST /api/ai/analyze-image                 // 图片分析
POST /api/ai/rewrite-prompt                // 重写提示词

// 进度和取消
GET  /api/tasks/:taskId/progress           // 获取任务进度
POST /api/tasks/:taskId/cancel             // 取消任务
```

---

## 实现优先级

### P0 (核心功能 - 必须实现)
1. ✅ 视频生成API客户端 (`src/videoGenerator.js`)
2. ✅ AI对话客户端 (`src/aiClient.js`)
3. ✅ 剧本管理服务 (`src/screenplayService.js`)
4. ✅ 配置更新 (`src/config.js`)

### P1 (重要功能)
5. API路由扩展 (`src/app.js`)
6. 环境变量配置 (`.env.example`, `.env`)
7. 单元测试

### P2 (增强功能)
8. 视频合并服务 (`src/videoMerger.js`)
9. 角色三视图生成功能
10. 任务队列管理
11. 集成测试

## 技术细节

### 依赖包需求

```json
{
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2",  // 视频合并
    "axios": "^1.6.0",          // HTTP客户端（已有）
    "form-data": "^4.0.0",      // 表单数据（已有）
    "uuid": "^9.0.1"            // UUID生成（已有）
  }
}
```

### 环境变量配置 (.env.example)

```bash
# 智谱AI API配置
ZHIPU_API_KEY=your_zhipu_api_key_here
ZHIPU_API_BASE_URL=https://open.bigmodel.cn/api/paas/v4

# 豆包ARK API配置
DOUBAO_API_KEY=your_doubao_api_key_here
DOUBAO_API_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_IMAGE_MODEL=doubao-vision-pro-32k

# 视频生成API配置
VIDEO_API_KEY=your_video_api_key_here
VIDEO_API_BASE_URL=https://api.tuzi.ai/v1
VIDEO_MODEL=veo3.1-components
VIDEO_SIZE=1280x720
VIDEO_SECONDS=5

# 并发配置
CONCURRENT_SCENES=3

# Mock模式（测试用）
USE_MOCK_VIDEO_API=false
USE_MOCK_CHAT_API=false

# FFmpeg配置
FFMPEG_PATH=/usr/local/bin/ffmpeg
MERGED_VIDEOS_DIR=./outputs/merged_videos

# 角色一致性
CHARACTER_REFERENCE_COUNT=3
```

### 目录结构更新

```
src/
├── config.js              # ✅ 已存在，需要更新
├── models.js              # ✅ 已存在
├── schemas.js             # ✅ 已存在
├── templates.js           # ✅ 已存在
├── promptGenerator.js     # ✅ 已存在
├── imageGenerator.js      # ✅ 已存在
├── comfyuiClient.js       # ✅ 已存在
├── services.js            # ✅ 已存在，需要扩展
├── smartImport.js         # ✅ 已存在
├── app.js                 # ✅ 已存在，需要扩展
├── logger.js              # ✅ 已存在
├── setupWizard.js         # ✅ 已存在
│
├── 🆕 videoGenerator.js    # 视频生成API客户端
├── 🆕 aiClient.js          # AI对话客户端
├── 🆕 screenplayService.js # 剧本管理服务
└── 🆕 videoMerger.js       # 视频合并服务

test/
├── unit.test.js           # ✅ 已存在
└── 🆕 integration.test.js  # 集成测试
```

## 验收标准

### 功能验收
- [ ] 可以调用视频生成API生成视频
- [ ] 支持多图参考视频生成
- [ ] 视频轮询机制正常工作
- [ ] AI对话功能正常
- [ ] 图片分析功能正常
- [ ] 提示词净化和重写功能正常
- [ ] 剧本生成流程完整
- [ ] 场景状态管理正确
- [ ] 并发控制有效
- [ ] 进度跟踪准确

### 性能验收
- [ ] 视频生成响应时间 < 10s（提交任务）
- [ ] 视频轮询间隔合理（2-5s）
- [ ] 并发场景生成效率提升明显
- [ ] 内存使用合理（无内存泄漏）

### 稳定性验收
- [ ] 错误处理完善
- [ ] 失败重试机制有效
- [ ] 临时文件清理正确
- [ ] 资源释放完整

## 备注

1. **API安全**：所有API密钥必须通过环境变量配置，不要硬编码
2. **错误处理**：所有异步操作必须有适当的错误处理
3. **日志记录**：重要操作必须记录日志
4. **进度回调**：长时间任务必须提供进度回调
5. **取消支持**：长时间任务必须支持取消操作
6. **Mock模式**：提供Mock模式用于测试，避免频繁调用真实API
7. **向后兼容**：新功能不应破坏现有功能
8. **代码风格**：遵循现有代码风格和命名规范

## 参考资料

- 安卓项目路径：`/Users/jsonhuang/git/director_ai_copy/android`
- Flutter项目路径：`/Users/jsonhuang/git/director_ai_copy/lib`
- 关键文件：
  - `lib/services/api_service.dart` - API服务实现
  - `lib/controllers/screenplay_controller.dart` - 剧本控制器
  - `lib/models/screenplay.dart` - 剧本数据模型
  - `lib/services/video_merger_service.dart` - 视频合并服务
  - `app/src/main/kotlin/.../MainActivity.kt` - 原生视频合并实现
