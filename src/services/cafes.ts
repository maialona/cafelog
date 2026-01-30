import { db } from '@/lib/db'
import type { CafePost, CafePostInput, CafePostUpdate } from '@/types/cafe'

/**
 * 取得所有咖啡廳紀錄
 * @param searchQuery 可選的搜尋關鍵字（搜尋名稱）
 */
export async function getAllCafes(searchQuery?: string): Promise<CafePost[]> {
  let cafes = await db.cafes.orderBy('createdAt').reverse().toArray()

  if (searchQuery) {
    const query = searchQuery.toLowerCase()
    cafes = cafes.filter(
      (cafe) =>
        cafe.name.toLowerCase().includes(query) ||
        cafe.address.toLowerCase().includes(query)
    )
  }

  return cafes
}

/**
 * 取得願望清單中的咖啡廳
 */
export async function getWishlistCafes(): Promise<CafePost[]> {
  return db.cafes
    .where('wishlist')
    .equals(1) // Dexie treats true as 1
    .reverse()
    .sortBy('createdAt')
}

/**
 * 取得已打卡的咖啡廳（非願望清單）
 */
export async function getVisitedCafes(): Promise<CafePost[]> {
  const cafes = await db.cafes.orderBy('createdAt').reverse().toArray()
  return cafes.filter((cafe) => !cafe.wishlist)
}

/**
 * 根據 ID 取得單一咖啡廳紀錄
 */
export async function getCafeById(id: number): Promise<CafePost | undefined> {
  return db.cafes.get(id)
}

/**
 * 建立新的咖啡廳紀錄
 */
export async function createCafe(cafe: CafePostInput): Promise<number> {
  return db.cafes.add({
    ...cafe,
    createdAt: Date.now()
  } as CafePost)
}

/**
 * 更新咖啡廳紀錄
 */
export async function updateCafe(
  id: number,
  updates: CafePostUpdate
): Promise<number> {
  return db.cafes.update(id, updates)
}

/**
 * 刪除咖啡廳紀錄
 */
export async function deleteCafe(id: number): Promise<void> {
  await db.cafes.delete(id)
}

/**
 * 切換願望清單狀態
 */
export async function toggleWishlist(id: number): Promise<void> {
  const cafe = await db.cafes.get(id)
  if (cafe) {
    await db.cafes.update(id, { wishlist: !cafe.wishlist })
  }
}

/**
 * 取得所有已打卡的座標（用於迷霧地圖）
 */
export async function getAllVisitedCoords(): Promise<
  Array<{ lat: number; lng: number }>
> {
  const cafes = await db.cafes.toArray()
  return cafes
    .filter((cafe) => !cafe.wishlist && cafe.coords)
    .map((cafe) => cafe.coords)
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
  const cafes = await db.cafes.toArray()
  const visited = cafes.filter((c) => !c.wishlist)
  const wishlist = cafes.filter((c) => c.wishlist)

  const avgRating =
    visited.length > 0
      ? visited.reduce((sum, c) => sum + c.rating, 0) / visited.length
      : 0

  return {
    total: cafes.length,
    visited: visited.length,
    wishlist: wishlist.length,
    avgRating: Math.round(avgRating * 10) / 10
  }
}
