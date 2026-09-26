export default function LocationButton({ onRequestLocation, loading }) {
  return (
    <button
      className={`btn btn--primary ${loading ? 'btn--loading' : ''}`}
      onClick={onRequestLocation}
      disabled={loading}
      id="use-location-btn"
    >
      <span className="btn--icon">📍</span>
      {loading ? 'Getting Location...' : 'Use My Current Location'}
    </button>
  );
}
