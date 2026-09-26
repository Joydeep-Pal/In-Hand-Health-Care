import PlaceCard from './PlaceCard';
import Loading from './Loading';

export default function PlaceList({ places, loading, error, category, selectedPlaceId, onViewDetails, onHover, onDirections }) {
  if (loading) {
    const loadingTexts = {
      all: 'Loading nearby healthcare...',
      doctors: 'Loading nearby doctors...',
      hospitals: 'Loading nearby hospitals...',
      medicalShops: 'Loading nearby pharmacies...'
    };
    return <Loading text={loadingTexts[category] || 'Loading...'} />;
  }

  if (error) {
    return (
      <div className="error-state">
        <span className="error-state__icon">⚠️</span>
        <p className="error-state__text">{error}</p>
      </div>
    );
  }

  if (!places || places.length === 0) {
    const emptyTexts = {
      all: 'No healthcare facilities found nearby.',
      doctors: 'No doctors found within the selected radius.',
      hospitals: 'No hospitals found within the selected radius.',
      medicalShops: 'No pharmacies found within the selected radius.'
    };
    return (
      <div className="empty-state">
        <span className="empty-state__icon">🔍</span>
        <h3 className="empty-state__title">No results found</h3>
        <p className="empty-state__text">
          {emptyTexts[category] || 'No results found.'} Try increasing the search radius.
        </p>
      </div>
    );
  }

  return (
    <>
      {places.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          selected={place.id === selectedPlaceId}
          onViewDetails={onViewDetails}
          onHover={onHover}
          onDirections={onDirections}
        />
      ))}
    </>
  );
}
