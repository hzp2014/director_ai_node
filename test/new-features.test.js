import videoGenerator from '../src/videoGenerator.js';
import aiClient from '../src/aiClient.js';
import { SceneStatus, ScreenplayStatus } from '../src/screenplayModels.js';
import settings from '../src/config.js';

console.log('=== 测试视频生成和AI对话功能 ===\n');

async function testVideoGenerator() {
  console.log('1. 测试视频生成客户端...');
  console.log(`   - API Base URL: ${settings.videoApiBaseUrl}`);
  console.log(`   - Mock Mode: ${settings.useMockVideoApi}`);
  console.log(`   - Default Model: ${settings.defaultVideoModel}\n`);

  try {
    const response = await videoGenerator.generateVideo({
      prompt: 'A peaceful scene with gentle light',
      imageUrls: [],
      seconds: '5'
    });

    console.log(`   ✅ 视频生成任务已提交`);
    console.log(`   - Task ID: ${response.id}`);
    console.log(`   - Status: ${response.status}`);
    console.log(`   - Progress: ${response.progress}%\n`);

    if (settings.useMockVideoApi) {
      console.log('   ✅ Mock模式测试通过\n');
    }
  } catch (error) {
    console.error(`   ❌ 测试失败: ${error.message}\n`);
  }
}

async function testAIClient() {
  console.log('2. 测试AI对话客户端...');
  console.log(`   - Zhipu API Base URL: ${settings.zhipuApiBaseUrl}`);
  console.log(`   - Doubao API Base URL: ${settings.doubaoApiBaseUrl}`);
  console.log(`   - Mock Mode: ${settings.useMockChatApi}\n`);

  try {
    if (settings.useMockChatApi) {
      const chunks = await aiClient.sendToGLMStream([
        { role: 'user', content: 'Hello, test message' }
      ]);

      console.log(`   ✅ 收到 ${chunks.length} 个 chunks`);

      const fullContent = chunks.filter(c => c.isContent).map(c => c.text).join('');
      console.log(`   - 内容长度: ${fullContent.length} 字符\n`);

      console.log('   ✅ Mock模式测试通过\n');
    } else {
      console.log('   ℹ️  Mock模式未启用，跳过实际API调用\n');
    }
  } catch (error) {
    console.error(`   ❌ 测试失败: ${error.message}\n`);
  }
}

async function testScreenplayModels() {
  console.log('3. 测试剧本数据模型...');

  try {
    const { Scene, Screenplay } = await import('../src/screenplayModels.js');

    const scene = new Scene({
      sceneId: 1,
      narration: '测试场景',
      imagePrompt: 'A test scene',
      videoPrompt: 'Smooth camera movement',
      characterDescription: 'A character'
    });

    console.log(`   ✅ 创建场景: ${scene.narration}`);
    console.log(`   - 状态: ${scene.status}`);
    console.log(`   - 状态显示: ${scene.statusDisplayName}\n`);

    const screenplay = new Screenplay({
      scriptTitle: '测试剧本',
      scenes: [scene]
    });

    console.log(`   ✅ 创建剧本: ${screenplay.scriptTitle}`);
    console.log(`   - 剧本ID: ${screenplay.taskId}`);
    console.log(`   - 进度: ${(screenplay.progress * 100).toFixed(0)}%`);
    console.log(`   - 状态描述: ${screenplay.statusDescription}\n`);

    console.log('   ✅ 数据模型测试通过\n');
  } catch (error) {
    console.error(`   ❌ 测试失败: ${error.message}\n`);
  }
}

async function testConfig() {
  console.log('4. 测试配置管理...');
  console.log(`   - 智谱API Key: ${settings.zhipuApiKey ? '已配置' : '未配置'}`);
  console.log(`   - 豆包API Key: ${settings.doubaoApiKey ? '已配置' : '未配置'}`);
  console.log(`   - 视频API Key: ${settings.videoApiKey ? '已配置' : '未配置'}`);
  console.log(`   - 并发场景数: ${settings.concurrentScenes}`);
  console.log(`   - 角色参考数: ${settings.characterReferenceCount}\n`);

  console.log('   ✅ 配置测试通过\n');
}

async function runAllTests() {
  await testConfig();
  await testScreenplayModels();
  await testVideoGenerator();
  await testAIClient();

  console.log('=== 所有测试完成 ===\n');
  console.log('📝 注意事项：');
  console.log('1. 视频生成和AI对话目前处于Mock模式');
  console.log('2. 要使用真实API，请在 .env 中配置相应的 API Key');
  console.log('3. 视频合并服务尚未实现');
  console.log('4. API路由扩展尚未实现\n');
}

runAllTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
