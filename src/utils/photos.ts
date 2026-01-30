/**
 * 照片處理工具函數
 * 處理 Blob 轉換、壓縮與 URL 管理
 */

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB
const MAX_IMAGE_DIMENSION = 1920

/**
 * 將 File 轉換為壓縮後的 Blob
 * @param file 原始檔案
 * @param maxSize 最大尺寸（bytes），預設 2MB
 * @returns 壓縮後的 Blob
 */
export async function compressImage(
  file: File,
  maxSize: number = MAX_IMAGE_SIZE
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      let { width, height } = img

      // 縮放到最大尺寸
      if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
        if (width > height) {
          height = (height / width) * MAX_IMAGE_DIMENSION
          width = MAX_IMAGE_DIMENSION
        } else {
          width = (width / height) * MAX_IMAGE_DIMENSION
          height = MAX_IMAGE_DIMENSION
        }
      }

      canvas.width = width
      canvas.height = height
      ctx?.drawImage(img, 0, 0, width, height)

      // 嘗試不同品質直到符合大小限制
      let quality = 0.9
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            if (blob.size <= maxSize || quality <= 0.1) {
              resolve(blob)
            } else {
              quality -= 0.1
              tryCompress()
            }
          },
          'image/jpeg',
          quality
        )
      }

      tryCompress()
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 從 Blob 建立 Object URL
 * 注意：使用完畢後需要呼叫 revokeObjectURL 釋放記憶體
 */
export function createBlobUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/**
 * 釋放 Object URL 佔用的記憶體
 */
export function revokeBlobUrl(url: string): void {
  URL.revokeObjectURL(url)
}

/**
 * 將 File[] 轉換為壓縮後的 Blob[]
 */
export async function processPhotos(files: File[]): Promise<Blob[]> {
  const blobs: Blob[] = []
  for (const file of files) {
    const compressed = await compressImage(file)
    blobs.push(compressed)
  }
  return blobs
}

/**
 * 從 Blob 讀取為 Data URL（用於預覽）
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
