import { MapPin, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StarRating } from '@/components/StarRating'
import type { CafePost, CafePostWithCoords } from '@/types/cafe'

interface PostCardProps {
  cafe: CafePost | CafePostWithCoords
  onClick?: () => void
  onEdit?: () => void
}

export function PostCard({ cafe, onClick, onEdit }: PostCardProps) {
  // 使用 photo_urls 陣列中的第一張照片
  const photoUrl = cafe.photo_urls && cafe.photo_urls.length > 0 ? cafe.photo_urls[0] : null

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
        {/* 編輯按鈕 */}
        {onEdit && (
          <button
            className="absolute top-2 left-2 bg-white/90 hover:bg-white text-gray-700 rounded-full p-1.5 shadow-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <CardContent className="p-4 space-y-2">
        {/* 名稱 */}
        <div className="w-full">
          <h3 className="font-bold text-lg leading-normal line-clamp-1 tracking-wide" title={cafe.name}>
            {cafe.name}
          </h3>
        </div>

        {/* 地址 */}
        {cafe.address && (
          <div className="flex items-start gap-1 text-xs text-muted-foreground w-full">
            <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="leading-normal line-clamp-1 text-left flex-1" title={cafe.address}>
              {cafe.address}
            </span>
          </div>
        )}

        {/* 評分 */}
        <div className="pt-1">
          <StarRating rating={cafe.rating} size="sm" readonly />
        </div>
      </CardContent>
    </Card>
  )
}
