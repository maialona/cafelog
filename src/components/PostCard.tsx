import { useState, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StarRating } from '@/components/StarRating'
import { createBlobUrl, revokeBlobUrl } from '@/utils/photos'
import type { CafePost } from '@/types/cafe'

interface PostCardProps {
  cafe: CafePost
  onClick?: () => void
}

export function PostCard({ cafe, onClick }: PostCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  // 從 Blob 建立預覽 URL
  useEffect(() => {
    if (cafe.photos && cafe.photos.length > 0) {
      const url = createBlobUrl(cafe.photos[0])
      setPhotoUrl(url)
      return () => revokeBlobUrl(url)
    }
  }, [cafe.photos])

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
      onClick={onClick}
    >
      {/* 照片 */}
      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={cafe.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            無照片
          </div>
        )}
        {/* 願望清單標記 */}
        {cafe.wishlist && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            願望清單
          </div>
        )}
      </div>

      <CardContent className="p-3">
        {/* 名稱 */}
        <h3 className="font-semibold truncate">{cafe.name}</h3>

        {/* 地址 */}
        {cafe.address && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{cafe.address}</span>
          </div>
        )}

        {/* 評分 */}
        <div className="mt-2">
          <StarRating rating={cafe.rating} size="sm" readonly />
        </div>
      </CardContent>
    </Card>
  )
}
