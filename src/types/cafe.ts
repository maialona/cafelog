/**
 * CafePost - 咖啡廳打卡紀錄的資料結構
 * 依照 PRD 規格設計，使用 IndexedDB 儲存
 */
export interface CafePost {
  id?: number
  googlePlaceId: string
  name: string
  address: string
  coords: {
    lat: number
    lng: number
  }
  rating: number
  photos: Blob[]        // 最多 5 張環境照片
  menuPhotos: Blob[]    // 1-2 張菜單照片
  notes?: string        // 評論/筆記
  wishlist: boolean     // 是否在願望清單中
  createdAt: number     // Unix timestamp
}

/**
 * 用於建立新紀錄的輸入類型（不含 id）
 */
export type CafePostInput = Omit<CafePost, 'id'>

/**
 * 用於更新紀錄的部分類型
 */
export type CafePostUpdate = Partial<Omit<CafePost, 'id' | 'createdAt'>>

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
