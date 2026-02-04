'use client'

/**
 * 场景媒体查看页面
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { LoadingSpinner, LoadingDots } from '@/components/ui'
import { Play, Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { Scene } from '@/types'
import { SceneStatus } from '@/types'

export default function SceneMediaPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draftId')

  const [scenes, setScenes] = useState<Scene[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)

  useEffect(() => {
    // 加载场景数据
    if (draftId) {
      loadScenes()
    }
  }, [draftId])

  const loadScenes = async () => {
    setIsLoading(true)
    try {
      // TODO: 从API加载场景数据
      // 临时数据
      const tempScenes: Scene[] = [
        {
          id: 'scene-1',
          draftId: draftId || '',
          episodeNumber: 1,
          sceneNumber: 1,
          location: '咖啡厅',
          description: '午后的阳光透过落地窗',
          dialogue: [],
          action: '林小雅抬头',
          duration: 30,
          status: SceneStatus.IMAGE_READY,
          imageUrl: 'https://picsum.photos/800/450?random=1',
          createdAt: new Date(),
        },
        {
          id: 'scene-2',
          draftId: draftId || '',
          episodeNumber: 1,
          sceneNumber: 2,
          location: '咖啡厅',
          description: '两人开始交谈',
          dialogue: [],
          action: '张明轩看了看画',
          duration: 45,
          status: SceneStatus.PENDING,
          createdAt: new Date(),
        },
      ]
      setScenes(tempScenes)
    } catch (error) {
      console.error('Failed to load scenes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const startGeneration = async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // TODO: 调用API开始生成
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch',
          params: {
            scenes: scenes.map(s => ({
              id: s.id,
              imageUrl: s.imageUrl || '',
              description: s.description,
            })),
          },
        }),
      })

      if (response.ok) {
        // 模拟进度更新
        const interval = setInterval(() => {
          setGenerationProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval)
              setIsGenerating(false)
              return 100
            }
            return prev + 10
          })
        }, 500)
      }
    } catch (error) {
      console.error('Failed to start generation:', error)
      setIsGenerating(false)
    }
  }

  const currentScene = scenes[currentIndex]
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < scenes.length - 1

  const goToPrevious = () => {
    if (hasPrevious) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleDownload = () => {
    if (currentScene.videoUrl) {
      const link = document.createElement('a')
      link.href = currentScene.videoUrl
      link.download = `scene-${currentScene.episodeNumber}-${currentScene.sceneNumber}.mp4`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600">加载场景中...</p>
        </div>
      </div>
    )
  }

  if (scenes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">暂无场景数据</p>
          <Button
            onClick={() => router.back()}
            className="mt-4"
          >
            返回
          </Button>
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
              <h1 className="text-2xl font-bold text-slate-900">场景媒体</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                {currentIndex + 1} / {scenes.length}
              </span>
              {!isGenerating && generationProgress === 0 && (
                <Button onClick={startGeneration}>
                  开始生成视频
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主预览区域 */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black relative rounded-lg overflow-hidden">
                  {currentScene.videoUrl ? (
                    <video
                      src={currentScene.videoUrl}
                      controls
                      className="w-full h-full"
                    />
                  ) : currentScene.imageUrl ? (
                    <img
                      src={currentScene.imageUrl}
                      alt={currentScene.description}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>等待生成</p>
                      </div>
                    </div>
                  )}

                  {/* 导航按钮 */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
                    <button
                      onClick={goToPrevious}
                      disabled={!hasPrevious}
                      className="p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-white text-sm font-medium">
                      {currentIndex + 1} / {scenes.length}
                    </span>
                    <button
                      onClick={goToNext}
                      disabled={!hasNext}
                      className="p-2 text-white hover:bg-white/10 rounded-full disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={!currentScene.videoUrl}
              >
                <Download className="w-4 h-4 mr-2" />
                下载视频
              </Button>
              {currentScene.videoUrl && (
                <Button
                  onClick={() => {
                    // 全屏播放
                    if (document.fullscreenElement) {
                      document.exitFullscreen()
                    } else {
                      const video = document.querySelector('video')
                      video?.requestFullscreen()
                    }
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  全屏播放
                </Button>
              )}
            </div>

            {/* 生成进度 */}
            {isGenerating && (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        生成进度
                      </span>
                      <span className="text-sm text-slate-600">
                        {generationProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                      <LoadingDots />
                      <span>正在生成视频，请稍候...</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 侧边栏：场景信息 */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-slate-900 mb-4">
                  第 {currentScene.episodeNumber} 集 - 场景 {currentScene.sceneNumber}
                </h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">地点：</span>
                    <span className="text-slate-600">{currentScene.location}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">时长：</span>
                    <span className="text-slate-600">
                      {formatDuration(currentScene.duration)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">状态：</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      currentScene.status === 'video_ready'
                        ? 'bg-green-100 text-green-700'
                        : currentScene.status === 'image_ready'
                        ? 'bg-blue-100 text-blue-700'
                        : currentScene.status === 'generating_video'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {currentScene.status === 'video_ready'
                        ? '视频已生成'
                        : currentScene.status === 'image_ready'
                        ? '图片已生成'
                        : currentScene.status === 'generating_video'
                        ? '视频生成中'
                        : '待生成'}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-slate-600">{currentScene.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 场景列表缩略图 */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-slate-900 mb-4">所有场景</h3>
                <div className="grid grid-cols-3 gap-2">
                  {scenes.map((scene, index) => (
                    <button
                      key={scene.id}
                      onClick={() => setCurrentIndex(index)}
                      className={`aspect-video bg-slate-100 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentIndex
                          ? 'border-primary-600'
                          : 'border-transparent hover:border-slate-300'
                      }`}
                    >
                      {scene.imageUrl ? (
                        <img
                          src={scene.imageUrl}
                          alt={`场景 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          {index + 1}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
