import { useMemo } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { formatDistance } from '../utils/distance';

// Custom colored SVG marker icons for each place type
function createIcon(color, emoji) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 28 16 28s16-16 16-28C32 7.16 24.84 0 16 0z" fill="${color}" stroke="#fff" stroke-width="2"/>
      <circle cx="16" cy="15" r="9" fill="#fff" opacity="0.9"/>
      <text x="16" y="19" text-anchor="middle" font-size="12">${emoji}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -44]
  });
}

const ICONS = {
  doctor: createIcon('#6366f1', '🩺'),
  hospital: createIcon('#ec4899', '🏥'),
  medicalShop: createIcon('#10b981', '💊')
};

export default function MapMarker({ place, onViewDetails, onDirections }) {
  const icon = useMemo(() => ICONS[place.type] || ICONS.doctor, [place.type]);

  return (
    <Marker
      position={[place.location.lat, place.location.lng]}
      icon={icon}
    >
      <Popup>
        <div className="map-popup">
          <h4 className="map-popup__name">{place.name}</h4>
          {place.specialty && place.type === 'doctor' && (
            <p className="map-popup__specialty">{place.specialty}</p>
          )}
          {place.address && (
            <p className="map-popup__address">{place.address}</p>
          )}
          <div className="map-popup__meta">
            {place.rating > 0 && (
              <span className="map-popup__rating">
                ⭐ {place.rating.toFixed(1)}
              </span>
            )}
            <span className="map-popup__distance">
              {formatDistance(place.distance)}
            </span>
          </div>
          <button type="button" className="map-popup__directions" onClick={() => onDirections?.(place)}>
            Show directions on map
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
