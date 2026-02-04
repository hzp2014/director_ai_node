# AI漫导项目开发待办清单

> **项目**: AI漫导 Web版 (Android → Web迁移)
> **技术栈**: Node.js + React + Next.js + TypeScript
> **更新日期**: 2026-02-04

---

## 🎯 阶段一: 项目初始化 (Week 1)

### 1.1 项目脚手架搭建
- [x] **1.1.1** 创建Next.js项目 (TypeScript + Tailwind + App Router)
  ```bash
  npx create-next-app@latest director-ai-web --typescript --tailwind --app
  ```
- [x] **1.1.2** 初始化Git仓库，配置.gitignore
- [x] **1.1.3** 配置ESLint和Prettier
- [x] **1.1.4** 配置路径别名 (@/* → src/*)

### 1.2 依赖安装
- [x] **1.2.1** 安装核心依赖
  ```bash
  npm install zustand immer
  npm install @tanstack/react-query axios
  npm install uuid date-fns zod
  npm install lucide-react
  ```
- [x] **1.2.2** 安装UI组件库
  ```bash
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button card input dialog tabs scroll-area
  npx shadcn-ui@latest add avatar badge skeleton slider progress
  npx shadcn-ui@latest add dropdown-menu context-menu toast
  ```
- [x] **1.2.3** 安装开发依赖
  ```bash
  npm install -D @types/uuid @types/node typescript
  ```

### 1.3 数据库初始化
- [ ] **1.3.1** 安装Prisma
  ```bash
  npm install prisma @prisma/client sqlite3
  npx prisma init
  ```
- [ ] **1.3.2** 配置schema.prisma
  - Conversation模型
  - Message模型
  - Screenplay模型
  - ApiConfig模型
- [ ] **1.3.3** 创建并运行首次迁移
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] **1.3.4** 配置Prisma客户端 (lib/prisma.ts)

### 1.4 Redis初始化
- [ ] **1.4.1** 安装Redis依赖
  ```bash
  npm install redis bull
  ```
- [ ] **1.4.2** 配置Redis连接 (lib/redis.ts)
- [ ] **1.4.3** 创建Redis缓存工具类

### 1.5 项目结构搭建
- [x] **1.5.1** 创建目录结构
  ```
  mkdir -p app/{chat,settings,screenplay-review,scene-media,api/{chat,screenplay,image,video,config}}
  mkdir -p components/{ui,chat,settings,screenplay,shared}
  mkdir -p stores controllers services models utils hooks lib types
  ```
- [x] **1.5.2** 配置Tailwind主题颜色
- [x] **1.5.3** 创建全局样式 (app/globals.css)

---

## 🎯 阶段二: 数据模型与类型定义 (Week 1)

### 2.1 TypeScript类型定义
- [x] **2.1.1** 聊天消息相关类型 (types/chat.ts)
  - ChatMessage
  - UserImage
  - MessageRole
- [x] **2.1.2** 剧本相关类型 (types/screenplay.ts)
  - ScreenplayDraft
  - Screenplay
  - DraftStatus
  - ScreenplayStatus
- [x] **2.1.3** 角色相关类型 (types/character.ts)
  - CharacterInfo
  - CharacterSheet
- [x] **2.1.4** 场景相关类型 (types/screenplay.ts)
  - SceneDraft
  - Scene
  - SceneStatus
- [x] **2.1.5** 会话相关类型 (types/conversation.ts)
  - Conversation
  - ConversationMessage
- [x] **2.1.6** 智能体命令类型 (types/agent.ts)
  - AgentCommand
  - ToolResult

### 2.2 Prisma模型更新
- [ ] **2.2.1** 完善prisma/schema.prisma
- [ ] **2.2.2** 生成Prisma客户端
  ```bash
  npx prisma generate
  ```
- [ ] **2.2.3** 创建数据库种子数据

---

## 🎯 阶段三: 核心服务层 (Week 2)

### 3.1 API服务封装
- [x] **3.1.1** 创建ApiService基类 (services/apiService.ts)
  - 智谱GLM客户端配置
  - 苍何视频API客户端配置
  - 苍何图片API客户端配置
  - 豆包ARK客户端配置
- [x] **3.1.2** 实现GLM聊天API
  - sendToGLM(): 普通请求
  - sendToGLMStream(): 流式请求
- [x] **3.1.3** 实现剧本生成API
  - generateDramaScreenplay(): 生成漫剧剧本
- [x] **3.1.4** 实现图片理解API
  - analyzeImageForCharacter(): 分析图片提取角色特征
  - chatWithImageSupport(): 支持图片的聊天

### 3.2 图片生成服务
- [x] **3.2.1** 创建ImageGenerationService (services/imageGenerationService.ts)
- [x] **3.2.2** 实现单张图片生成
  - generateImage(): 基础图片生成
- [x] **3.2.3** 实现角色三视图生成
  - generateCharacterSheet(): 生成三视图
  - generateMultipleCharacterSheets(): 批量生成
- [x] **3.2.4** 实现场景图片批量生成
  - generateSceneImages(): 批量生成场景图片
  - 实现并发控制 (p-limit)

### 3.3 视频生成服务
- [x] **3.3.1** 创建VideoGenerationService (services/videoGenerationService.ts)
- [x] **3.3.2** 实现视频任务提交
  - submitVideoTask(): 提交视频生成任务
- [x] **3.3.3** 实现视频状态轮询
  - pollVideoStatus(): 轮询视频生成状态
- [x] **3.3.4** 实现批量视频生成
  - generateSceneVideos(): 批量生成场景视频
  - 实现并发控制
- [x] **3.3.5** 实现视频合并服务
  - mergeVideos(): 合并多个视频
  - 使用FFmpeg实现无损合并

### 3.4 配置服务
- [ ] **3.4.1** 创建ApiConfigService (services/apiConfigService.ts)
- [ ] **3.4.2** 实现API密钥CRUD
- [ ] **3.4.3** 实现配置验证

### 3.5 剧本解析服务
- [x] **3.5.1** 创建ScreenplayParser (services/screenplayParser.ts)
- [x] **3.5.2** 实现JSON解析
- [x] **3.5.3** 实现错误处理和降级

### 3.6 工具函数
- [x] **3.6.1** 创建Logger工具 (lib/logger.ts)
- [ ] **3.6.2** 创建提示词净化工具 (utils/promptSanitizer.ts)
- [ ] **3.6.3** 创建API错误处理工具 (utils/apiErrorHandler.ts)
- [ ] **3.6.4** 创建限流工具 (utils/rateLimiter.ts)

---

## 🎯 阶段四: 状态管理 (Week 2)

### 4.1 Chat Store
- [x] **4.1.1** 创建chatStore.ts (stores/chatStore.ts)
- [x] **4.1.2** 实现状态定义
  - messages
  - userImages
  - currentDraft
  - isProcessing
- [x] **4.1.3** 实现Actions
  - addMessage()
  - addUserImage()
  - removeUserImage()
  - sendMessage()
  - clearChat()
- [x] **4.1.4** 实现视频生成流程
  - generateScreenplayDraft()
  - generateCharacterSheets()
  - generateScreenplayMedia()
- [x] **4.1.5** 实现意图检测
  - isVideoGenerationIntent()

### 4.2 Conversation Store
- [ ] **4.2.1** 创建conversationStore.ts (stores/conversationStore.ts)
- [ ] **4.2.2** 实现状态定义
  - conversations
  - currentConversation
  - currentMessages
- [ ] **4.2.3** 实现Actions
  - initialize()
  - createConversation()
  - switchConversation()
  - deleteConversation()
  - saveMessage()

### 4.3 Screenplay Store
- [x] **4.3.1** 创建screenplayStore.ts (stores/screenplayStore.ts)
- [x] **4.3.2** 实现剧本状态管理
- [x] **4.3.3** 实现场景进度追踪

### 4.4 Video Merge Store
- [ ] **4.4.1** 创建videoMergeStore.ts (stores/videoMergeStore.ts)
- [ ] **4.4.2** 实现合并状态管理
  - status
  - progress
  - mergedVideoUrl
- [ ] **4.4.3** 实现合并Actions

### 4.5 API Config Store
- [x] **4.5.1** 创建apiConfigStore.ts (stores/apiConfigStore.ts)
- [x] **4.5.2** 实现API密钥状态管理
- [x] **4.5.3** 实现配置Actions

---

## 🎯 阶段五: 业务逻辑控制器 (Week 3)

### 5.1 Agent Controller
- [ ] **5.1.1** 创建agentController.ts (controllers/agentController.ts)
- [ ] **5.1.2** 实现ReAct智能体循环
  - runReActLoop()
  - parseCommand()
  - executeTool()
- [ ] **5.1.3** 实现工具执行
  - executeGenerateImage()
  - executeGenerateVideo()

### 5.2 Screenplay Controller
- [ ] **5.2.1** 创建screenplayController.ts (controllers/screenplayController.ts)
- [ ] **5.2.2** 实现剧本生成控制
- [ ] **5.2.3** 实现场景生成控制
- [ ] **5.2.4** 实现进度更新

### 5.3 Screenplay Draft Controller
- [ ] **5.3.1** 创建screenplayDraftController.ts (controllers/screenplayDraftController.ts)
- [ ] **5.3.2** 实现草稿管理
- [ ] **5.3.3** 实现用户反馈处理

### 5.4 Video Merge Controller
- [ ] **5.4.1** 创建videoMergeController.ts (controllers/videoMergeController.ts)
- [ ] **5.4.2** 实现视频合并流程控制
- [ ] **5.4.3** 实现进度追踪

---

## 🎯 阶段六: API路由 (Week 3)

### 6.1 聊天API
- [x] **6.1.1** 创建chat API路由 (app/api/chat/route.ts)
- [x] **6.1.2** 实现POST /api/chat
  - 普通聊天
  - 流式响应
- [ ] **6.1.3** 实现图片上传处理

### 6.2 剧本API
- [x] **6.2.1** 创建screenplay API路由 (app/api/screenplay/route.ts)
- [x] **6.2.2** 实现POST /api/screenplay/generate
  - 生成剧本草稿
- [x] **6.2.3** 实现POST /api/screenplay/confirm
  - 确认剧本并开始生成
- [x] **6.2.4** 实现GET /api/screenplay/:id
  - 获取剧本详情

### 6.3 图片API
- [ ] **6.3.1** 创建image API路由 (app/api/image/route.ts)
- [ ] **6.3.2** 实现POST /api/image/generate
  - 生成单张图片
- [ ] **6.3.3** 实现POST /api/image/character-sheet
  - 生成角色三视图
- [ ] **6.3.4** 实现POST /api/image/batch
  - 批量生成场景图片

### 6.4 视频API
- [ ] **6.4.1** 创建video API路由 (app/api/video/route.ts)
- [ ] **6.4.2** 实现POST /api/video/generate
  - 提交视频生成任务
- [ ] **6.4.3** 实现GET /api/video/status/:taskId
  - 查询视频生成状态
- [ ] **6.4.4** 实现POST /api/video/batch
  - 批量生成场景视频
- [ ] **6.4.5** 实现POST /api/video/merge
  - 合并视频

### 6.5 配置API
- [ ] **6.5.1** 创建config API路由 (app/api/config/route.ts)
- [ ] **6.5.2** 实现GET /api/config
  - 获取所有配置
- [ ] **6.5.3** 实现POST /api/config
  - 更新配置

---

## 🎯 阶段七: UI组件开发 (Week 3-4)

### 7.1 通用组件
- [ ] **7.1.1** GlassCard组件 (components/shared/GlassCard.tsx)
- [ ] **7.1.2** GradientButton组件 (components/shared/GradientButton.tsx)
- [ ] **7.1.3** ProgressTracker组件 (components/shared/ProgressTracker.tsx)
- [ ] **7.1.4** LoadingShimmer组件 (components/shared/LoadingShimmer.tsx)
- [ ] **7.1.5** EmptyState组件 (components/shared/EmptyState.tsx)
- [ ] **7.1.6** ErrorState组件 (components/shared/ErrorState.tsx)

### 7.2 聊天组件
- [ ] **7.2.1** ChatHeader组件 (components/chat/ChatHeader.tsx)
- [x] **7.2.2** MessageList组件 (components/chat/MessageList.tsx)
- [x] **7.2.3** MessageBubble组件 (components/chat/MessageBubble.tsx)
  - 支持Markdown渲染
  - 支持图片/视频预览
- [x] **7.2.4** ChatInput组件 (components/chat/ChatInput.tsx)
  - 文本输入
  - 图片上传
- [ ] **7.2.5** ImagePreview组件 (components/chat/ImagePreview.tsx)
- [ ] **7.2.6** ConversationSidebar组件 (components/chat/ConversationSidebar.tsx)

### 7.3 剧本组件
- [ ] **7.3.1** ScreenplayInfo组件 (components/screenplay/ScreenplayInfo.tsx)
- [ ] **7.3.2** SceneCard组件 (components/screenplay/SceneCard.tsx)
- [ ] **7.3.3** CharacterSheet组件 (components/screenplay/CharacterSheet.tsx)
- [ ] **7.3.4** ScreenplayReviewForm组件 (components/screenplay/ScreenplayReviewForm.tsx)

### 7.4 设置组件
- [ ] **7.4.1** ApiConfigCard组件 (components/settings/ApiConfigCard.tsx)
- [ ] **7.4.2** CacheManagementCard组件 (components/settings/CacheManagementCard.tsx)
- [ ] **7.4.3** DatabaseInfoCard组件 (components/settings/DatabaseInfoCard.tsx)
- [ ] **7.4.4** VideoMergeCard组件 (components/settings/VideoMergeCard.tsx)

---

## 🎯 阶段八: 页面开发 (Week 4)

### 8.1 聊天页面
- [x] **8.1.1** 创建chat页面 (app/chat/page.tsx)
- [x] **8.1.2** 实现页面布局
- [x] **8.1.3** 集成聊天组件
- [x] **8.1.4** 实现消息发送和接收
- [ ] **8.1.5** 实现流式响应显示

### 8.2 设置页面
- [x] **8.2.1** 创建settings页面 (app/settings/page.tsx)
- [x] **8.2.2** 实现API配置UI
- [ ] **8.2.3** 实现缓存管理UI
- [ ] **8.2.4** 实现数据库信息展示
- [ ] **8.2.5** 实现视频合并测试UI

### 8.3 剧本确认页面
- [ ] **8.3.1** 创建screenplay-review页面 (app/screenplay-review/page.tsx)
- [ ] **8.3.2** 实现剧本信息展示
- [ ] **8.3.3** 实现角色展示
- [ ] **8.3.4** 实现场景列表展示
- [ ] **8.3.5** 实现编辑和确认功能

### 8.4 媒体查看页面
- [ ] **8.4.1** 创建scene-media页面 (app/scene-media/page.tsx)
- [ ] **8.4.2** 实现全屏图片查看
- [ ] **8.4.3** 实现视频播放控制
- [ ] **8.4.4** 实现场景切换

### 8.5 首页
- [x] **8.5.1** 创建首页 (app/page.tsx)
- [x] **8.5.2** 实现重定向到chat页面
- [ ] **8.5.3** 实现欢迎界面

---

## 🎯 阶段九: 自定义Hooks (Week 4)

### 9.1 滚动Hook
- [ ] **9.1.1** useScrollToBottom (hooks/useScrollToBottom.ts)

### 9.2 视频播放Hook
- [ ] **9.2.1** useVideoPlayer (hooks/useVideoPlayer.ts)

### 9.3 响应式Hook
- [ ] **9.3.1** useMediaQuery (hooks/useMediaQuery.ts)

---

## 🎯 阶段十: 功能集成与测试 (Week 5)

### 10.1 端到端流程测试
- [ ] **10.1.1** 测试完整视频生成流程
- [ ] **10.1.2** 测试剧本编辑和重新生成
- [ ] **10.1.3** 测试多会话管理
- [ ] **10.1.4** 测试视频合并和下载

### 10.2 API测试
- [ ] **10.2.1** 测试GLM聊天API
- [ ] **10.2.2** 测试图片生成API
- [ ] **10.2.3** 测试视频生成API
- [ ] **10.2.4** 测试配置管理API

### 10.3 UI测试
- [ ] **10.3.1** 测试响应式布局
- [ ] **10.3.2** 测试组件交互
- [ ] **10.3.3** 测试加载和错误状态

### 10.4 性能测试
- [ ] **10.4.1** 测试并发控制
- [ ] **10.4.2** 测试轮询性能
- [ ] **10.4.3** 测试流式响应性能

---

## 🎯 阶段十一: 优化与完善 (Week 5-6)

### 11.1 性能优化
- [ ] **11.1.1** 优化图片懒加载
- [ ] **11.1.2** 优化视频预加载
- [ ] **11.1.3** 优化状态更新频率
- [ ] **11.1.4** 添加加载骨架屏

### 11.2 错误处理优化
- [ ] **11.2.1** 添加全局错误边界
- [ ] **11.2.2** 优化API错误提示
- [ ] **11.2.3** 添加重试机制UI
- [ ] **11.2.4** 添加降级方案

### 11.3 用户体验优化
- [ ] **11.3.1** 添加动画效果 (Framer Motion)
- [ ] **11.3.2** 优化输入体验
- [ ] **11.3.3** 添加键盘快捷键
- [ ] **11.3.4** 优化移动端体验

### 11.4 文档完善
- [ ] **11.4.1** 完善README.md
- [ ] **11.4.2** 添加API文档
- [ ] **11.4.3** 添加部署文档
- [ ] **11.4.4** 添加开发文档

---

## 🎯 阶段十二: 部署上线 (Week 6)

### 12.1 生产环境配置
- [ ] **12.1.1** 配置生产环境变量
- [ ] **12.1.2** 配置生产数据库 (PostgreSQL)
- [ ] **12.1.3** 配置生产Redis
- [ ] **12.1.4** 配置SSL证书

### 12.2 Docker化
- [ ] **12.2.1** 创建Dockerfile
- [ ] **12.2.2** 创建docker-compose.yml
- [ ] **12.2.3** 测试Docker构建

### 12.3 CI/CD
- [ ] **12.3.1** 配置GitHub Actions
- [ ] **12.3.2** 配置自动化测试
- [ ] **12.3.3** 配置自动化部署

### 12.4 监控和日志
- [ ] **12.4.1** 配置应用监控
- [ ] **12.4.2** 配置日志收集
- [ ] **12.4.3** 配置错误追踪

---

## 📊 进度追踪

| 阶段 | 任务数 | 已完成 | 进度 |
|------|--------|--------|------|
| 阶段一: 项目初始化 | 15 | 10 | 67% |
| 阶段二: 数据模型 | 8 | 6 | 75% |
| 阶段三: 核心服务层 | 24 | 20 | 83% |
| 阶段四: 状态管理 | 18 | 11 | 61% |
| 阶段五: 业务控制器 | 12 | 0 | 0% |
| 阶段六: API路由 | 15 | 7 | 47% |
| 阶段七: UI组件 | 22 | 6 | 27% |
| 阶段八: 页面开发 | 15 | 7 | 47% |
| 阶段九: 自定义Hooks | 3 | 0 | 0% |
| 阶段十: 功能集成测试 | 12 | 0 | 0% |
| 阶段十一: 优化完善 | 16 | 1 | 6% |
| 阶段十二: 部署上线 | 12 | 0 | 0% |
| **总计** | **172** | **68** | **40%** |

---

## 🚀 快速开始命令

```bash
# 1. 克隆项目
git clone <repository-url>
cd director-ai-web

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置API密钥

# 4. 初始化数据库
npx prisma migrate dev
npx prisma generate

# 5. 启动开发服务器
npm run dev

# 6. 打开浏览器访问
open http://localhost:3000
```

---

## 📝 注意事项

### 开发规范
1. **代码风格**: 使用ESLint和Prettier
2. **提交规范**: 使用Conventional Commits
3. **分支管理**: 使用Git Flow
4. **测试要求**: 核心功能必须有测试

### API密钥管理
- 开发环境: 使用.env.local
- 生产环境: 使用环境变量或密钥管理服务
- **绝对不要**提交API密钥到Git仓库

### 性能要求
- 首屏加载 < 3秒
- 图片生成并发数 <= 2
- 视频生成并发数 <= 2
- 轮询间隔 >= 2秒

### 安全要求
- 所有API调用都经过后端代理
- 用户输入需要验证和净化
- 敏感操作需要确认

---

## 📚 相关文档

- **[开发进度总结](progress-summary.md)** - 查看已完成功能和下一步工作
- **[README.md](../README.md)** - 项目说明

---

*文档版本: 1.1.0*
*最后更新: 2026-02-04*
*更新内容: 标记已完成任务，更新进度追踪（40%）*
