/**
 * 场景卡片组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { MapPin, Clock, MessageSquare } from 'lucide-react'
import { formatDuration } from '@/lib/utils'
import type { SceneDraft } from '@/types'

interface SceneCardProps {
  scene: SceneDraft
  index?: number
}

export function SceneCard({ scene, index = 0 }: SceneCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">
            第 {scene.episodeNumber} 集 - 场景 {scene.sceneNumber}
          </span>
          <span className="text-sm font-normal text-slate-500">场景 #{index + 1}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 text-slate-600">
          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium text-slate-900">地点</div>
            <div className="text-sm">{scene.location}</div>
          </div>
        </div>

        <div className="flex items-start gap-2 text-slate-600">
          <Clock className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium text-slate-900">时长</div>
            <div className="text-sm">{formatDuration(scene.duration)}</div>
          </div>
        </div>

        <div>
          <div className="font-medium text-slate-900 mb-2">场景描述</div>
          <p className="text-sm text-slate-600">{scene.description}</p>
        </div>

        {scene.action && (
          <div>
            <div className="font-medium text-slate-900 mb-2">动作</div>
            <p className="text-sm text-slate-600">{scene.action}</p>
          </div>
        )}

        {scene.dialogue.length > 0 && (
          <div>
            <div className="flex items-center gap-2 font-medium text-slate-900 mb-2">
              <MessageSquare className="w-4 h-4" />
              对话 ({scene.dialogue.length}句)
            </div>
            <div className="space-y-2">
              {scene.dialogue.slice(0, 3).map((line, idx) => (
                <div key={idx} className="text-sm bg-slate-50 rounded-lg p-2">
                  <span className="font-medium text-primary-600">{line.character}: </span>
                  <span className="text-slate-700">{line.text}</span>
                </div>
              ))}
              {scene.dialogue.length > 3 && (
                <div className="text-xs text-slate-500 text-center">
                  还有 {scene.dialogue.length - 3} 句对话...
                </div>
              )}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>媒体生成</span>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">待生成</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
