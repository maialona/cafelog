import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Calendar, Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StarRating } from '@/components/StarRating'
import { CafeMap } from '@/components/map/CafeMap'
import { EditPostModal } from '@/components/EditPostModal'
import type { CafePost, CafePostWithCoords } from '@/types/cafe'

interface PostDetailModalProps {
  cafe: CafePost | CafePostWithCoords | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PostDetailModal({
  cafe,
  open,
  onOpenChange
}: PostDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)

  // 合併照片和菜單照片 URL
  useEffect(() => {
    if (!cafe) return

    const allPhotos = [...(cafe.photo_urls || []), ...(cafe.menu_photo_urls || [])]
    setPhotoUrls(allPhotos)
    setCurrentPhotoIndex(0)
  }, [cafe])

  if (!cafe) return null

  const hasPhotos = photoUrls.length > 0
  // 支援兩種格式：coords 物件 或 lat/lng 直接欄位
  const hasLocation = ('coords' in cafe && cafe.coords?.lat && cafe.coords?.lng) || 
                     (cafe.lat && cafe.lng)
  const mapCenter = 'coords' in cafe && cafe.coords 
    ? cafe.coords 
    : (cafe.lat && cafe.lng ? { lat: cafe.lat, lng: cafe.lng } : null)

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === 0 ? photoUrls.length - 1 : prev - 1
    )
  }

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) =>
      prev === photoUrls.length - 1 ? 0 : prev + 1
    )
  }

  const cafeWithCoords: CafePostWithCoords = 'coords' in cafe 
    ? cafe as CafePostWithCoords 
    : { ...cafe, coords: cafe.lat && cafe.lng ? { lat: cafe.lat, lng: cafe.lng } : null }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <ScrollArea className="max-h-[90vh]">
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-xl">{cafe.name}</DialogTitle>
              </DialogHeader>

              {/* 照片輪播 */}
              {hasPhotos && (
                <div className="relative mt-4">
                  <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img
                      src={photoUrls[currentPhotoIndex]}
                      alt={`${cafe.name} - 照片 ${currentPhotoIndex + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* 照片導航按鈕 */}
                  {photoUrls.length > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                        onClick={handlePrevPhoto}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full"
                        onClick={handleNextPhoto}
                      >
                        <ChevronRight className="h-6 w-6" />
                      </Button>
                    </>
                  )}

                  {/* 照片指示器 */}
                  {photoUrls.length > 1 && (
                    <div className="flex justify-center gap-2 mt-2">
                      {photoUrls.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentPhotoIndex
                              ? 'bg-primary'
                              : 'bg-muted-foreground/30'
                          }`}
                          onClick={() => setCurrentPhotoIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 評分 */}
              <div className="mt-4">
                <StarRating rating={cafe.rating} size="lg" readonly />
              </div>

              {/* 編輯按鈕 */}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                編輯紀錄
              </Button>

              {/* 地址 */}
              {cafe.address && (
                <div className="flex items-start gap-2 mt-4 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="text-sm">{cafe.address}</span>
                </div>
              )}

              {/* 地圖 */}
              {hasLocation && mapCenter && (
                <div className="mt-4">
                  <CafeMap
                    center={mapCenter}
                    height="192px"
                  />
                </div>
              )}

              {/* 筆記/評論 */}
              {cafe.notes && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">評論</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {cafe.notes}
                  </p>
                </div>
              )}

              {/* 日期 */}
              <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  建立於{' '}
                  {new Date(cafe.created_at).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* 編輯 Modal */}
      <EditPostModal
        cafe={cafeWithCoords}
        open={isEditing}
        onOpenChange={(editOpen) => {
          setIsEditing(editOpen)
          if (!editOpen && cafe) {
            // 編輯完成後重新載入照片
            const allPhotos = [...(cafe.photo_urls || []), ...(cafe.menu_photo_urls || [])]
            setPhotoUrls(allPhotos)
            setCurrentPhotoIndex(0)
          }
        }}
      />
    </>
  )
}
