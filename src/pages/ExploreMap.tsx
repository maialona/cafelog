import { useState, useMemo } from "react";
import Map, { Marker, Popup, NavigationControl, FullscreenControl, GeolocateControl, MapLayerMouseEvent } from "react-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from "@tanstack/react-query";
import { Map as MapIcon, Coffee, MapPin } from "lucide-react";
import { FogOverlay } from "@/components/map/FogOverlay";
import {
  getAllVisitedCoords,
  getCafeStats,
  getVisitedCafes,
} from "@/services/cafes";
import type { CafePost } from "@/types/cafe";

// Mapbox Access Token
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// 台灣中心座標
const TAIWAN_CENTER = {
    longitude: 121,
    latitude: 23.5,
    zoom: 7
};

export function ExploreMap() {
  const [popupInfo, setPopupInfo] = useState<CafePost | null>(null);

  // 取得所有已打卡座標
  const { data: visitedCoords = [] } = useQuery({
    queryKey: ["visitedCoords"],
    queryFn: getAllVisitedCoords,
  });

  // 取得已打卡的咖啡廳（用於標記）
  const { data: visitedCafes = [] } = useQuery({
    queryKey: ["visitedCafes"],
    queryFn: getVisitedCafes,
  });

  // 取得統計資料
  const { data: stats } = useQuery({
    queryKey: ["cafeStats"],
    queryFn: getCafeStats,
  });

  const markers = useMemo(() => visitedCafes.map((cafe: CafePost) => (
    <Marker
      key={cafe.id}
      longitude={cafe.coords.lng}
      latitude={cafe.coords.lat}
      anchor="bottom"
      onClick={(e: MapLayerMouseEvent) => {
        // If we let the click propagate, it might close the popup
        e.originalEvent.stopPropagation();
        setPopupInfo(cafe);
      }}
    >
        <MapPin className="h-6 w-6 text-primary fill-white cursor-pointer hover:scale-110 transition-transform" />
    </Marker>
  )), [visitedCafes]);

  if (!MAPBOX_TOKEN) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
              <MapIcon className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700">尚未設定 Mapbox Token</h2>
              <p className="text-gray-500 mt-2 text-center max-w-md">
                  請前往 Mapbox 申請 Access Token 並設定於 .env 檔案中 (VITE_MAPBOX_TOKEN)。
              </p>
          </div>
      )
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] md:h-[calc(100vh-1.5rem)]">
      {/* 統計資訊面板 */}
      <div className="absolute top-4 left-4 md:left-4 z-[50] bg-card/95 backdrop-blur rounded-lg shadow-lg p-4 max-w-xs">
        <div className="flex items-center gap-2 mb-3">
          <MapIcon className="h-5 w-5 text-primary" />
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
      <Map
        initialViewState={TAIWAN_CENTER}
        style={{width: '100%', height: '100%'}}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <GeolocateControl position="top-right" />
        <FullscreenControl position="top-right" />
        <NavigationControl position="top-right" />

        {/* 迷霧覆蓋層 */}
        <FogOverlay visitedCoords={visitedCoords} revealRadius={200} />

        {/* 已打卡的咖啡廳標記 */}
        {markers}

        {/* Popup */}
        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.coords.lng}
            latitude={popupInfo.coords.lat}
            onClose={() => setPopupInfo(null)}
            maxWidth="300px"
          >
            <div className="min-w-[200px] p-1">
              <h3 className="font-bold text-lg mb-1">{popupInfo.name}</h3>
              <p className="text-sm text-gray-600 flex items-start gap-1 mb-2">
                  <MapPin className="h-3 w-3 mt-1 shrink-0" />
                  {popupInfo.address}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className="font-medium">{popupInfo.rating}</span>
              </div>
              {popupInfo.notes && (
                  <p className="text-xs text-gray-500 mt-2 border-t pt-2 line-clamp-3">
                      {popupInfo.notes}
                  </p>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* 圖例 */}
      <div className="absolute bottom-8 right-12 md:right-4 z-[50] bg-card/95 backdrop-blur rounded-lg shadow-lg p-3">
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
  );
}
