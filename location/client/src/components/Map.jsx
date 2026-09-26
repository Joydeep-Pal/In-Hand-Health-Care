import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import MapMarker from './MapMarker';

// Fix Leaflet default marker icon path issue with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

// Custom blue pulsing user location icon
const userIcon = L.divIcon({
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:userPulse 2s infinite;"></div>
      <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div>
    </div>
    <style>
      @keyframes userPulse {
        0%,100% { transform:scale(1); opacity:1; }
        50% { transform:scale(1.8); opacity:0.3; }
      }
    </style>
  `,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

/* Re-center and zoom when user location changes */
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

function RouteLayer({ route }) {
  const map = useMap();
  useEffect(() => {
    if (route?.coordinates?.length) {
      map.fitBounds(route.coordinates, { padding: [40, 40], maxZoom: 15, animate: true });
    }
  }, [map, route]);
  if (!route?.coordinates?.length) return null;
  return <Polyline positions={route.coordinates} pathOptions={{ color: '#176b63', weight: 6, opacity: 0.88 }} />;
}

export default function Map({ userLocation, places = [], onViewDetails, onDirections, route, routeLoading, routeError, onClearRoute, onOpenDirections }) {
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [23.68, 86.97]; // Default: Asansol

  const zoom = userLocation ? 14 : 12;

  return (
    <div className="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} zoom={zoom} />
        <RouteLayer route={route} />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="map-popup">
                <h4 className="map-popup__name">📍 Your Location</h4>
                <p className="map-popup__address">
                  {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Healthcare place markers */}
        {places.map(place => (
          <MapMarker
            key={place.id}
            place={place}
            onViewDetails={onViewDetails}
            onDirections={onDirections}
          />
        ))}
      </MapContainer>
      {(route || routeLoading || routeError) && (
        <section className="map-route-panel" aria-live="polite">
          <div>
            <strong>{routeLoading ? 'Finding driving route…' : routeError ? 'Route unavailable' : 'Driving route'}</strong>
            {route && <p>{(route.distance / 1000).toFixed(1)} km · {Math.max(1, Math.round(route.duration / 60))} min</p>}
            {routeError && <p>{routeError}</p>}
          </div>
          {!routeLoading && (
            <div className="map-route-panel__actions">
              {route && <button className="map-route-panel__open" type="button" onClick={onOpenDirections}>Open directions</button>}
              <button type="button" onClick={onClearRoute} aria-label="Clear route">×</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
