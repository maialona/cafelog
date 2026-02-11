/**
 * CafePost - 咖啡廳打卡紀錄的資料結構
 * Supabase 雲端版本
 */
export interface CafePost {
  id: string              // UUID from Supabase
  user_id: string         // User UUID
  google_place_id: string | null
  name: string
  address: string | null
  lat: number | null
  lng: number | null
  rating: number
  notes: string | null
  wishlist: boolean
  visit_date: string | null  // ISO date string (YYYY-MM-DD)
  created_at: string      // ISO timestamp
  tags: string[]          // 標籤列表
  // Photos stored separately in Supabase Storage
  photo_urls: string[]
  menu_photo_urls: string[]
}

/**
 * 用於建立新紀錄的輸入類型
 */
export type CafePostInput = Omit<CafePost, 'id' | 'user_id' | 'created_at'>

/**
 * 用於更新紀錄的部分類型
 */
export type CafePostUpdate = Partial<Omit<CafePost, 'id' | 'user_id' | 'created_at'>>

/**
 * 舊版本相容性：提供 coords 物件
 */
export interface CafePostWithCoords extends CafePost {
  coords: { lat: number; lng: number } | null
}

/**
 * 轉換為帶 coords 的格式
 */
export function toCafePostWithCoords(post: CafePost): CafePostWithCoords {
  return {
    ...post,
    coords: post.lat && post.lng ? { lat: post.lat, lng: post.lng } : null
  }
}

/**
 * Google Places API 搜尋結果預測
 */
export interface PlacePrediction {
  placeId: string
  mainText: string
  secondaryText: string
  fullText: string
}

/**
 * Google Places API 詳細資料
 */
export interface PlaceResult {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
}
