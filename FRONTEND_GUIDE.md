# AI 分镜 Pro - 前端使用指南

## 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:8000` 启动。

## 访问前端界面

在浏览器中打开：`http://localhost:8000`

## 功能说明

### 1. 范例加载
- 点击任意范例卡片（咖啡厅邂逅、都市追逐、温馨家庭）快速开始
- 范例包含预置的角色、场景和镜头

### 2. 项目概览
- 显示当前项目的统计信息（角色数、场景数、镜头数、图片数）
- 项目自动保存到服务器

### 3. 工作流程（4个步骤）
- **① 创建**：添加角色和场景
- **② 编排**：设计和安排镜头
- **③ 生成**：AI生成图像
- **④ 导出**：下载成品

### 4. 镜头管理
- 查看所有镜头的缩略图和描述
- 点击镜头卡片打开预览弹窗
- 使用左右箭头键导航镜头
- 为未生成的镜头点击"生成图像"按钮

### 5. 角色管理
- 添加新角色（名称、描述）
- 查看角色列表
- 删除不需要的角色

### 6. 场景管理
- 添加新场景（名称、描述）
- 查看场景列表
- 删除不需要的场景

### 7. 镜头预览
- 点击任意镜头卡片打开预览弹窗
- 查看镜头详情：
  - 镜头描述
  - 角色
  - 场景
  - 景别
  - 镜头角度
  - 生成提示词
- 使用导航按钮或键盘箭头切换镜头

## API接口

### 项目管理
- `GET /api/projects` - 获取当前项目信息
- `POST /api/projects` - 创建新项目
- `POST /api/projects/:id/load-example` - 加载范例

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
- `DELETE /api/projects/:id/shots/:shotNum` - 删除镜头
- `PUT /api/projects/:id/shots/:shotNum/move` - 移动镜头
- `POST /api/projects/:id/shots/:shotNum/generate` - 生成镜头图像

### 导入导出
- `POST /api/export` - 导出项目
- `POST /api/import` - 导入项目

## 配置

编辑 `.env` 文件来配置服务器：

```env
# API配置
API_PORT=8000
API_HOST=0.0.0.0

# 图像生成后端
IMAGE_BACKEND=api
NANA_BANANA_API_KEY=your_api_key_here
NANA_BANANA_BASE_URL=https://api.nanabanana.pro

# ComfyUI配置（可选）
COMFYUI_ENABLED=false
COMFYUI_HOST=127.0.0.1
COMFYUI_PORT=8188
COMFYUI_WORKFLOW_DIR=/path/to/workflows

# CORS配置
CORS_ORIGINS=*
```

## 技术栈

- **后端**：Node.js + Express
- **前端**：原生 HTML/CSS/JavaScript
- **API**：RESTful API
- **样式**：自定义CSS（深色主题）

## 浏览器支持

- Chrome/Edge (最新版)
- Firefox (最新版)
- Safari (最新版)
- 其他现代浏览器
