import { useState } from 'react';
import { geocodeLocations } from '../services/nearbyService';

export default function SearchLocation({ onLocationFound }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    setError('');
    setResults([]);

    try {
      const matches = await geocodeLocations(query.trim());
      if (matches.length === 1) {
        onLocationFound(matches[0].lat, matches[0].lng, matches[0].displayName);
      } else if (matches.length > 1) {
        setResults(matches);
      } else {
        setError('Location not found. Try a different search term.');
      }
    } catch (searchError) {
      setError(searchError.response ? 'Location search is temporarily unavailable. Try a Google Maps link or coordinates.' : 'Unable to search location. Check your connection and try again.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <form className="search-location" onSubmit={handleSearch}>
      <input
        type="text"
        className="search-location__input"
        placeholder="Search a place or paste a Google Maps link"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        id="manual-location-input"
      />
      <button
        type="submit"
        className={`btn btn--secondary ${searching ? 'btn--loading' : ''}`}
        disabled={searching}
        id="search-location-btn"
      >
        {searching ? '...' : '🔍 Search'}
      </button>
      {results.length > 0 && (
        <div className="search-location__results" role="listbox" aria-label="Location matches">
          {results.map((result) => (
            <button
              key={`${result.lat},${result.lng}`}
              type="button"
              className="search-location__result"
              onClick={() => onLocationFound(result.lat, result.lng, result.displayName)}
            >
              {result.displayName}
            </button>
          ))}
        </div>
      )}
      {error && <p style={{ color: '#fca5a5', fontSize: '0.78rem', width: '100%', textAlign: 'center' }}>{error}</p>}
    </form>
  );
}
