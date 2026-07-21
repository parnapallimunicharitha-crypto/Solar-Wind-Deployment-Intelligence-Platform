import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function SiteMap({ latitude, longitude, label = 'Selected Site' }) {
  if (!latitude || !longitude) {
    return (
      <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm">
        📍 Enter coordinates to view map
      </div>
    )
  }

  const center = [parseFloat(latitude), parseFloat(longitude)]

  return (
    <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={10} className="h-full w-full" key={`${latitude}-${longitude}`}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{label}</p>
              <p className="text-gray-500">Lat: {latitude}, Lon: {longitude}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
