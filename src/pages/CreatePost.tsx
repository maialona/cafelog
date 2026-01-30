import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Upload, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StarRating } from '@/components/StarRating'
import { DraggableMarkerMap } from '@/components/map/DraggableMarker'
import { useToast } from '@/hooks/use-toast'
import { createCafe } from '@/services/cafes'
import { searchCafes, getPlaceDetails, loadPlacesApi } from '@/services/google-places'
import { processPhotos } from '@/utils/photos'
import type { PlacePrediction, CafePostInput } from '@/types/cafe'

export function CreatePost() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // 表單狀態
  const [cafeName, setCafeName] = useState('')
  const [cafeAddress, setCafeAddress] = useState('')
  const [googlePlaceId, setGooglePlaceId] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [isWishlist, setIsWishlist] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [menuPhotos, setMenuPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [menuPreviews, setMenuPreviews] = useState<string[]>([])

  // 搜尋狀態
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PlacePrediction[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isApiLoaded, setIsApiLoaded] = useState(false)

  // 載入 Places API
  const initPlacesApi = useCallback(async () => {
    if (!isApiLoaded) {
      try {
        await loadPlacesApi()
        setIsApiLoaded(true)
      } catch (error) {
        console.error('Failed to load Places API:', error)
      }
    }
  }, [isApiLoaded])

  // 搜尋地點
  const handleSearch = useCallback(async () => {
    if (!searchQuery || searchQuery.length < 2) return

    await initPlacesApi()
    setIsSearching(true)

    try {
      const results = await searchCafes(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, initPlacesApi])

  // 選擇地點
  const handleSelectPlace = async (prediction: PlacePrediction) => {
    setIsSearching(true)
    const details = await getPlaceDetails(prediction.placeId)

    if (details) {
      setCafeName(details.name)
      setCafeAddress(details.address)
      setGooglePlaceId(details.placeId)
      setCoords({ lat: details.lat, lng: details.lng })
    }

    setSearchResults([])
    setSearchQuery('')
    setIsSearching(false)
  }

  // 處理照片上傳
  const handlePhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'photos' | 'menu'
  ) => {
    const files = Array.from(e.target.files || [])
    const maxCount = type === 'photos' ? 5 : 2
    const currentCount = type === 'photos' ? photos.length : menuPhotos.length

    if (files.length + currentCount > maxCount) {
      toast({
        title: '照片數量超過限制',
        description: `最多只能上傳 ${maxCount} 張${type === 'menu' ? '菜單' : ''}照片`,
        variant: 'destructive'
      })
      return
    }

    // 產生預覽
    const previews = await Promise.all(
      files.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
      })
    )

    if (type === 'photos') {
      setPhotos((prev) => [...prev, ...files])
      setPhotoPreviews((prev) => [...prev, ...previews])
    } else {
      setMenuPhotos((prev) => [...prev, ...files])
      setMenuPreviews((prev) => [...prev, ...previews])
    }
  }

  // 移除照片
  const removePhoto = (index: number, type: 'photos' | 'menu') => {
    if (type === 'photos') {
      setPhotos((prev) => prev.filter((_, i) => i !== index))
      setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
    } else {
      setMenuPhotos((prev) => prev.filter((_, i) => i !== index))
      setMenuPreviews((prev) => prev.filter((_, i) => i !== index))
    }
  }

  // 建立紀錄
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!cafeName) throw new Error('請輸入咖啡廳名稱')
      if (rating === 0 && !isWishlist) throw new Error('請選擇評分')
      if (!coords) throw new Error('請選擇位置')

      // 壓縮並轉換照片為 Blob
      const processedPhotos = await processPhotos(photos)
      const processedMenuPhotos = await processPhotos(menuPhotos)

      const cafeData: CafePostInput = {
        googlePlaceId: googlePlaceId || `manual_${Date.now()}`,
        name: cafeName,
        address: cafeAddress,
        coords,
        rating: isWishlist ? 0 : rating,
        photos: processedPhotos,
        menuPhotos: processedMenuPhotos,
        notes: notes || undefined,
        wishlist: isWishlist,
        createdAt: Date.now()
      }

      return createCafe(cafeData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cafes'] })
      queryClient.invalidateQueries({ queryKey: ['visitedCoords'] })
      queryClient.invalidateQueries({ queryKey: ['cafeStats'] })

      toast({
        title: '成功！',
        description: isWishlist ? '已加入願望清單' : '咖啡廳紀錄已建立'
      })

      navigate(isWishlist ? '/wishlist' : '/my-log')
    },
    onError: (error) => {
      toast({
        title: '錯誤',
        description: error instanceof Error ? error.message : '建立紀錄失敗',
        variant: 'destructive'
      })
    }
  })

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="tracking-wide">
            {isWishlist ? '加入願望清單' : '建立新紀錄'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 願望清單切換 */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="wishlist" className="text-base font-bold tracking-wide leading-relaxed block mb-1">加入願望清單</Label>
              <p className="text-sm text-muted-foreground tracking-wide leading-relaxed">
                標記為想去的咖啡廳
              </p>
            </div>
            <Switch
              id="wishlist"
              checked={isWishlist}
              onCheckedChange={setIsWishlist}
            />
          </div>

          {/* 地點搜尋 */}
          <div className="space-y-2">
            <Label>搜尋咖啡廳位置</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="搜尋咖啡廳..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={initPlacesApi}
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((place) => (
                      <button
                        key={place.placeId}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-accent text-sm"
                        onClick={() => handleSelectPlace(place)}
                      >
                        <div className="font-medium">{place.mainText}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {place.secondaryText}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 咖啡廳名稱 */}
          <div className="space-y-2">
            <Label htmlFor="cafeName">咖啡廳名稱 *</Label>
            <Input
              id="cafeName"
              value={cafeName}
              onChange={(e) => setCafeName(e.target.value)}
              placeholder="輸入咖啡廳名稱"
            />
          </div>

          {/* 地址 */}
          <div className="space-y-2">
            <Label htmlFor="address">地址</Label>
            <Input
              id="address"
              value={cafeAddress}
              onChange={(e) => setCafeAddress(e.target.value)}
              placeholder="輸入地址"
            />
          </div>

          {/* 可拖曳地圖（選擇位置後顯示） */}
          {coords && (
            <div className="space-y-2">
              <Label>調整位置</Label>
              <DraggableMarkerMap
                initialPosition={coords}
                onPositionChange={setCoords}
                height="256px"
              />
            </div>
          )}

          {/* 評分（非願望清單時顯示） */}
          {!isWishlist && (
            <div className="space-y-2">
              <Label>評分 *</Label>
              <StarRating rating={rating} onRatingChange={setRating} size="lg" />
            </div>
          )}

          {/* 照片上傳 */}
          <div className="space-y-2">
            <Label>照片（最多 5 張）</Label>
            <div className="grid grid-cols-3 gap-2">
              {photoPreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-md overflow-hidden"
                >
                  <img
                    src={preview}
                    alt={`照片 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index, 'photos')}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">
                    上傳照片
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e, 'photos')}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 菜單照片 */}
          <div className="space-y-2">
            <Label>菜單照片（最多 2 張）</Label>
            <div className="grid grid-cols-3 gap-2">
              {menuPreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-md overflow-hidden"
                >
                  <img
                    src={preview}
                    alt={`菜單 ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index, 'menu')}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                </div>
              ))}
              {menuPhotos.length < 2 && (
                <label className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground mt-1">
                    上傳菜單
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e, 'menu')}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 筆記 */}
          <div className="space-y-2">
            <Label htmlFor="notes">{isWishlist ? '備註' : '評論'}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isWishlist ? '為什麼想去這家店？' : '分享您的體驗...'}
              rows={4}
            />
          </div>

          {/* 送出按鈕 */}
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                建立中...
              </>
            ) : isWishlist ? (
              '加入願望清單'
            ) : (
              '建立紀錄'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
