import type { PlacePrediction, PlaceResult } from '@/types/cafe'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string

let placesApiLoaded = false
let loadingPromise: Promise<void> | null = null

/**
 * 動態載入 Google Places API
 */
export async function loadPlacesApi(): Promise<void> {
  if (placesApiLoaded) return
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise((resolve, reject) => {
    if (typeof google !== 'undefined' && google.maps?.places) {
      placesApiLoaded = true
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&language=zh-TW&region=TW`
    script.async = true
    script.defer = true
    script.onload = () => {
      placesApiLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load Google Places API'))
    document.head.appendChild(script)
  })

  return loadingPromise
}

/**
 * 搜尋咖啡廳位置
 * 使用 Google Places API (New)
 */
export async function searchCafes(query: string): Promise<PlacePrediction[]> {
  if (!query || query.length < 2) return []

  await loadPlacesApi()

  try {
    // 使用新版 Place.searchByText API
    const { places } = await google.maps.places.Place.searchByText({
      textQuery: query,
      fields: ['id', 'displayName', 'formattedAddress', 'location'],
      includedType: 'cafe',
      locationBias: {
        center: { lat: 25.033, lng: 121.5654 }, // 台灣中心
        radius: 50000 // 50km
      },
      maxResultCount: 10
    })

    if (!places || places.length === 0) return []

    return places.map((place: google.maps.places.Place) => ({
      placeId: place.id || '',
      mainText: place.displayName || '',
      secondaryText: place.formattedAddress || '',
      fullText: `${place.displayName} - ${place.formattedAddress}`
    }))
  } catch (error) {
    console.error('Places search error:', error)
    // 降級到舊版 API
    return searchCafesLegacy(query)
  }
}

/**
 * 舊版 API 備援
 */
async function searchCafesLegacy(query: string): Promise<PlacePrediction[]> {
  if (!query || query.length < 2) return []

  const autocompleteService = new google.maps.places.AutocompleteService()

  return new Promise((resolve) => {
    autocompleteService.getPlacePredictions(
      {
        input: query,
        types: ['establishment'],
        componentRestrictions: { country: 'tw' }
      },
      (predictions, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          resolve(
            predictions.map((p) => ({
              placeId: p.place_id,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || '',
              fullText: p.description
            }))
          )
        } else {
          resolve([])
        }
      }
    )
  })
}

/**
 * 取得地點詳細資料（含座標）
 */
export async function getPlaceDetails(
  placeId: string
): Promise<PlaceResult | null> {
  if (!placeId) return null

  await loadPlacesApi()

  try {
    // 使用新版 Place.fetchFields API
    const place = new google.maps.places.Place({ id: placeId })
    await place.fetchFields({
      fields: ['displayName', 'formattedAddress', 'location']
    })

    return {
      placeId,
      name: place.displayName || '',
      address: place.formattedAddress || '',
      lat: place.location?.lat() || 0,
      lng: place.location?.lng() || 0
    }
  } catch (error) {
    console.error('Place details error:', error)
    // 降級到舊版 API
    return getPlaceDetailsLegacy(placeId)
  }
}

/**
 * 舊版 API 備援
 */
async function getPlaceDetailsLegacy(
  placeId: string
): Promise<PlaceResult | null> {
  if (!placeId) return null

  const dummyDiv = document.createElement('div')
  const placesService = new google.maps.places.PlacesService(dummyDiv)

  return new Promise((resolve) => {
    placesService.getDetails(
      {
        placeId,
        fields: ['name', 'formatted_address', 'geometry']
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve({
            placeId,
            name: place.name || '',
            address: place.formatted_address || '',
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0
          })
        } else {
          resolve(null)
        }
      }
    )
  })
}

/**
 * 取得 API Key（用於其他用途）
 */
export function getGoogleMapsApiKey(): string {
  return GOOGLE_MAPS_API_KEY || ''
}
