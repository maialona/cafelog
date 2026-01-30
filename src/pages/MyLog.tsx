import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MoreVertical, Trash2, Heart, HeartOff, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StarRating } from '@/components/StarRating'
import { PostDetailModal } from '@/components/PostDetailModal'
import { useToast } from '@/hooks/use-toast'
import { getAllCafes, deleteCafe, toggleWishlist } from '@/services/cafes'
import { createBlobUrl, revokeBlobUrl } from '@/utils/photos'
import type { CafePost } from '@/types/cafe'

function CafeListItem({
  cafe,
  onView,
  onDelete,
  onToggleWishlist
}: {
  cafe: CafePost
  onView: () => void
  onDelete: () => void
  onToggleWishlist: () => void
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)

  useEffect(() => {
    if (cafe.photos && cafe.photos.length > 0) {
      const url = createBlobUrl(cafe.photos[0])
      setPhotoUrl(url)
      return () => revokeBlobUrl(url)
    }
  }, [cafe.photos])

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* 縮圖 */}
          <div
            className="w-20 h-20 rounded-md bg-muted overflow-hidden shrink-0 cursor-pointer"
            onClick={onView}
          >
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={cafe.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                無照片
              </div>
            )}
          </div>

          {/* 資訊 */}
          <div className="flex-1 min-w-0 space-y-1.5 cursor-pointer text-left" onClick={onView}>
            <h3 className="font-bold text-base leading-normal line-clamp-1 tracking-wide hover:text-primary" title={cafe.name}>
              {cafe.name}
            </h3>
            <div>
              <StarRating rating={cafe.rating} size="sm" readonly />
            </div>
            {cafe.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed tracking-wide">
                {cafe.notes}
              </p>
            )}
          </div>

          {/* 選單 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleWishlist}>
                {cafe.wishlist ? (
                  <>
                    <HeartOff className="mr-2 h-4 w-4" />
                    從願望清單移除
                  </>
                ) : (
                  <>
                    <Heart className="mr-2 h-4 w-4" />
                    加入願望清單
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                刪除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

export function MyLog() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [selectedCafe, setSelectedCafe] = useState<CafePost | null>(null)
  const [cafeToDelete, setCafeToDelete] = useState<CafePost | null>(null)

  const { data: cafes = [], isLoading } = useQuery({
    queryKey: ['cafes'],
    queryFn: () => getAllCafes()
  })

  const visitedCafes = cafes.filter((c) => !c.wishlist)
  const wishlistCafes = cafes.filter((c) => c.wishlist)

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCafe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cafes'] })
      queryClient.invalidateQueries({ queryKey: ['visitedCoords'] })
      queryClient.invalidateQueries({ queryKey: ['cafeStats'] })
      toast({ title: '已刪除紀錄' })
      setCafeToDelete(null)
    }
  })

  const toggleWishlistMutation = useMutation({
    mutationFn: (id: number) => toggleWishlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cafes'] })
      toast({ title: '已更新願望清單狀態' })
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          我的日誌
        </h1>
        <Button onClick={() => navigate('/create')}>
          <Plus className="h-4 w-4 mr-2" />
          新增
        </Button>
      </div>

      <Tabs defaultValue="visited">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="visited">
            已造訪 ({visitedCafes.length})
          </TabsTrigger>
          <TabsTrigger value="wishlist">
            願望清單 ({wishlistCafes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visited" className="space-y-3">
          {visitedCafes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              還沒有任何造訪紀錄
            </div>
          ) : (
            visitedCafes.map((cafe) => (
              <CafeListItem
                key={cafe.id}
                cafe={cafe}
                onView={() => setSelectedCafe(cafe)}
                onDelete={() => setCafeToDelete(cafe)}
                onToggleWishlist={() =>
                  cafe.id && toggleWishlistMutation.mutate(cafe.id)
                }
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-3">
          {wishlistCafes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              願望清單是空的
            </div>
          ) : (
            wishlistCafes.map((cafe) => (
              <CafeListItem
                key={cafe.id}
                cafe={cafe}
                onView={() => setSelectedCafe(cafe)}
                onDelete={() => setCafeToDelete(cafe)}
                onToggleWishlist={() =>
                  cafe.id && toggleWishlistMutation.mutate(cafe.id)
                }
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* 詳情 Modal */}
      <PostDetailModal
        cafe={selectedCafe}
        open={!!selectedCafe}
        onOpenChange={(open) => !open && setSelectedCafe(null)}
      />

      {/* 刪除確認 Dialog */}
      <Dialog open={!!cafeToDelete} onOpenChange={() => setCafeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除「{cafeToDelete?.name}」嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCafeToDelete(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                cafeToDelete?.id && deleteMutation.mutate(cafeToDelete.id)
              }
            >
              刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
