import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const PropertyMap = ({ latitude, longitude, propertyName, address, city, height = '250px' }) => {
  const [mapKey, setMapKey] = useState(0)
  const containerRef = useRef(null)

  // Force remount when coordinates change
  useEffect(() => {
    setMapKey(prev => prev + 1)
  }, [latitude, longitude])

  if (!latitude || !longitude) {
    return null
  }

  const lat = Number(latitude)
  const lng = Number(longitude)

  if (isNaN(lat) || isNaN(lng)) {
    return null
  }

  return (
    <div ref={containerRef} style={{ height, width: '100%', borderRadius: '10px', overflow: 'hidden' }}>
      <MapContainer
        key={`map-${mapKey}-${lat}-${lng}`}
        center={[lat, lng]}
        zoom={16}
        scrollWheelZoom={false}
        attributionControl={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" subdomains="abcd"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <strong>{propertyName || 'Property'}</strong>
            <br />
            {address}
            {city && <><br />{city}</>}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

export default PropertyMap
