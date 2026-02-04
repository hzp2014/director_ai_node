/**
 * 剧本信息展示组件
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import type { ScreenplayDraft } from '@/types'

interface ScreenplayInfoProps {
  draft: ScreenplayDraft
}

export function ScreenplayInfo({ draft }: ScreenplayInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{draft.title}</CardTitle>
        <CardDescription>
          <div className="flex items-center gap-4 mt-2">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              {draft.genre}
            </span>
            <span className="text-slate-600">
              {draft.episodes} 集
            </span>
            <span className="text-slate-600">
              {draft.scenes.length} 个场景
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">剧本概要</h4>
            <p className="text-slate-600">
              这是一部{draft.genre}类型的短剧，共{draft.episodes}集，
              包含{draft.characters.length}个主要角色和{draft.scenes.length}个场景。
            </p>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-2">角色列表</h4>
            <div className="flex flex-wrap gap-2">
              {draft.characters.map((char, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm"
                >
                  {char.name}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-slate-900 mb-2">场景分布</h4>
            <div className="space-y-1">
              {Array.from({ length: draft.episodes }, (_, i) => i + 1).map((ep) => {
                const episodeScenes = draft.scenes.filter(s => s.episodeNumber === ep)
                return (
                  <div key={ep} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">第 {ep} 集</span>
                    <span className="text-slate-500">{episodeScenes.length} 个场景</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
