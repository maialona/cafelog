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

function CoffeeBean({ className, filled }: { className?: string; filled: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 咖啡豆外形 — 橢圓豆形，微微傾斜 */}
      <path
        d="M50 5C28 5 10 25 8 50c-2 25 14 45 42 45s44-20 42-45C90 25 72 5 50 5z"
        fill={filled ? '#5C3317' : 'currentColor'}
        opacity={filled ? 1 : 0.25}
      />
      {/* S 形中線裂縫 */}
      <path
        d="M42 18c8 10 10 20 6 32s-10 22-8 32"
        stroke={filled ? '#FFFFFF' : '#FFFFFF'}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
        opacity={filled ? 0.9 : 0.5}
      />
    </svg>
  )
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const beanElement = (
          <CoffeeBean
            className={cn(sizeClasses[size])}
            filled={star <= rating}
          />
        )

        if (readonly) {
          return (
            <span key={star} className="inline-flex text-stone-400">
              {beanElement}
            </span>
          )
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange?.(star)}
            className="transition-transform cursor-pointer hover:scale-125 text-stone-400"
          >
            {beanElement}
          </button>
        )
      })}
    </div>
  )
}
