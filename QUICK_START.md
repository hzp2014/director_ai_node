# 快速入门指南

## 首次使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少配置：
```env
IMAGE_BACKEND=mock  # 初次测试使用 mock
API_PORT=8000
API_HOST=0.0.0.0
```

### 3. 启动服务器

```bash
npm start
```

你应该看到类似输出：
```
==================================================
AI Storyboard Pro - Node.js Platform
==================================================

🚀 服务器已启动
📍 地址: http://0.0.0.0:8000
🔧 后端: mock
🐛 调试模式: 关闭

📁 目录配置:
   Assets: /path/to/assets
   Projects: /path/to/projects
   Outputs: /path/to/outputs
   Exports: /path/to/exports
   Uploads: /path/to/uploads

==================================================
```

### 4. 测试服务器

打开新终端，运行：

```bash
# 健康检查
curl http://localhost:8000/health

# 获取服务器状态
curl http://localhost:8000/api/status

# 获取示例列表
curl http://localhost:8000/api/examples

# 创建项目
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "我的项目", "aspect_ratio": "16:9"}'
```

## 常用命令

### 开发模式（自动重启）

```bash
npm run dev
```

### 生产模式

```bash
npm start
```

### 查看项目结构

```bash
ls -la src/
ls -la
```

### 查看进度和待办

```bash
cat README.md       # 项目说明
cat PROGRESS.md     # 转写进度
cat TODO.md         # 待办事项
cat MIGRATION_SUMMARY.md  # 迁移总结
```

## 项目结构速查

```
/
├── src/
│   ├── app.js              # ✅ 主应用入口（Express 服务器）
│   ├── config.js           # ✅ 配置管理
│   ├── models.js           # ✅ 数据模型（26KB+）
│   ├── schemas.js          # ✅ API 请求/响应模型
│   ├── templates.js        # ✅ 9 种镜头模板
│   ├── promptGenerator.js  # ✅ 提示词生成
│   ├── imageGenerator.js   # ✅ 图片生成器
│   ├── comfyuiClient.js    # ✅ ComfyUI 客户端
│   ├── services.js         # ✅ 业务逻辑层
│   └── smartImport.js      # ✅ 智能导入
├── package.json            # 依赖和脚本
├── .env.example           # 环境变量模板
├── README.md              # 项目说明
├── PROGRESS.md            # 转写进度
├── TODO.md                # 待办事项
└── MIGRATION_SUMMARY.md   # 迁移总结
```

## 当前可用功能

### ✅ 已实现（82%）

1. **配置管理**
   - 环境变量加载
   - 目录自动创建
   - 配置验证

2. **数据模型**
   - 26 个完整的数据类
   - 序列化/反序列化
   - 提示词生成

3. **镜头模板**
   - 9 种专业镜头类型
   - 相机参数预设
   - 构图参数预设

4. **提示词生成**
   - 完整的提示词生成器
   - 标准提示词生成
   - 自定义提示词支持
   - 画面提示词生成

5. **图片生成**
   - API 生成器（NanaBanana）
   - ComfyUI 生成器（本地，WebSocket 支持）
   - Mock 生成器（测试）
   - 工厂函数和连接测试

6. **业务逻辑服务**
   - ProjectService - 项目管理
   - CharacterService - 角色管理
   - SceneService - 场景管理
   - ShotService - 镜头管理
   - GenerationService - 图片生成
   - ImportExportService - 导入导出
   - 示例故事数据（3个完整示例）

7. **ComfyUI 客户端**
   - HTTP 和 WebSocket 支持
   - 工作流管理
   - 文本生成图片
   - 图片生成图片
   - 进度回调

8. **智能导入**
   - 多格式文件解析（JSON、Markdown、HTML、TXT、图片）
   - JSON 验证和修复
   - 默认分析器
   - 多文件导入支持

9. **Web 服务器（完整）**
   - Express 框架初始化
   - CORS 支持
   - 静态文件服务
   - multer 文件上传
   - 错误处理
   - 完整的 API 路由

### ⏳ 待实现

- setupWizard.js（可选）
- 单元测试和集成测试
- PDF 和 DOCX 文件格式支持（需要额外依赖）
- 项目持久化到磁盘

## API 使用示例

### 创建项目

```bash
curl -X POST http://localhost:8000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name": "我的项目", "aspect_ratio": "16:9"}'
```

### 加载示例故事

```bash
curl -X POST http://localhost:8000/api/projects/1/load-example \
  -H "Content-Type: application/json" \
  -d '{"name": "咖啡厅邂逅"}'
```

### 添加角色

```bash
curl -X POST http://localhost:8000/api/projects/1/characters \
  -H "Content-Type: application/json" \
  -d '{"name": "张三", "description": "25岁程序员，戴黑框眼镜，穿格子衫"}'
```

### 添加场景

```bash
curl -X POST http://localhost:8000/api/projects/1/scenes \
  -H "Content-Type: application/json" \
  -d '{"name": "咖啡厅", "description": "现代简约风格咖啡厅，落地玻璃窗，午后阳光斜射"}'
```

### 添加镜头

```bash
curl -X POST http://localhost:8000/api/projects/1/shots \
  -H "Content-Type: application/json" \
  -d '{
    "template": "中景",
    "description": "张三独自坐在靠窗位置，正在笔记本电脑前写作",
    "characters": [],
    "scene_id": "scene_id"
  }'
```

### 生成单个镜头

```bash
curl -X POST http://localhost:8000/api/projects/1/shots/1/generate
```

### 导出项目

```bash
curl -X POST http://localhost:8000/api/export \
  -H "Content-Type: application/json" \
  -d '{"format": "json"}'
```

### 导入文件

```bash
curl -X POST http://localhost:8000/api/import \
  -F "file=@/path/to/project.json"
```

## 故障排除

### 依赖安装失败

```bash
# 清理缓存
npm cache clean --force
rm -rf node_modules package-lock.json
# 重新安装
npm install
```

### 端口被占用

修改 `.env` 文件：
```env
API_PORT=8001
```


### 导入错误

确保使用正确的模块语法：
```javascript
import settings from './config.js';  // ✅ 正确
const settings = require('./config.js');  // ❌ 错误
```

### WebSocket 错误

如果 ComfyUI WebSocket 连接失败，检查：
1. ComfyUI 是否正在运行
2. 端口配置是否正确（默认 8188）
3. 防火墙是否阻止连接

### 文件上传失败

检查：
1. uploads 目录是否有写入权限
2. 文件大小是否超过限制（默认 50MB）
3. 文件类型是否支持

## 参考文档

- **项目总览**: README.md
- **转写进度**: PROGRESS.md
- **待办事项**: TODO.md
- **迁移详情**: MIGRATION_SUMMARY.md

## 技术支持

遇到问题？

1. 查看相关文档
2. 检查 PROGRESS.md 中的已知问题
3. 查看 TODO.md 中的技术债务
4. 参考 Python 版本实现（web/ 目录）

## 贡献代码

欢迎继续开发：

1. 查看 TODO.md 了解待完成任务
2. 按照 README.md 中的代码风格指南
3. 更新 PROGRESS.md 记录进度
4. 提交代码前更新相关文档

---

**当前进度: 82% - 核心功能已完成！可以开始使用和测试！** 🚀

最后更新：2026-01-31

