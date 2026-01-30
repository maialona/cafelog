import { useState, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import type { LatLngExpression, Marker as LeafletMarker } from 'leaflet'
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

interface DraggableMarkerMapProps {
  initialPosition: { lat: number; lng: number }
  onPositionChange: (coords: { lat: number; lng: number }) => void
  height?: string
  zoom?: number
  className?: string
}

/**
 * 可拖曳的標記子元件
 */
function DraggableMarkerComponent({
  position,
  onPositionChange
}: {
  position: { lat: number; lng: number }
  onPositionChange: (coords: { lat: number; lng: number }) => void
}) {
  const markerRef = useRef<LeafletMarker>(null)

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker) {
          const latlng = marker.getLatLng()
          onPositionChange({ lat: latlng.lat, lng: latlng.lng })
        }
      }
    }),
    [onPositionChange]
  )

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[position.lat, position.lng]}
      ref={markerRef}
    />
  )
}

/**
 * 點擊地圖設定位置的事件處理
 */
function MapClickHandler({
  onPositionChange
}: {
  onPositionChange: (coords: { lat: number; lng: number }) => void
}) {
  useMapEvents({
    click(e) {
      onPositionChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    }
  })
  return null
}

/**
 * 可拖曳標記的地圖元件
 * 用於在建立紀錄時微調位置
 */
export function DraggableMarkerMap({
  initialPosition,
  onPositionChange,
  height = '256px',
  zoom = 15,
  className = ''
}: DraggableMarkerMapProps) {
  const [position, setPosition] = useState(initialPosition)

  const handlePositionChange = useCallback(
    (coords: { lat: number; lng: number }) => {
      setPosition(coords)
      onPositionChange(coords)
    },
    [onPositionChange]
  )

  const center: LatLngExpression = [initialPosition.lat, initialPosition.lng]

  return (
    <div className={`rounded-md overflow-hidden ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DraggableMarkerComponent
          position={position}
          onPositionChange={handlePositionChange}
        />
        <MapClickHandler onPositionChange={handlePositionChange} />
      </MapContainer>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        拖曳標記或點擊地圖來調整位置
      </p>
    </div>
  )
}
