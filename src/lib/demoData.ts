/**
 * 演示数据 - 用于在没有API密钥时展示功能
 */

export const DEMO_RESPONSES = {
  greeting: "你好！我是AI Director，一个智能短剧制作助手。\n\n我可以帮你：\n• 创作短剧剧本\n• 设计角色形象\n• 规划场景分镜\n• 生成视频素材\n\n请告诉我你想创作什么类型的短剧？",

  screenplayDemo: {
    title: '《命运的红线》',
    genre: '现代爱情',
    episodes: 3,
    characters: [
      {
        name: '林小雅',
        description: '25岁，独立插画师',
        appearance: '长发，常穿宽松棉麻衣服，眼神清澈温柔',
        personality: '温柔善良，内心坚强，对艺术有执着追求'
      },
      {
        name: '张明轩',
        description: '27岁，科技公司产品经理',
        appearance: '短发戴眼镜，穿着干练简洁',
        personality: '理性冷静，责任心强，不善表达情感但内心细腻'
      }
    ],
    scenes: [
      {
        id: 'scene-1',
        episodeNumber: 1,
        sceneNumber: 1,
        location: '阳光咖啡厅',
        description: '午后的阳光透过落地窗洒在咖啡厅，林小雅正专注地画插画',
        dialogue: [
          { character: '林小雅', text: '这光影真是太美了...' },
          { character: '张明轩', text: '不好意思，这里有人吗？', emotion: '礼貌' }
        ],
        action: '林小雅抬头，看到张明轩，两人目光相遇',
        duration: 30
      }
    ],
    status: 'pending_review' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}
