import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useQuery } from '@tanstack/react-query'
import { Map, Coffee, MapPin } from 'lucide-react'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { FogOverlay } from '@/components/map/FogOverlay'
import { getAllVisitedCoords, getCafeStats, getVisitedCafes } from '@/services/cafes'
import type { CafePost } from '@/types/cafe'

// 修復 Leaflet 預設圖標
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

// 台灣中心座標
const TAIWAN_CENTER: [number, number] = [23.5, 121]
const DEFAULT_ZOOM = 8

export function ExploreMap() {
  const [mapReady, setMapReady] = useState(false)

  // 取得所有已打卡座標
  const { data: visitedCoords = [] } = useQuery({
    queryKey: ['visitedCoords'],
    queryFn: getAllVisitedCoords
  })

  // 取得已打卡的咖啡廳（用於標記）
  const { data: visitedCafes = [] } = useQuery({
    queryKey: ['visitedCafes'],
    queryFn: getVisitedCafes
  })

  // 取得統計資料
  const { data: stats } = useQuery({
    queryKey: ['cafeStats'],
    queryFn: getCafeStats
  })

  return (
    <div className="relative h-[calc(100vh-4rem)] md:h-[calc(100vh-1.5rem)]">
      {/* 統計資訊面板 */}
      <div className="absolute top-4 left-4 z-[600] bg-card/95 backdrop-blur rounded-lg shadow-lg p-4 max-w-xs">
        <div className="flex items-center gap-2 mb-3">
          <Map className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">探索地圖</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Coffee className="h-4 w-4 text-muted-foreground" />
            <span>已造訪: {stats?.visited || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>解鎖點: {visitedCoords.length}</span>
          </div>
        </div>
        {visitedCoords.length === 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            開始打卡咖啡廳來解鎖迷霧吧！
          </p>
        )}
      </div>

      {/* 地圖 */}
      <MapContainer
        center={TAIWAN_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 迷霧覆蓋層 */}
        {mapReady && <FogOverlay visitedCoords={visitedCoords} revealRadius={200} />}

        {/* 已打卡的咖啡廳標記 */}
        {visitedCafes.map((cafe: CafePost) => (
          <Marker
            key={cafe.id}
            position={[cafe.coords.lat, cafe.coords.lng]}
          >
            <Popup>
              <div className="min-w-[150px]">
                <h3 className="font-semibold">{cafe.name}</h3>
                <p className="text-xs text-muted-foreground">{cafe.address}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm">{cafe.rating}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* 圖例 */}
      <div className="absolute bottom-4 right-4 z-[600] bg-card/95 backdrop-blur rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="w-4 h-4 rounded-full bg-gray-400/80" />
          <span>未探索區域</span>
        </div>
        <div className="flex items-center gap-2 text-xs mt-1">
          <div className="w-4 h-4 rounded-full bg-transparent border border-primary" />
          <span>已解鎖 (200m)</span>
        </div>
      </div>
    </div>
  )
}
