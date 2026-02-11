import { supabase } from '@/lib/supabase'
import type { CafePost, CafePostInput, CafePostUpdate, CafePostWithCoords } from '@/types/cafe'

/**
 * 取得所有咖啡廳紀錄
 * @param searchQuery 可選的搜尋關鍵字（搜尋名稱）
 */
export async function getAllCafes(searchQuery?: string): Promise<CafePostWithCoords[]> {
  let query = supabase
    .from('cafes')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching cafes:', error)
    return []
  }

  return (data || []).map(mapToCafePostWithCoords)
}

/**
 * 取得願望清單中的咖啡廳
 */
export async function getWishlistCafes(): Promise<CafePostWithCoords[]> {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('wishlist', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wishlist:', error)
    return []
  }

  return (data || []).map(mapToCafePostWithCoords)
}

/**
 * 取得已打卡的咖啡廳（非願望清單）
 */
export async function getVisitedCafes(): Promise<CafePostWithCoords[]> {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('wishlist', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching visited cafes:', error)
    return []
  }

  return (data || []).map(mapToCafePostWithCoords)
}

/**
 * 根據 ID 取得單一咖啡廳紀錄
 */
export async function getCafeById(id: string): Promise<CafePostWithCoords | undefined> {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching cafe:', error)
    return undefined
  }

  return data ? mapToCafePostWithCoords(data) : undefined
}

/**
 * 建立新的咖啡廳紀錄
 */
export async function createCafe(cafe: CafePostInput): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    console.error('User not authenticated')
    return null
  }

  const { data, error } = await supabase
    .from('cafes')
    .insert({
      user_id: user.id,
      google_place_id: cafe.google_place_id,
      name: cafe.name,
      address: cafe.address,
      lat: cafe.lat,
      lng: cafe.lng,
      rating: cafe.rating,
      notes: cafe.notes,
      wishlist: cafe.wishlist,
      visit_date: cafe.visit_date,
      photo_urls: cafe.photo_urls || [],
      menu_photo_urls: cafe.menu_photo_urls || [],
      tags: cafe.tags || []
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating cafe:', error)
    return null
  }

  return data?.id || null
}

/**
 * 更新咖啡廳紀錄
 */
export async function updateCafe(id: string, updates: CafePostUpdate): Promise<boolean> {
  const { error } = await supabase
    .from('cafes')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating cafe:', error)
    return false
  }

  return true
}

/**
 * 刪除咖啡廳紀錄
 */
export async function deleteCafe(id: string): Promise<void> {
  const { error } = await supabase
    .from('cafes')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting cafe:', error)
  }
}

/**
 * 切換願望清單狀態
 */
export async function toggleWishlist(id: string): Promise<void> {
  const cafe = await getCafeById(id)
  if (cafe) {
    await updateCafe(id, { wishlist: !cafe.wishlist })
  }
}

/**
 * 取得所有已打卡的座標（用於迷霧地圖）
 */
export async function getAllVisitedCoords(): Promise<Array<{ lat: number; lng: number }>> {
  const { data, error } = await supabase
    .from('cafes')
    .select('lat, lng')
    .eq('wishlist', false)
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (error) {
    console.error('Error fetching coords:', error)
    return []
  }

  return (data || [])
    .filter((c): c is { lat: number; lng: number } => c.lat !== null && c.lng !== null)
    .map(c => ({ lat: c.lat, lng: c.lng }))
}

/**
 * 計算統計資料
 */
export async function getCafeStats(): Promise<{
  total: number
  visited: number
  wishlist: number
  avgRating: number
}> {
  const { data, error } = await supabase
    .from('cafes')
    .select('wishlist, rating')

  if (error) {
    console.error('Error fetching stats:', error)
    return { total: 0, visited: 0, wishlist: 0, avgRating: 0 }
  }

  const cafes = data || []
  const visited = cafes.filter(c => !c.wishlist)
  const wishlist = cafes.filter(c => c.wishlist)

  const avgRating =
    visited.length > 0
      ? visited.reduce((sum, c) => sum + (c.rating || 0), 0) / visited.length
      : 0

  return {
    total: cafes.length,
    visited: visited.length,
    wishlist: wishlist.length,
    avgRating: Math.round(avgRating * 10) / 10
  }
}

/**
 * 上傳照片到 Supabase Storage
 */
export async function uploadPhoto(file: File, folder: 'photos' | 'menu'): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 清理檔名：移除空格和特殊字元
  const sanitizedName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')  // 替換特殊字元為底線
    .replace(/__+/g, '_')              // 移除連續底線
  
  const fileName = `${user.id}/${folder}/${Date.now()}_${sanitizedName}`
  
  const { error } = await supabase.storage
    .from('cafe-photos')
    .upload(fileName, file)

  if (error) {
    console.error('Error uploading photo:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('cafe-photos')
    .getPublicUrl(fileName)

  return urlData.publicUrl
}

/**
 * Helper: Map database row to CafePostWithCoords
 */
function mapToCafePostWithCoords(row: CafePost): CafePostWithCoords {
  return {
    ...row,
    photo_urls: row.photo_urls || [],
    menu_photo_urls: row.menu_photo_urls || [],
    tags: row.tags || [],
    coords: row.lat && row.lng ? { lat: row.lat, lng: row.lng } : null
  }
}
