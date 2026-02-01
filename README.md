# Node.js Platform - AI Director Storyboard

这是 AI 漫导 (DirectorAI) 项目的 Node.js 平台实现，对应原 Python/Gradio 版本 (web/)。

## 项目结构

```
/
├── package.json           # 项目依赖配置
├── .env.example          # 环境变量示例
├── .gitignore           # Git 忽略文件
├── README.md            # 本文档
├── PROGRESS.md          # 转写进度追踪
├── TODO.md              # 待办事项
└── src/
    ├── config.js        # ✅ 配置管理
    ├── models.js        # ✅ 数据模型
    ├── schemas.js       # ✅ API 请求/响应模型
    ├── templates.js     # ✅ 镜头模板定义
    ├── promptGenerator.js  # ✅ 提示词生成器
    ├── imageGenerator.js    # ✅ 图片生成器
    ├── comfyuiClient.js     # ✅ ComfyUI 客户端
    ├── smartImport.js       # ✅ 智能导入
    ├── services.js          # ✅ 业务逻辑层
    └── app.js              # ✅ 主应用入口
```

## 快速开始

### 方法一：使用 Setup Wizard（推荐）

运行交互式配置向导：

```bash
npm install
npm run setup
```

Setup Wizard 会引导您完成以下配置：
- 选择图片生成后端
- 配置服务器端口和主机
- 设置 ComfyUI 连接（如果使用）
- 保存配置到 .env 文件

### 方法二：手动配置

```bash
npm install
cp .env.example .env
# 编辑 .env 文件，填入你的 API 密钥等配置
```

### 运行开发服务器

```bash
npm run dev
```

### 运行生产服务器

```bash
npm start
```

### 运行测试

```bash
npm test
```

### 健康检查

服务器启动后，可以通过以下命令检查状态：

```bash
# 根路径 - 查看服务器信息和 API 端点
curl http://localhost:8000/

# 健康检查
curl http://localhost:8000/health

# 服务器状态
curl http://localhost:8000/api/status
```

## 功能特性

- ✅ 完整的数据模型（角色、场景、道具、风格等）
- ✅ 9 种专业镜头模板
- ✅ 环境变量配置管理
- ✅ API 请求/响应验证
- ✅ 完善的提示词生成器（支持标准提示词和自定义提示词）
- ✅ 图片生成（支持 API 和 ComfyUI）
- ✅ 完整的业务逻辑层（项目管理、角色管理、场景管理、镜头管理）
- ✅ 示例故事数据（咖啡厅邂逅、都市追逐、温馨家庭）
- ✅ ComfyUI 客户端（WebSocket 支持、工作流管理）
- ✅ 智能文档导入（支持 JSON、Markdown、HTML、TXT）
- ✅ 完整的 RESTful API 接口
- ✅ 文件上传处理
- ✅ 导出功能（JSON、TXT）
- ✅ 日志系统（支持文件日志、日志轮转、日志级别管理）
- ✅ 初始化向导（交互式配置）
- ✅ 单元测试（24 个测试全部通过）

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **依赖**:
  - `express` - Web 框架
  - `cors` - 跨域支持
  - `dotenv` - 环境变量
  - `axios` - HTTP 客户端
  - `multer` - 文件上传
  - `sharp` - 图片处理
  - `uuid` - 唯一标识符生成
  - `ws` - WebSocket 客户端

## 与 Python 版本对照

| Python 文件 | Node.js 文件 | 状态 |
|------------|--------------|------|
| settings.py | config.js | ✅ 完成 |
| models.py | models.js | ✅ 完成 |
| schemas.py | schemas.js | ✅ 完成 |
| templates.py | templates.js | ✅ 完成 |
| prompt_generator.py | promptGenerator.js | ✅ 完成 |
| image_generator.py | imageGenerator.js | ✅ 完成 |
| comfyui_client.py | comfyuiClient.js | ✅ 完成 |
| smart_import.py | smartImport.js | ✅ 完成 |
| services.py | services.js | ✅ 完成 |
| app.py | app.js | ✅ 完成 |
| setup_wizard.py | setupWizard.js | ✅ 完成 |
| - | logger.js | ✅ 完成 |
| - | test/unit.test.js | ✅ 完成 |

