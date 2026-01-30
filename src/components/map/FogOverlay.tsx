import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

interface FogOverlayProps {
  visitedCoords: Array<{ lat: number; lng: number }>
  revealRadius?: number // 公尺
  fogOpacity?: number
}

/**
 * 迷霧地圖覆蓋層
 * 使用 Canvas 的 destination-out 複合操作實現
 */
export function FogOverlay({
  visitedCoords,
  revealRadius = 200, // 200公尺
  fogOpacity = 0.8
}: FogOverlayProps) {
  const map = useMap()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    // 建立 Canvas 元素
    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.pointerEvents = 'none'
    canvas.style.zIndex = '500'
    canvasRef.current = canvas

    // 取得地圖容器並加入 canvas
    const mapContainer = map.getContainer()
    mapContainer.appendChild(canvas)

    // 繪製函數
    const drawFog = () => {
      const size = map.getSize()
      canvas.width = size.x
      canvas.height = size.y

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // 先填滿整個畫布為迷霧色（淡灰色帶噪點效果）
      ctx.fillStyle = `rgba(128, 128, 128, ${fogOpacity})`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 加入噪點紋理效果
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 20
        data[i] = Math.max(0, Math.min(255, data[i] + noise)) // R
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise)) // G
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise)) // B
      }
      ctx.putImageData(imageData, 0, 0)

      // 使用 destination-out 在已打卡位置挖洞
      ctx.globalCompositeOperation = 'destination-out'

      visitedCoords.forEach((coord) => {
        // 將經緯度轉換為像素座標
        const point = map.latLngToContainerPoint([coord.lat, coord.lng])

        // 計算像素半徑（根據當前縮放級別）
        const metersPerPixel =
          (40075016.686 *
            Math.abs(Math.cos((coord.lat * Math.PI) / 180))) /
          Math.pow(2, map.getZoom() + 8)
        const pixelRadius = revealRadius / metersPerPixel

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

    // 監聽地圖移動和縮放事件
    map.on('move', drawFog)
    map.on('zoom', drawFog)
    map.on('resize', drawFog)

    // 清理
    return () => {
      map.off('move', drawFog)
      map.off('zoom', drawFog)
      map.off('resize', drawFog)
      if (canvasRef.current && mapContainer.contains(canvasRef.current)) {
        mapContainer.removeChild(canvasRef.current)
      }
    }
  }, [map, visitedCoords, revealRadius, fogOpacity])

  return null
}
