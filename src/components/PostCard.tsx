import { MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { StarRating } from '@/components/StarRating'
import type { CafePost, CafePostWithCoords } from '@/types/cafe'

interface PostCardProps {
  cafe: CafePost | CafePostWithCoords
  onClick?: () => void
}



export function PostCard({ cafe, onClick }: PostCardProps) {
  const photoUrl = cafe.photo_urls && cafe.photo_urls.length > 0 ? cafe.photo_urls[0] : null
  const tags = cafe.tags || []

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
        {cafe.wishlist && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            願望清單
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-2">
        <div className="w-full">
          <h3 className="font-bold text-lg leading-normal line-clamp-1 tracking-wide" title={cafe.name}>
            {cafe.name}
          </h3>
        </div>

        {/* 標籤 */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {cafe.address && (
          <div className="flex items-start gap-1 text-xs text-muted-foreground w-full">
            <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
            <span className="leading-normal line-clamp-1 text-left flex-1" title={cafe.address}>
              {cafe.address}
            </span>
          </div>
        )}

        <div className="pt-1">
          <StarRating rating={cafe.rating} size="sm" readonly />
        </div>
      </CardContent>
    </Card>
  )
}