## 进度概览

- **总体进度**: 100% (12/12)
- **核心功能**: 已完成
- **API 路由**: 已完成（完整 CRUD 接口）
- **测试**: 已完成（24 个单元测试全部通过）
- **文档**: 已完成

详细进度请查看 [PROGRESS.md](./PROGRESS.md) 和 [TODO.md](./TODO.md)。

## API 接口

### 基础接口
- `GET /` - 服务器信息和 API 端点导航
- `GET /health` - 健康检查
- `GET /api/status` - 服务器状态
- `GET /api/examples` - 获取示例列表

### 项目管理
- `GET /api/projects` - 获取当前项目信息
- `POST /api/projects` - 创建项目
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目
- `PUT /api/projects/:id/style` - 设置项目风格
- `POST /api/projects/:id/load-example` - 加载示例故事

### 角色管理
- `GET /api/projects/:id/characters` - 获取角色列表
- `POST /api/projects/:id/characters` - 添加角色
- `DELETE /api/projects/:id/characters/:charId` - 删除角色

### 场景管理
- `GET /api/projects/:id/scenes` - 获取场景列表
- `POST /api/projects/:id/scenes` - 添加场景
- `DELETE /api/projects/:id/scenes/:sceneId` - 删除场景

### 镜头管理
- `GET /api/projects/:id/shots` - 获取镜头列表
- `POST /api/projects/:id/shots` - 添加镜头
- `PUT /api/projects/:id/shots/:shotNum` - 更新镜头
- `DELETE /api/projects/:id/shots/:shotNum` - 删除镜头
- `PUT /api/projects/:id/shots/:shotNum/move` - 移动镜头顺序

### 生成功能
- `POST /api/projects/:id/shots/:shotNum/generate` - 生成单个镜头
- `POST /api/projects/:id/generate-all` - 批量生成所有镜头

### 导入导出
- `POST /api/import` - 导入文件（支持 JSON、Markdown、HTML、TXT）
- `POST /api/export` - 导出项目（支持 JSON、TXT）

## 开发指南

### 添加新的模型

在 `src/models.js` 中定义类，确保包含：
- 构造函数和默认值
- `toDict()` 方法 - 序列化为对象
- `static fromDict(data)` 方法 - 从对象反序列化

### 添加新的 API 路由

在 `src/app.js` 中使用 Express 路由：
```javascript
router.get('/endpoint', async (req, res) => {
  try {
    const result = await someService.doSomething();
    res.json(new DataResponse(true, 'Success', result));
  } catch (error) {
    res.status(500).json(new BaseResponse(false, error.message));
  }
});
```

### 使用配置

```javascript
import settings from './config.js';

const apiKey = settings.apiKey;
const outputsDir = settings.outputsDir;
```

### 使用服务

```javascript
import { services } from './services.js';

// 创建项目
services.project.createProject('我的项目', '16:9');

// 添加角色
services.character.addCharacter('张三', '年轻男子，戴眼镜');

// 添加镜头
services.shot.addShot('中景', '描述文本');

// 生成图片
await services.generation.generateShot(1);
```

## 注意事项

1. **ES Modules**: 项目使用 ES 模块（`import`/`export`），确保 `package.json` 中有 `"type": "module"`
2. **文件路径**: 使用 `path` 模块处理路径，避免硬编码
3. **错误处理**: 所有异步操作都应该有适当的错误处理
4. **环境变量**: 敏感信息（如 API 密钥）必须通过环境变量配置

## 贡献指南

欢迎贡献代码！请确保：
1. 遵循现有的代码风格
2. 添加必要的注释（中文）
3. 更新相关文档
4. 测试新功能

## 下一步计划

1. 实现 setupWizard.js（可选）
2. 添加单元测试和集成测试
3. 完善文档和示例
4. 性能优化
5. 支持更多文件格式导入（PDF、DOCX）

## 许可证

MIT License

