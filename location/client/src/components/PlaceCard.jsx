import { formatDistance } from '../utils/distance';

const TYPE_CONFIG = {
  doctor: { icon: '🩺', label: 'Doctor' },
  hospital: { icon: '🏥', label: 'Hospital' },
  medicalShop: { icon: '💊', label: 'Pharmacy' }
};

export default function PlaceCard({ place, selected, onViewDetails, onHover, onDirections }) {
  const config = TYPE_CONFIG[place.type] || TYPE_CONFIG.doctor;

  return (
    <div
      className={`place-card place-card--${place.type}${selected ? ' place-card--selected' : ''}`}
      aria-current={selected ? 'location' : undefined}
      onClick={() => onViewDetails(place)}
      onMouseEnter={() => onHover?.(place)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="place-card__header">
        <div className="place-card__icon">{config.icon}</div>
        <div className="place-card__info">
          <h3 className="place-card__name" title={place.name}>{place.name}</h3>
          {selected && <span className="place-card__destination">Route destination</span>}
          {place.specialty && place.type === 'doctor' && (
            <span className="place-card__specialty">{place.specialty}</span>
          )}
        </div>
        <span className="place-card__distance">
          📍 {formatDistance(place.distance)}
        </span>
      </div>

      {place.address && (
        <p className="place-card__address">
          <span className="place-card__address-icon">📌</span>
          {place.address}
        </p>
      )}

      <div className="place-card__meta">
        {place.rating > 0 && (
          <span className="place-card__rating">
            <span className="place-card__rating-star">⭐</span>
            {place.rating.toFixed(1)}
            {place.reviewsCount > 0 && (
              <span className="place-card__reviews">({place.reviewsCount})</span>
            )}
          </span>
        )}
        {place.phone && (
          <span className="place-card__phone">
            📞 {place.phone}
          </span>
        )}
      </div>

      <div className="place-card__actions">
        <button
          className="place-card__action place-card__action--details"
          onClick={(e) => { e.stopPropagation(); onViewDetails(place); }}
        >
          View Details
        </button>
        <button
          className="place-card__action place-card__action--directions"
          onClick={(event) => { event.stopPropagation(); onDirections?.(place); }}
        >
          Get Directions
        </button>
      </div>
    </div>
  );
}
