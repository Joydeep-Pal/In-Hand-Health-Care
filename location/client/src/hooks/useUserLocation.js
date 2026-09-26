import { useState, useCallback } from 'react';

/**
 * Custom hook for browser geolocation.
 * Handles all states: loading, success, error, unsupported.
 */
export default function useUserLocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Location permission was denied. Please enable it in browser settings or enter your location manually.');
            break;
          case err.POSITION_UNAVAILABLE:
            setError('Location information is unavailable. Please try again or enter your location manually.');
            break;
          case err.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An unknown error occurred while getting your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  }, []);

  const setManualLocation = useCallback((lat, lng) => {
    setLocation({ lat, lng });
    setError(null);
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return { location, loading, error, requestLocation, setManualLocation, clearLocation };
}
