import { useState, useCallback, useEffect } from 'react'
import Map, { Marker, NavigationControl, FullscreenControl, GeolocateControl, MarkerDragEvent } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin } from 'lucide-react'

// Mapbox Access Token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

interface DraggableMarkerMapProps {
  initialPosition: { lat: number; lng: number }
  onPositionChange: (coords: { lat: number; lng: number }) => void
  height?: string
  zoom?: number
  className?: string
}

/**
 * 可拖曳標記的地圖元件 (Mapbox 版本)
 */
export function DraggableMarkerMap({
  initialPosition,
  onPositionChange,
  height = '256px',
  zoom = 15,
  className = ''
}: DraggableMarkerMapProps) {
  const [viewState, setViewState] = useState({
    longitude: initialPosition.lng,
    latitude: initialPosition.lat,
    zoom: zoom
  })
  
  const [marker, setMarker] = useState({
    longitude: initialPosition.lng,
    latitude: initialPosition.lat
  })

  // 當 initialPosition 改變時更新 marker 位置
  useEffect(() => {
    setMarker({
      longitude: initialPosition.lng,
      latitude: initialPosition.lat
    })
    setViewState(prev => ({
      ...prev,
      longitude: initialPosition.lng,
      latitude: initialPosition.lat
    }))
  }, [initialPosition.lat, initialPosition.lng])

  const onMarkerDragEnd = useCallback((event: MarkerDragEvent) => {
    const coords = {
      lat: event.lngLat.lat,
      lng: event.lngLat.lng
    }
    setMarker({
      longitude: coords.lng,
      latitude: coords.lat
    })
    onPositionChange(coords)
  }, [onPositionChange])

  // 點擊地圖時移動 Marker
  const onMapClick = useCallback((event: mapboxgl.MapLayerMouseEvent) => {
    const coords = {
      lat: event.lngLat.lat,
      lng: event.lngLat.lng
    }
    setMarker({
      longitude: coords.lng,
      latitude: coords.lat
    })
    onPositionChange(coords)
  }, [onPositionChange])

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
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={onMapClick}
      >
        <GeolocateControl position="top-left" />
        <FullscreenControl position="top-left" />
        <NavigationControl position="top-left" />

        <Marker
          longitude={marker.longitude}
          latitude={marker.latitude}
          anchor="bottom"
          draggable
          onDragEnd={onMarkerDragEnd}
        >
          <MapPin className="h-8 w-8 text-primary fill-primary/20 -mb-1" />
        </Marker>
      </Map>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        拖曳標記或點擊地圖來調整位置
      </p>
    </div>
  )
}
