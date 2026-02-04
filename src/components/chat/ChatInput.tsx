'use client'

/**
 * 聊天输入组件
 */

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui'
import { ImageIcon, Send } from 'lucide-react'
import Image from 'next/image'

interface ChatInputProps {
  onSendMessage: (content: string, images?: File[]) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!input.trim() && selectedImages.length === 0) return
    onSendMessage(input, selectedImages)
    setInput('')
    setSelectedImages([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setSelectedImages((prev) => [...prev, ...files])
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="border-t border-slate-200 bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {selectedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedImages.map((file, index) => (
              <div key={index} className="relative group">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`Selected ${index}`}
                  width={80}
                  height={80}
                  className="object-cover rounded-lg border border-slate-200"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="描述你想创作的短剧... (Shift+Enter 换行)"
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none border-0 bg-transparent focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400"
            style={{ minHeight: '40px', maxHeight: '200px' }}
          />
          <Button
            onClick={handleSend}
            disabled={disabled || (!input.trim() && selectedImages.length === 0)}
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
