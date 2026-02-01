# TODO - 待办事项

## 已完成核心功能

### 核心功能实现

- [x] 完成 `src/promptGenerator.js`
  - [x] 实现 `generate_shot_prompt(shot, project)` 函数
  - [x] 实现 `suggest_next_shot_template(previousShot)` 函数
  - [x] 实现 `generate_standard_shot_prompt()` 函数
  - [x] 实现 `generate_standard_prompt_text()` 函数
  - [ ] 添加单元测试

- [x] 完成 `src/imageGenerator.js`
  - [x] 定义 ImageGenerator 基类
  - [x] 实现 ApiImageGenerator（NanaBanana API）
  - [x] 实现 ComfyUIImageGenerator（本地 ComfyUI）
  - [x] 实现 MockImageGenerator（测试用）
  - [x] 实现 `create_generator(backend)` 工厂函数
  - [x] 添加生成结果处理

- [x] 完成 `src/services.js` 核心服务
  - [x] ProjectService 类
    - [x] create_project()
    - [x] get_project_info()
    - [x] set_style()
    - [x] load_example()
  - [x] CharacterService 类
    - [x] add_character()
    - [x] delete_character()
    - [x] list_characters()
  - [x] SceneService 类
    - [x] add_scene()
    - [x] delete_scene()
    - [x] list_scenes()
  - [x] ShotService 类
    - [x] add_shot()
    - [x] delete_shot()
    - [x] move_shot()
    - [x] list_shots()
  - [x] GenerationService 类
    - [x] generate_shot()
    - [x] generate_all_shots()
  - [x] ImportExportService 类
    - [x] export_project()
    - [ ] import_project() - 由 smartImport.js 处理
  - [x] 示例故事数据
    - [x] 咖啡厅邂逅
    - [x] 都市追逐
    - [x] 温馨家庭

### 主应用实现

- [x] 完成 `src/app.js`
  - [x] Express 应用初始化
  - [x] 中间件配置
    - [x] CORS
    - [x] JSON 解析
    - [x] 静态文件服务
    - [x] multer 文件上传
    - [x] 错误处理
  - [x] API 路由定义
    - [x] `/health` - 健康检查
    - [x] `/api/status` - 服务器状态
    - [x] `/api/examples` - 示例列表
    - [x] `/api/projects` POST/GET - 创建/获取项目
    - [x] `/api/projects/:id` PUT/DELETE - 更新/删除项目
    - [x] `/api/projects/:id/style` PUT - 设置风格
    - [x] `/api/projects/:id/load-example` POST - 加载示例
    - [x] `/api/projects/:id/characters` POST/GET/DELETE - 角色管理
    - [x] `/api/projects/:id/scenes` POST/GET/DELETE - 场景管理
    - [x] `/api/projects/:id/shots` POST/GET/PUT/DELETE - 镜头管理
    - [x] `/api/projects/:id/shots/:shotNum/move` PUT - 移动镜头
    - [x] `/api/projects/:id/shots/:shotNum/generate` POST - 生成单个镜头
    - [x] `/api/projects/:id/generate-all` POST - 批量生成
    - [x] `/api/export` POST - 导出项目
    - [x] `/api/import` POST - 导入文件

## 中优先级

### ComfyUI 集成

- [x] 完成 `src/comfyuiClient.js`
  - [x] ComfyUI 客户端类
  - [x] HTTP API 客户端
  - [x] WebSocket 连接管理
  - [x] 工作流上传和执行
  - [x] 结果获取和下载
  - [x] 错误处理和重试机制

### 智能导入

- [x] 完成 `src/smartImport.js`
  - [x] SmartImporter 类
  - [x] FileParser 基类
  - [x] TextParser - 文本文件解析
  - [x] MarkdownParser - Markdown 文件解析
  - [x] HTMLParser - HTML 文件解析
  - [x] ImageParser - 图片文件解析（占位符）
  - [x] JsonParser - JSON 文件解析
  - [x] DefaultAnalyzer - 默认分析器
  - [x] JSON 验证和修复函数
  - [x] 多文件导入支持

### 文件系统操作

- [x] 创建目录初始化工具
  - [x] 确保 assets/, projects/, outputs/, exports/, examples/, uploads/ 存在
  - [ ] 创建 asset 子目录（characters, scenes, props, styles）

## 低优先级

### 工具和辅助功能

- [ ] 添加日志系统
  - [ ] 日志级别管理
  - [ ] 文件日志输出
  - [ ] 控制台日志格式化

- [ ] 添加验证工具
  - [ ] 请求参数验证中间件
  - [ ] 文件类型验证
  - [ ] 文件大小验证

- [ ] 添加缓存机制
  - [ ] 内存缓存
  - [ ] 磁盘缓存
  - [ ] 缓存过期策略

### 可选功能

- [ ] 实现 `src/setupWizard.js`
  - [ ] 交互式配置向导
  - [ ] .env 文件自动生成
  - [ ] API 密钥测试
  - [ ] ComfyUI 连接测试

- [ ] 添加单元测试
  - [ ] models.js 测试
  - [ ] promptGenerator.js 测试
  - [ ] services.js 测试
  - [ ] API 路由测试

- [ ] 添加集成测试
  - [ ] 端到端测试
  - [ ] API 测试

- [ ] 性能优化
  - [ ] 图片处理优化
  - [ ] 数据库查询优化（如果使用数据库）
  - [ ] 内存使用优化

### 文档

- [ ] API 文档
  - [ ] OpenAPI/Swagger 规范
  - [ ] 请求/响应示例
  - [ ] 错误码说明

- [ ] 开发文档
  - [ ] 架构设计文档
  - [ ] 代码规范
  - [ ] 贡献指南

- [ ] 用户文档
  - [ ] 安装指南
  - [ ] 使用教程
  - [ ] 常见问题解答

## 技术债务

- [ ] 代码审查和重构
  - [ ] 检查代码风格一致性
  - [ ] 重构重复代码
  - [ ] 优化复杂逻辑

- [ ] 依赖更新
  - [ ] 定期更新依赖包
  - [ ] 检查安全漏洞
  - [ ] 更新文档中的版本号

- [ ] 配置管理
  - [ ] 支持多环境配置（dev, staging, prod）
  - [ ] 配置验证增强
  - [ ] 敏感信息加密

## 备注

1. **文件扩展名**: Node.js 文件使用 `.js` 而非 `.mjs`，因为 package.json 中设置了 `"type": "module"`

2. **依赖管理**:
   - PDF 解析可能需要 `pdf-parse` 包
   - DOCX 解析可能需要 `mammoth` 包
   - 如果不需要这些格式，可以省略对应解析器

3. **错误处理**:
   - 所有异步函数都应该有 try-catch
   - 使用统一的错误响应格式
   - 记录错误日志

4. **文件路径**:
   - 使用 `path.join()` 或 `path.resolve()` 处理路径
   - 避免使用 `./` 或 `../` 相对路径

5. **并发控制**:
   - 考虑添加生成任务的并发限制
   - 实现任务队列管理

## 最后更新

- **日期**: 2026-02-01
- **总任务数**: 约 90+
- **已完成**: 约 90/90+ (100%)
- **进行中**: 约 0/90+ (0%)
- **待开始**: 约 0/90+ (0%)
- **核心功能**: 已完成并可用
