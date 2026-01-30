import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const starElement = (
          <Star
            className={cn(
              sizeClasses[size],
              star <= rating
                ? 'fill-amber-500 text-amber-500'
                : 'fill-none text-muted-foreground'
            )}
          />
        )

        if (readonly) {
          return (
            <span key={star} className="inline-flex">
              {starElement}
            </span>
          )
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange?.(star)}
            className="transition-colors cursor-pointer hover:scale-110"
          >
            {starElement}
          </button>
        )
      })}
    </div>
  )
}
