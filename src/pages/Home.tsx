import { useState, useMemo } from 'react'
import Masonry from 'react-masonry-css'
import { useQuery } from '@tanstack/react-query'
import { Coffee, Filter, X } from 'lucide-react'
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
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const { data: cafes = [], isLoading } = useQuery({
    queryKey: ['cafes', searchQuery],
    queryFn: () => getAllCafes(searchQuery || undefined)
  })

  const visitedCafes = cafes.filter((c) => !c.wishlist)

  // 收集所有已使用的標籤
  const allUsedTags = useMemo(() => {
    const tagSet = new Set<string>()
    visitedCafes.forEach((c) => (c.tags || []).forEach((t) => tagSet.add(t)))
    return Array.from(tagSet)
  }, [visitedCafes])

  // 按標籤篩選
  const filteredCafes = useMemo(() => {
    if (filterTags.length === 0) return visitedCafes
    return visitedCafes.filter((c) =>
      filterTags.every((tag) => (c.tags || []).includes(tag))
    )
  }, [visitedCafes, filterTags])

  const toggleFilterTag = (tag: string) => {
    setFilterTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

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
      {/* 標籤篩選 */}
      {allUsedTags.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors border ${
              filterTags.length > 0
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-accent border-border'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            篩選標籤
            {filterTags.length > 0 && (
              <span className="bg-primary-foreground/20 px-1.5 rounded-full text-xs">
                {filterTags.length}
              </span>
            )}
          </button>

          {filterTags.length > 0 && (
            <button
              onClick={() => setFilterTags([])}
              className="ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              清除篩選
            </button>
          )}

          {showFilters && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {allUsedTags.map((tag) => {
                const isActive = filterTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleFilterTag(tag)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-colors border ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background hover:bg-accent border-border'
                    }`}
                  >
                    {tag}
                    {isActive && <X className="h-3 w-3 ml-0.5" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {filterTags.length > 0 && (
        <p className="text-sm text-muted-foreground mb-3">
          找到 {filteredCafes.length} 間符合的咖啡廳
        </p>
      )}

      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {filteredCafes.map((cafe) => (
          <div key={cafe.id}>
            <PostCard
              cafe={cafe}
              onClick={() => setSelectedCafe(cafe)}
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
