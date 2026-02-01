import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Plus, MapPin, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { getWishlistCafes, deleteCafe, toggleWishlist } from '@/services/cafes'
import type { CafePostWithCoords } from '@/types/cafe'

export function Wishlist() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [cafeToDelete, setCafeToDelete] = useState<CafePostWithCoords | null>(null)

  const { data: wishlistCafes = [], isLoading } = useQuery({
    queryKey: ['wishlistCafes'],
    queryFn: getWishlistCafes
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCafe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlistCafes'] })
      queryClient.invalidateQueries({ queryKey: ['cafes'] })
      toast({ title: '已從願望清單移除' })
      setCafeToDelete(null)
    }
  })

  const markAsVisitedMutation = useMutation({
    mutationFn: (id: string) => toggleWishlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlistCafes'] })
      queryClient.invalidateQueries({ queryKey: ['cafes'] })
      queryClient.invalidateQueries({ queryKey: ['visitedCoords'] })
      toast({ title: '已標記為已造訪' })
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
          <Heart className="h-6 w-6 text-red-500" />
          願望清單
        </h1>
        <Button onClick={() => navigate('/create')}>
          <Plus className="h-4 w-4 mr-2" />
          新增
        </Button>
      </div>

      {wishlistCafes.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">願望清單是空的</p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            發現想去的咖啡廳時，把它加入願望清單吧！
          </p>
          <Button className="mt-4" onClick={() => navigate('/create')}>
            <Plus className="h-4 w-4 mr-2" />
            加入第一家
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {wishlistCafes.map((cafe) => (
            <Card key={cafe.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{cafe.name}</h3>
                    {cafe.address && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        <span>{cafe.address}</span>
                      </div>
                    )}
                    {cafe.notes && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {cafe.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      cafe.id && markAsVisitedMutation.mutate(cafe.id)
                    }
                  >
                    標記為已造訪
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCafeToDelete(cafe)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 刪除確認 Dialog */}
      <Dialog open={!!cafeToDelete} onOpenChange={() => setCafeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要從願望清單移除「{cafeToDelete?.name}」嗎？
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
              移除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
