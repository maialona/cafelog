import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon issue
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// 修復 Leaflet 預設圖標問題
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow
})

interface CafeMapProps {
  center: { lat: number; lng: number }
  zoom?: number
  height?: string
  showMarker?: boolean
  markerLabel?: string
  className?: string
}

/**
 * 基本咖啡廳地圖顯示元件
 * 用於顯示單一位置的唯讀地圖
 */
export function CafeMap({
  center,
  zoom = 15,
  height = '192px',
  showMarker = true,
  markerLabel,
  className = ''
}: CafeMapProps) {
  const position: LatLngExpression = [center.lat, center.lng]

  return (
    <div className={`rounded-md overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {showMarker && (
          <Marker position={position}>
            {markerLabel && <Popup>{markerLabel}</Popup>}
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
