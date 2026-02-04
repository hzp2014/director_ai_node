'use client'

/**
 * 剧本确认页面
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ScreenplayReviewForm, ScreenplayInfo, CharacterSheet, SceneCard } from '@/components/screenplay'
import { Card, CardContent } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui'
import { useScreenplayStore } from '@/stores'
import type { ScreenplayDraft } from '@/types'
import { DraftStatus } from '@/types'

export default function ScreenplayReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draftId')

  const [draft, setDraft] = useState<ScreenplayDraft | null>(null)
  const [view, setView] = useState<'edit' | 'preview'>('preview')
  const [isGenerating, setIsGenerating] = useState(false)

  // 如果有draftId，从store或API加载
  useEffect(() => {
    if (draftId) {
      // TODO: 从API加载剧本草稿
      console.log('Loading draft:', draftId)
    } else {
      // 使用临时数据（实际应该从store获取）
      const tempDraft: ScreenplayDraft = {
        id: 'temp-draft',
        title: '示例剧本：命运的红线',
        genre: '爱情',
        episodes: 3,
        characters: [
          {
            name: '林小雅',
            description: '25岁，独立插画师，性格温柔但内心坚强',
            appearance: '长发，常穿宽松的棉麻衣服，眼神清澈',
            personality: '温柔、善良、有艺术气息，但有些固执',
          },
          {
            name: '张明轩',
            description: '27岁，科技公司产品经理，理性冷静',
            appearance: '短发，戴眼镜，穿着简洁干练',
            personality: '理性、果断、责任感强，但不善表达情感',
          },
        ],
        scenes: [
          {
            id: 'scene-1',
            episodeNumber: 1,
            sceneNumber: 1,
            location: '咖啡厅',
            description: '午后的阳光透过落地窗洒在咖啡厅，林小雅正在专注地画插画',
            dialogue: [
              { character: '林小雅', text: '这光影真是太美了...' },
              { character: '张明轩', text: '不好意思，这里有人吗？', emotion: '礼貌' },
            ],
            action: '林小雅抬头，看到张明轩',
            duration: 30,
          },
          {
            id: 'scene-2',
            episodeNumber: 1,
            sceneNumber: 2,
            location: '咖啡厅',
            description: '两人开始交谈',
            dialogue: [
              { character: '林小雅', text: '没人，请坐' },
              { character: '张明轩', text: '谢谢。你在画画？', emotion: '好奇' },
              { character: '林小雅', text: '是的，在捕捉这美好的午后时光' },
            ],
            action: '张明轩看了看林小雅的画',
            duration: 45,
          },
        ],
        status: DraftStatus.PENDING_REVIEW,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setDraft(tempDraft)
    }
  }, [draftId])

  const handleUpdateDraft = (updatedDraft: ScreenplayDraft) => {
    setDraft(updatedDraft)
  }

  const handleConfirm = async () => {
    if (!draft) return

    setIsGenerating(true)
    try {
      // 调用API确认剧本并开始生成
      const response = await fetch('/api/screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          draft,
        }),
      })

      if (response.ok) {
        // 跳转到媒体生成页面
        router.push(`/scene-media?draftId=${draft.id}`)
      }
    } catch (error) {
      console.error('Failed to confirm screenplay:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    // 返回聊天页面重新生成
    router.push('/chat')
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600">加载剧本中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 头部 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-sm text-slate-600 hover:text-slate-900 mb-2"
              >
                ← 返回
              </button>
              <h1 className="text-2xl font-bold text-slate-900">剧本确认</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('preview')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'preview'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                预览
              </button>
              <button
                onClick={() => setView('edit')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === 'edit'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                编辑
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {view === 'preview' ? (
          <div className="space-y-6">
            {/* 剧本信息 */}
            <ScreenplayInfo draft={draft} />

            {/* 角色展示 */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">角色</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {draft.characters.map((character, index) => (
                  <CharacterSheet key={index} character={character} index={index} />
                ))}
              </div>
            </div>

            {/* 场景展示 */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">场景</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {draft.scenes.map((scene, index) => (
                  <SceneCard key={index} scene={scene} index={index} />
                ))}
              </div>
            </div>

            {/* 确认按钮 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    重新生成
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg hover:from-primary-700 hover:to-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <LoadingSpinner size="sm" />
                        生成中...
                      </>
                    ) : (
                      '确认并生成媒体'
                    )}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ScreenplayReviewForm
            draft={draft}
            onUpdate={handleUpdateDraft}
            onConfirm={handleConfirm}
            onRegenerate={handleRegenerate}
          />
        )}
      </div>
    </div>
  )
}
