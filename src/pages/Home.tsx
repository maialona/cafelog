import { useState } from 'react'
import Masonry from 'react-masonry-css'
import { useQuery } from '@tanstack/react-query'
import { Coffee } from 'lucide-react'
import { PostCard } from '@/components/PostCard'
import { PostDetailModal } from '@/components/PostDetailModal'
import { EditPostModal } from '@/components/EditPostModal'
import { useSearch } from '@/components/layout/AppShell'
import { getAllCafes } from '@/services/cafes'
import type { CafePostWithCoords } from '@/types/cafe'

const breakpointColumns = {
  default: 4,
  1280: 3,
  1024: 3,
  768: 2,
  640: 2
}

export function Home() {
  const { searchQuery } = useSearch()
  const [selectedCafe, setSelectedCafe] = useState<CafePostWithCoords | null>(null)
  const [editingCafe, setEditingCafe] = useState<CafePostWithCoords | null>(null)

  const { data: cafes = [], isLoading } = useQuery({
    queryKey: ['cafes', searchQuery],
    queryFn: () => getAllCafes(searchQuery || undefined)
  })

  // 過濾掉願望清單，只顯示已打卡的
  const visitedCafes = cafes.filter((c) => !c.wishlist)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (visitedCafes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Coffee className="h-16 w-16 text-muted-foreground/50" />
        <p className="text-muted-foreground text-center">
          {searchQuery ? '找不到符合的咖啡廳' : '還沒有任何紀錄'}
        </p>
        <p className="text-sm text-muted-foreground/70">
          開始打卡您喜愛的咖啡廳吧！
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {visitedCafes.map((cafe) => (
          <div key={cafe.id}>
            <PostCard
              cafe={cafe}
              onClick={() => setSelectedCafe(cafe)}
              onEdit={() => setEditingCafe(cafe)}
            />
          </div>
        ))}
      </Masonry>

      <PostDetailModal
        cafe={selectedCafe}
        open={!!selectedCafe}
        onOpenChange={(open) => !open && setSelectedCafe(null)}
      />

      <EditPostModal
        cafe={editingCafe}
        open={!!editingCafe}
        onOpenChange={(open) => !open && setEditingCafe(null)}
      />
    </div>
  )
}
