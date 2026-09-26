import { useState, useEffect, useCallback, useMemo } from 'react';
import useUserLocation from '../hooks/useUserLocation';
import { getAllNearby, getDrivingRoute } from '../services/nearbyService';
import { getDirectionsUrl } from '../utils/distance';
import LocationButton from '../components/LocationButton';
import SearchLocation from '../components/SearchLocation';
import CategoryTabs from '../components/CategoryTabs';
import RadiusSelector from '../components/RadiusSelector';
import Map from '../components/Map';
import PlaceList from '../components/PlaceList';
import DetailsModal from '../components/DetailsModal';
import './nearby.css';

export default function NearbyHealthcare() {
  const { location, loading: locationLoading, error: locationError, requestLocation, setManualLocation } = useUserLocation();

  const [category, setCategory] = useState('all');
  const [radius, setRadius] = useState(5000);
  const [data, setData] = useState({ doctors: [], hospitals: [], medicalShops: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [command, setCommand] = useState('');
  const [commandMessage, setCommandMessage] = useState('');
  const [listening, setListening] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [route, setRoute] = useState(null);
  const [routeDestination, setRouteDestination] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  // Fetch nearby healthcare data whenever location, radius, or specialty changes
  const fetchData = useCallback(async () => {
    if (!location) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getAllNearby(location.lat, location.lng, radius);
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message || 'Failed to fetch nearby healthcare data.');
      }
    } catch (err) {
      setError(err.response?.data?.message || (
        err.message === 'Network Error'
          ? 'Unable to connect to server. Please ensure the backend is running.'
          : 'An error occurred while fetching data.'
      ));
    } finally {
      setLoading(false);
    }
  }, [location, radius]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Compute visible places based on active category
  const visiblePlaces = useMemo(() => {
    switch (category) {
      case 'doctors': return data.doctors;
      case 'hospitals': return data.hospitals;
      case 'medicalShops': return data.medicalShops;
      default: return [...data.doctors, ...data.hospitals, ...data.medicalShops]
        .sort((a, b) => a.distance - b.distance);
    }
  }, [category, data]);

  const counts = useMemo(() => ({
    all: data.doctors.length + data.hospitals.length + data.medicalShops.length,
    doctors: data.doctors.length,
    hospitals: data.hospitals.length,
    medicalShops: data.medicalShops.length
  }), [data]);

  const handleManualLocation = (lat, lng, displayName) => {
    setManualLocation(lat, lng);
    setShowManualSearch(false);
  };

  const handleDirections = async (place) => {
    if (!location) return;
    setSelectedPlace(null);
    setRoute(null);
    setRouteDestination(place.location);
    setRouteError('');
    setRouteLoading(true);
    try {
      setRoute(await getDrivingRoute(location, place.location));
    } catch (routeRequestError) {
      setRouteError(routeRequestError.message || 'Could not calculate a route.');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleSearchCommand = (rawCommand) => {
    const normalizedCommand = rawCommand.toLowerCase();
    const targets = [
      { category: 'medicalShops', label: 'pharmacy', places: data.medicalShops, pattern: /\b(pharmacies|pharmacy|chemists?|medical shops?|medical stores?|drug stores?)\b/ },
      { category: 'hospitals', label: 'hospital', places: data.hospitals, pattern: /\bhospitals?\b/ },
      { category: 'doctors', label: 'doctor', places: data.doctors, pattern: /\b(doctors?|physicians?)\b/ },
    ];
    const target = targets.find(({ pattern }) => pattern.test(normalizedCommand));

    if (!target) {
      setCommandMessage('Try asking for the nearest pharmacy, hospital, or doctor.');
      return;
    }

    setCategory(target.category);
    const nearestPlace = [...target.places].sort((first, second) => first.distance - second.distance)[0];
    if (!nearestPlace) {
      setSelectedPlaceId(null);
      setRoute(null);
      setRouteDestination(null);
      setCommandMessage(`No ${target.label}s found within this radius. Try increasing the search radius.`);
      return;
    }

    setSelectedPlaceId(nearestPlace.id);
    setCommandMessage(`Selected ${nearestPlace.name} as the nearest ${target.label}.`);
    handleDirections(nearestPlace);
  };

  const handleVoiceCommand = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setCommandMessage('Voice search is not supported in this browser. Type your request instead.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const spokenCommand = event.results[0][0].transcript;
      setCommand(spokenCommand);
      handleSearchCommand(spokenCommand);
    };
    recognition.onerror = () => setCommandMessage('Could not hear that request. Try again or type it.');
    recognition.onend = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  return (
    <div className="nearby-page">
      {/* Location Hero — shown until location is set */}
      {!location && (
        <section className="location-hero">
          <h2 className="location-hero__title">Find Healthcare Near You</h2>
          <p className="location-hero__subtitle">
            Discover nearby doctors, hospitals, and pharmacies in Asansol & surrounding areas
          </p>
          <div className="location-hero__actions">
            <LocationButton
              onRequestLocation={requestLocation}
              loading={locationLoading}
            />
            <span className="location-hero__divider">OR</span>
            {showManualSearch ? (
              <SearchLocation onLocationFound={handleManualLocation} />
            ) : (
              <button
                className="btn btn--secondary"
                onClick={() => setShowManualSearch(true)}
                id="show-manual-btn"
              >
                🔍 Enter Location Manually
              </button>
            )}
          </div>
          {locationError && (
            <p style={{
              color: '#fca5a5', fontSize: '0.85rem', marginTop: '1rem',
              background: 'rgba(220,38,38,0.15)', padding: '0.6rem 1rem',
              borderRadius: '8px', maxWidth: '500px', margin: '1rem auto 0'
            }}>
              {locationError}
            </p>
          )}
        </section>
      )}

      {/* Dashboard — shown when location is available */}
      {location && (
        <div className="dashboard">
          {/* Location status bar */}
          <div className="location-status">
            <span className="location-status__dot" />
            Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            <button
              onClick={() => { setShowManualSearch(true); }}
              style={{
                marginLeft: '0.5rem', fontSize: '0.78rem', color: 'var(--primary-600)',
                fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer'
              }}
            >
              Change
            </button>
            {showManualSearch && (
              <div style={{ marginLeft: '1rem' }}>
                <SearchLocation onLocationFound={handleManualLocation} />
              </div>
            )}
          </div>

          <section className="nearby-command" aria-label="Healthcare search">
            <form
              className="nearby-command__form"
              onSubmit={(event) => {
                event.preventDefault();
                handleSearchCommand(command);
              }}
            >
              <input
                className="nearby-command__input"
                type="search"
                value={command}
                onChange={(event) => setCommand(event.target.value)}
                placeholder="Try: Find the nearest pharmacy"
                aria-label="Search nearby healthcare"
              />
              <button className="btn btn--primary" type="submit" disabled={loading || !command.trim()}>
                Search
              </button>
              <button
                className="nearby-command__voice"
                type="button"
                onClick={handleVoiceCommand}
                disabled={loading || listening}
                aria-label={listening ? 'Listening for a request' : 'Search by voice'}
                title={listening ? 'Listening' : 'Search by voice'}
              >
                {listening ? 'Listening…' : '🎙 Speak'}
              </button>
            </form>
            {commandMessage && <p className="nearby-command__message" role="status">{commandMessage}</p>}
          </section>

          {/* Filter bar */}
          <div className="filters-bar">
            <CategoryTabs active={category} onChange={setCategory} counts={counts} />
            <RadiusSelector value={radius} onChange={setRadius} />
          </div>

          <Map
            userLocation={location}
            places={visiblePlaces}
            onViewDetails={setSelectedPlace}
            onDirections={handleDirections}
            route={route}
            routeLoading={routeLoading}
            routeError={routeError}
            onClearRoute={() => { setRoute(null); setRouteDestination(null); setRouteError(''); }}
            onOpenDirections={() => routeDestination && window.open(getDirectionsUrl(location, routeDestination), '_blank', 'noopener,noreferrer')}
          />

          <aside className="results-panel">
            <div className="results-panel__header">
              <h2 className="results-panel__title">Nearby Healthcare</h2>
              <span className="results-panel__count">{visiblePlaces.length} found</span>
            </div>
            <div className="results-panel__list">
              <PlaceList
                places={visiblePlaces}
                loading={loading}
                error={error}
                category={category}
                selectedPlaceId={selectedPlaceId}
                onViewDetails={setSelectedPlace}
                onDirections={handleDirections}
              />
            </div>
          </aside>
        </div>
      )}

      {/* Details Modal */}
      <DetailsModal
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        onDirections={handleDirections}
      />
    </div>
  );
}
