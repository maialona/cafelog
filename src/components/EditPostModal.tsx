import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Upload, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StarRating } from '@/components/StarRating'
import { useToast } from '@/hooks/use-toast'
import { updateCafe, uploadPhoto } from '@/services/cafes'
import type { CafePostWithCoords } from '@/types/cafe'

interface EditPostModalProps {
  cafe: CafePostWithCoords | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPostModal({ cafe, open, onOpenChange }: EditPostModalProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])
  const [existingMenuPhotos, setExistingMenuPhotos] = useState<string[]>([])
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newMenuPhotos, setNewMenuPhotos] = useState<File[]>([])
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([])
  const [newMenuPreviews, setNewMenuPreviews] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  // 初始化表單
  useEffect(() => {
    if (cafe && open) {
      setRating(cafe.rating)
      setNotes(cafe.notes || '')
      setVisitDate(cafe.visit_date || '')
      setExistingPhotos([...(cafe.photo_urls || [])])
      setExistingMenuPhotos([...(cafe.menu_photo_urls || [])])
      setNewPhotos([])
      setNewMenuPhotos([])
      setNewPhotoPreviews([])
      setNewMenuPreviews([])
      setUploadProgress(0)
    }
  }, [cafe, open])

  // 新增照片
  const handleAddPhotos = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'photos' | 'menu'
  ) => {
    const files = Array.from(e.target.files || [])
    const existing = type === 'photos' ? existingPhotos.length : existingMenuPhotos.length
    const newCount = type === 'photos' ? newPhotos.length : newMenuPhotos.length
    const maxCount = 5

    if (files.length + existing + newCount > maxCount) {
      toast({
        title: '照片數量超過限制',
        description: `最多只能有 ${maxCount} 張${type === 'menu' ? '菜單' : ''}照片`,
        variant: 'destructive'
      })
      return
    }

    const previews = files.map((f) => URL.createObjectURL(f))
    if (type === 'photos') {
      setNewPhotos((prev) => [...prev, ...files])
      setNewPhotoPreviews((prev) => [...prev, ...previews])
    } else {
      setNewMenuPhotos((prev) => [...prev, ...files])
      setNewMenuPreviews((prev) => [...prev, ...previews])
    }
    e.target.value = ''
  }

  // 刪除既有照片
  const removeExistingPhoto = (index: number, type: 'photos' | 'menu') => {
    if (type === 'photos') {
      setExistingPhotos((prev) => prev.filter((_, i) => i !== index))
    } else {
      setExistingMenuPhotos((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // 刪除新增照片
  const removeNewPhoto = (index: number, type: 'photos' | 'menu') => {
    if (type === 'photos') {
      setNewPhotos((prev) => prev.filter((_, i) => i !== index))
      setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
    } else {
      setNewMenuPhotos((prev) => prev.filter((_, i) => i !== index))
      setNewMenuPreviews((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // 儲存更新
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!cafe) throw new Error('找不到紀錄')

      const totalNewPhotos = newPhotos.length + newMenuPhotos.length
      let uploadedCount = 0
      setUploadProgress(0)

      // 上傳新照片
      const uploadedPhotoUrls: string[] = []
      for (const photo of newPhotos) {
        const url = await uploadPhoto(photo, 'photos')
        if (url) uploadedPhotoUrls.push(url)
        uploadedCount++
        setUploadProgress(totalNewPhotos > 0 ? Math.round((uploadedCount / totalNewPhotos) * 80) : 80)
      }

      const uploadedMenuUrls: string[] = []
      for (const photo of newMenuPhotos) {
        const url = await uploadPhoto(photo, 'menu')
        if (url) uploadedMenuUrls.push(url)
        uploadedCount++
        setUploadProgress(totalNewPhotos > 0 ? Math.round((uploadedCount / totalNewPhotos) * 80) : 80)
      }

      setUploadProgress(90)

      // 合併既有照片 + 新上傳的照片
      const finalPhotoUrls = [...existingPhotos, ...uploadedPhotoUrls]
      const finalMenuPhotoUrls = [...existingMenuPhotos, ...uploadedMenuUrls]

      const success = await updateCafe(cafe.id, {
        rating,
        notes: notes || null,
        visit_date: visitDate || null,
        photo_urls: finalPhotoUrls,
        menu_photo_urls: finalMenuPhotoUrls
      })

      if (!success) throw new Error('更新失敗')
      return true
    },
    onSuccess: () => {
      setUploadProgress(100)
      queryClient.invalidateQueries({ queryKey: ['cafes'] })
      queryClient.invalidateQueries({ queryKey: ['cafeStats'] })
      toast({ title: '已更新紀錄' })
      onOpenChange(false)
    },
    onError: (error) => {
      setUploadProgress(0)
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '更新失敗',
        variant: 'destructive'
      })
    }
  })

  if (!cafe) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-xl">編輯：{cafe.name}</DialogTitle>
            </DialogHeader>

            {/* 評分 */}
            <div className="space-y-2">
              <Label>評分</Label>
              <StarRating rating={rating} size="lg" onRatingChange={setRating} />
            </div>

            {/* 造訪日期 */}
            <div className="space-y-2">
              <Label htmlFor="edit-visit-date">造訪日期</Label>
              <input
                id="edit-visit-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* 環境照片 */}
            <div className="space-y-2">
              <Label>環境照片（最多 5 張）</Label>
              <div className="grid grid-cols-4 gap-2">
                {existingPhotos.map((url, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square rounded-md overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeExistingPhoto(index, 'photos')}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {newPhotoPreviews.map((url, index) => (
                  <div key={`new-${index}`} className="relative aspect-square rounded-md overflow-hidden group border-2 border-dashed border-primary">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeNewPhoto(index, 'photos')}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[10px] text-center py-0.5">新增</div>
                  </div>
                ))}
                {existingPhotos.length + newPhotos.length < 5 && (
                  <label className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">新增</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAddPhotos(e, 'photos')}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 菜單照片 */}
            <div className="space-y-2">
              <Label>菜單照片（最多 5 張）</Label>
              <div className="grid grid-cols-4 gap-2">
                {existingMenuPhotos.map((url, index) => (
                  <div key={`existing-menu-${index}`} className="relative aspect-square rounded-md overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeExistingPhoto(index, 'menu')}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {newMenuPreviews.map((url, index) => (
                  <div key={`new-menu-${index}`} className="relative aspect-square rounded-md overflow-hidden group border-2 border-dashed border-primary">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeNewPhoto(index, 'menu')}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-[10px] text-center py-0.5">新增</div>
                  </div>
                ))}
                {existingMenuPhotos.length + newMenuPhotos.length < 5 && (
                  <label className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mt-1">新增</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleAddPhotos(e, 'menu')}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 評論 */}
            <div className="space-y-2">
              <Label htmlFor="edit-notes">評論</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="分享您的體驗..."
                rows={4}
              />
            </div>

            {/* 儲存按鈕 */}
            <Button
              className="w-full relative overflow-hidden"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <div
                    className="absolute inset-0 bg-primary/30 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                  <span className="relative z-10">
                    {uploadProgress < 80 ? '上傳照片中' : '儲存中'} {uploadProgress}%
                  </span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  儲存變更
                </>
              )}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
