'use client'

/**
 * 设置页面
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { Input } from '@/components/ui'
import { Button } from '@/components/ui'
import { useApiConfigStore } from '@/stores'
import { useEffect } from 'react'

export default function SettingsPage() {
  const { configs, loadConfigs, addConfig } = useApiConfigStore()

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  const handleSaveConfig = (provider: 'zhipu' | 'canghe') => {
    const input = document.getElementById(`${provider}-key`) as HTMLInputElement
    const apiKey = input.value

    if (apiKey) {
      addConfig({
        provider,
        apiKey,
        isActive: true,
      })
      input.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">设置</h1>
          <p className="text-slate-600 mt-2">配置API密钥和服务选项</p>
        </div>

        <div className="space-y-6">
          {/* 智谱GLM配置 */}
          <Card>
            <CardHeader>
              <CardTitle>智谱GLM</CardTitle>
              <CardDescription>
                用于剧本生成和对话交互
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  id="zhipu-key"
                  type="password"
                  placeholder="输入智谱API密钥"
                  className="flex-1"
                />
                <Button onClick={() => handleSaveConfig('zhipu')}>
                  保存
                </Button>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                获取密钥：访问{' '}
                <a
                  href="https://open.bigmodel.cn"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  open.bigmodel.cn
                </a>
              </p>
            </CardContent>
          </Card>

          {/* 苍何API配置 */}
          <Card>
            <CardHeader>
              <CardTitle>苍何API</CardTitle>
              <CardDescription>
                用于图片和视频生成
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  id="canghe-key"
                  type="password"
                  placeholder="输入苍何API密钥"
                  className="flex-1"
                />
                <Button onClick={() => handleSaveConfig('canghe')}>
                  保存
                </Button>
              </div>
              <p className="text-sm text-slate-500 mt-2">
                获取密钥：访问{' '}
                <a
                  href="https://api.canghe.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  api.canghe.io
                </a>
              </p>
            </CardContent>
          </Card>

          {/* 当前配置列表 */}
          {configs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>已保存的配置</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {configs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{config.provider}</div>
                        <div className="text-sm text-slate-500">
                          {config.apiKey.slice(0, 8)}...
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.isActive && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                            活跃
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
