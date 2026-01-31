import { useEffect, useRef } from 'react'
import { useMap } from 'react-map-gl'

interface FogOverlayProps {
  visitedCoords: Array<{ lat: number; lng: number }>
  revealRadius?: number // 公尺
  fogOpacity?: number
}

/**
 * 迷霧地圖覆蓋層 (Mapbox 版本)
 * 使用 Canvas 的 destination-out 複合操作實現
 */
export function FogOverlay({
  visitedCoords,
  revealRadius = 200, // 200公尺
  fogOpacity = 0.8
}: FogOverlayProps) {
  const { current: mapRef } = useMap()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!mapRef) return

    const map = mapRef.getMap()
    const mapContainer = map.getContainer()
    
    // 建立 Canvas 元素
    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '50' // 確保在地圖之上但在 UI 之下
    canvasRef.current = canvas
    
    // 將 canvas 加入到地圖容器的 canvas container 中，或者直接 append 到 container
    // Mapbox 的 canvas 是 block，我們覆蓋在上面
    mapContainer.appendChild(canvas)

    // 繪製函數
    const drawFog = () => {
      const width = mapContainer.clientWidth
      const height = mapContainer.clientHeight
      // 設定實際解析度以支援 Retina 螢幕
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      ctx.scale(dpr, dpr)

      // 先填滿整個畫布為迷霧色（淡灰色帶噪點效果）
      ctx.fillStyle = `rgba(128, 128, 128, ${fogOpacity})`
      ctx.fillRect(0, 0, width, height)

      // 加入噪點紋理效果 - 降低解析度以提升效能
      // 這裡簡化噪點生成，避免過度消耗效能
      // (若有效能問題可考慮移除或使用圖案填充)

      // 使用 destination-out 在已打卡位置挖洞
      ctx.globalCompositeOperation = 'destination-out'

      visitedCoords.forEach((coord) => {
        // 將經緯度轉換為像素座標
        const point = map.project([coord.lng, coord.lat])

        // 計算像素半徑
        // 簡單估算：在同一緯度上，移動 radius 公尺對應的像素距離
        // 取 center 點和 center + radius(east) 的距離
        // 為了精確，計算該緯度每公尺的像素數
        // distinct formula: 
        // meters per pixel = 40075016.686 * abs(cos(lat * PI/180)) / 2^(zoom + 8)
        // 但 mapbox zoom level 定義有點不同 (512x512 tiles usually)
        // 使用 map.project 計算兩點距離最準確
        
        // 找出一點 (lng, lat) 和 (lng + small_offset, lat) 距離 radius 公尺的點
        // 這裡用簡單公式：緯度 1度 ~= 111km -> 1公尺 ~= 1/111000 度 (緯度)
        // 這樣可以直接 project 兩個點算距離
        const latOffset = revealRadius / 111320
        const pointEdge = map.project([coord.lng, coord.lat + latOffset])
        const pixelRadius = Math.abs(pointEdge.y - point.y)

        // 繪製徑向漸變圓形
        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          pixelRadius
        )
        gradient.addColorStop(0, 'rgba(0, 0, 0, 1)')
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.8)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(point.x, point.y, pixelRadius, 0, Math.PI * 2)
        ctx.fill()
      })

      // 重置複合操作
      ctx.globalCompositeOperation = 'source-over'
    }

    // 初始繪製
    drawFog()

    // 監聽事件
    map.on('move', drawFog)
    map.on('resize', drawFog)
    // Mapbox 的 render 事件頻率很高，move 應該足夠

    return () => {
      map.off('move', drawFog)
      map.off('resize', drawFog)
      if (canvasRef.current && mapContainer.contains(canvasRef.current)) {
        mapContainer.removeChild(canvasRef.current)
      }
    }
  }, [mapRef, visitedCoords, revealRadius, fogOpacity])

  return null
}
