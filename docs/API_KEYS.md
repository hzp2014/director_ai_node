# 环境变量配置说明

## API密钥配置

### 方式一：使用 `.env.local` 文件（推荐）

1. 复制示例配置：
```bash
cp .env.example .env.local
```

2. 编辑 `.env.local` 填入你的API密钥：
```env
ZHIPU_API_KEY=你的智谱API密钥
CANGHE_API_KEY=你的苍何API密钥
```

3. 重启开发服务器：
```bash
npm run dev
```

### 方式二：在设置页面配置

1. 启动应用后访问：http://localhost:3000/settings
2. 在设置页面输入你的API密钥
3. 点击保存

### 方式三：直接创建 `.env` 文件

```bash
# 创建 .env 文件
echo "ZHIPU_API_KEY=你的密钥" > .env
echo "CANGHE_API_KEY=你的密钥" >> .env
```

## 获取API密钥

### 智谱GLM
- 官网：https://open.bigmodel.cn
- 注册账号 → 创建API密钥
- 免费额度：新用户有免费试用额度

### 苍何API
- 官网：https://api.canghe.io
- 用于图片和视频生成

## 演示模式

如果没有配置API密钥，应用会自动进入**演示模式**：
- ✅ 可以正常使用聊天界面
- ✅ 可以看到完整的剧本流程演示
- ✅ 所有页面都可以正常访问
- ⚠️ 无法生成真实的AI内容

## 注意事项

- ⚠️ **永远不要**将 `.env` 文件提交到Git
- ✅ `.env.local` 文件已被 `.gitignore` 忽略
- ✅ 可以安全地在本地存储API密钥
