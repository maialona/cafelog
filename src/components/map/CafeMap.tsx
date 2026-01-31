import Map, { Marker, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin } from 'lucide-react'

// Mapbox Access Token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface CafeMapProps {
  center: { lat: number; lng: number }
  zoom?: number
  height?: string
  showMarker?: boolean
  markerLabel?: string
  className?: string
}

/**
 * 基本咖啡廳地圖顯示元件 (Mapbox 版本)
 * 用於顯示單一位置的唯讀地圖
 */
export function CafeMap({
  center,
  zoom = 15,
  height = '192px',
  showMarker = true,
  markerLabel, // Mapbox Marker doesn't support hover tooltip easily without state, skipping for simple view or using title
  className = ''
}: CafeMapProps) {
  
  if (!MAPBOX_TOKEN) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-md border border-gray-200 ${className}`} style={{ height }}>
        <p className="text-muted-foreground text-sm">請設定 Mapbox Token</p>
      </div>
    )
  }

  return (
    <div className={`rounded-md overflow-hidden relative ${className}`} style={{ height }}>
      <Map
        initialViewState={{
          longitude: center.lng,
          latitude: center.lat,
          zoom: zoom
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        scrollZoom={false} // Disable scroll zoom for read-only map
      >
        <NavigationControl position="top-right" showCompass={false} />

        {showMarker && (
          <Marker
            longitude={center.lng}
            latitude={center.lat}
            anchor="bottom"
          >
            <MapPin className="h-6 w-6 text-primary fill-primary/20 -mb-1" />
          </Marker>
        )}
      </Map>
    </div>
  )
}
