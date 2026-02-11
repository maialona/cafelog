import { useState } from 'react'
import { X, Plus, Tag } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// 預設標籤
export const PRESET_TAGS = [
  '適合工作',
  '有插座',
  'WiFi穩定',
  '寵物友善',
  '戶外座位',
  '安靜',
  '甜點好吃',
  '咖啡好喝',
  '適合拍照',
  '平價',
  '不限時',
  '有包廂',
]

interface TagSelectorProps {
  selectedTags: string[]
  onChange: (tags: string[]) => void
}

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('')

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag))
    } else {
      onChange([...selectedTags, tag])
    }
  }

  const addCustomTag = () => {
    const trimmed = customTag.trim()
    if (!trimmed) return
    if (selectedTags.includes(trimmed)) {
      setCustomTag('')
      return
    }
    onChange([...selectedTags, trimmed])
    setCustomTag('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomTag()
    }
  }

  // 找出自訂標籤（不在預設列表中的）
  const customTags = selectedTags.filter((t) => !PRESET_TAGS.includes(t))

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-1.5">
        <Tag className="h-4 w-4" />
        標籤
      </Label>

      {/* 預設標籤 */}
      <div className="flex flex-wrap gap-2">
        {PRESET_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-accent border-border'
              }`}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* 自訂標籤 */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm bg-orange-100 text-orange-800 border border-orange-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="ml-0.5 hover:text-orange-950"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 新增自訂標籤 */}
      <div className="flex gap-2">
        <Input
          placeholder="新增自訂標籤..."
          value={customTag}
          onChange={(e) => setCustomTag(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <button
          type="button"
          onClick={addCustomTag}
          disabled={!customTag.trim()}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增
        </button>
      </div>
    </div>
  )
}
