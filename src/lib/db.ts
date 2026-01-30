import Dexie, { type Table } from 'dexie'
import type { CafePost } from '@/types/cafe'

/**
 * Cafelog IndexedDB 資料庫
 * 使用 Dexie.js 封裝
 */
class CafelogDatabase extends Dexie {
  cafes!: Table<CafePost, number>

  constructor() {
    super('cafelog')

    this.version(1).stores({
      // 索引欄位：自動遞增 id，以及可搜尋的欄位
      cafes: '++id, name, address, rating, wishlist, createdAt'
    })
  }
}

export const db = new CafelogDatabase()

/**
 * 重置資料庫（開發用）
 */
export async function resetDatabase(): Promise<void> {
  await db.delete()
  await db.open()
}
