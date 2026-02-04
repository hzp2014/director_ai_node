'use client'

/**
 * 剧本编辑表单组件
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Textarea } from '@/components/ui'
import { X, Edit2, Check } from 'lucide-react'
import type { ScreenplayDraft, CharacterInfo, SceneDraft } from '@/types'

interface ScreenplayReviewFormProps {
  draft: ScreenplayDraft
  onUpdate?: (draft: ScreenplayDraft) => void
  onConfirm?: () => void
  onRegenerate?: () => void
}

export function ScreenplayReviewForm({
  draft,
  onUpdate,
  onConfirm,
  onRegenerate,
}: ScreenplayReviewFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedDraft, setEditedDraft] = useState<ScreenplayDraft>(draft)
  const [editingCharacter, setEditingCharacter] = useState<number | null>(null)
  const [editingScene, setEditingScene] = useState<number | null>(null)

  const handleSave = () => {
    onUpdate?.(editedDraft)
    setIsEditing(false)
  }

  const handleUpdateCharacter = (index: number, updates: Partial<CharacterInfo>) => {
    setEditedDraft((prev) => ({
      ...prev,
      characters: prev.characters.map((char, i) =>
        i === index ? { ...char, ...updates } : char
      ),
    }))
  }

  const handleUpdateScene = (index: number, updates: Partial<SceneDraft>) => {
    setEditedDraft((prev) => ({
      ...prev,
      scenes: prev.scenes.map((scene, i) =>
        i === index ? { ...scene, ...updates } : scene
      ),
    }))
  }

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">剧本确认</h2>
          <p className="text-slate-600">请检查剧本内容，可以编辑后确认或重新生成</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onRegenerate}>
            重新生成
          </Button>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              编辑
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>
                <Check className="w-4 h-4 mr-2" />
                保存
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 剧本标题 */}
      <Card>
        <CardHeader>
          <CardTitle>剧本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              标题
            </label>
            {isEditing ? (
              <Input
                value={editedDraft.title}
                onChange={(e) =>
                  setEditedDraft((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            ) : (
              <div className="text-lg font-semibold">{editedDraft.title}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              类型
            </label>
            {isEditing ? (
              <Input
                value={editedDraft.genre}
                onChange={(e) =>
                  setEditedDraft((prev) => ({ ...prev, genre: e.target.value }))
                }
              />
            ) : (
              <div>{editedDraft.genre}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              集数
            </label>
            <div>{editedDraft.episodes}</div>
          </div>
        </CardContent>
      </Card>

      {/* 角色列表 */}
      <Card>
        <CardHeader>
          <CardTitle>角色列表 ({editedDraft.characters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {editedDraft.characters.map((character, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-4 relative"
              >
                {editingCharacter === index && isEditing ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setEditingCharacter(null)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <Input
                      value={character.name}
                      onChange={(e) =>
                        handleUpdateCharacter(index, { name: e.target.value })
                      }
                      placeholder="角色名"
                    />
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      value={character.description}
                      onChange={(e) =>
                        handleUpdateCharacter(index, { description: e.target.value })
                      }
                      placeholder="角色描述"
                      rows={2}
                    />
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      value={character.appearance}
                      onChange={(e) =>
                        handleUpdateCharacter(index, { appearance: e.target.value })
                      }
                      placeholder="外貌特征"
                      rows={2}
                    />
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      value={character.personality}
                      onChange={(e) =>
                        handleUpdateCharacter(index, { personality: e.target.value })
                      }
                      placeholder="性格特点"
                      rows={2}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{character.name}</h4>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCharacter(index)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-1">{character.description}</p>
                    <p className="text-sm text-slate-600 mb-1">
                      <span className="font-medium">外貌：</span>
                      {character.appearance}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">性格：</span>
                      {character.personality}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 场景列表 */}
      <Card>
        <CardHeader>
          <CardTitle>场景列表 ({editedDraft.scenes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {editedDraft.scenes.map((scene, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-lg p-4 relative"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-900">
                    第 {scene.episodeNumber} 集 - 场景 {scene.sceneNumber}
                  </h4>
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingScene(index)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {editingScene === index && isEditing ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => setEditingScene(null)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <Input
                      value={scene.location}
                      onChange={(e) =>
                        handleUpdateScene(index, { location: e.target.value })
                      }
                      placeholder="地点"
                    />
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      value={scene.description}
                      onChange={(e) =>
                        handleUpdateScene(index, { description: e.target.value })
                      }
                      placeholder="场景描述"
                      rows={2}
                    />
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      value={scene.action}
                      onChange={(e) =>
                        handleUpdateScene(index, { action: e.target.value })
                      }
                      placeholder="动作"
                      rows={2}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">地点：</span>
                      {scene.location}
                    </p>
                    <p className="text-sm text-slate-600">{scene.description}</p>
                    {scene.action && (
                      <p className="text-sm text-slate-600">
                        <span className="font-medium">动作：</span>
                        {scene.action}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">
                      对话: {scene.dialogue.length} 句 · 时长: {scene.duration}秒
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 确认按钮 */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <Button variant="outline" size="lg" onClick={onRegenerate}>
          重新生成剧本
        </Button>
        <Button
          size="lg"
          onClick={onConfirm}
          className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700"
        >
          确认并生成媒体
        </Button>
      </div>
    </div>
  )
}
