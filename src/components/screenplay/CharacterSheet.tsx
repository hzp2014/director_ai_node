/**
 * 角色卡片组件
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import type { CharacterInfo } from '@/types'

interface CharacterSheetProps {
  character: CharacterInfo
  index?: number
}

export function CharacterSheet({ character, index = 0 }: CharacterSheetProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            {character.name.charAt(0)}
          </div>
          <div>
            <div className="text-lg">{character.name}</div>
            <div className="text-sm font-normal text-slate-500">角色 #{index + 1}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-slate-900 mb-1">角色描述</h4>
          <p className="text-sm text-slate-600">{character.description}</p>
        </div>

        <div>
          <h4 className="font-medium text-slate-900 mb-1">外貌特征</h4>
          <p className="text-sm text-slate-600">{character.appearance}</p>
        </div>

        <div>
          <h4 className="font-medium text-slate-900 mb-1">性格特点</h4>
          <p className="text-sm text-slate-600">{character.personality}</p>
        </div>

        <div className="pt-3 border-t border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>三视图生成</span>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">待生成</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
