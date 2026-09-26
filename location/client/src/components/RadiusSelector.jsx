const RADIUS_OPTIONS = [
  { label: '1 km', value: 1000 },
  { label: '3 km', value: 3000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '20 km', value: 20000 }
];

export default function RadiusSelector({ value, onChange }) {
  return (
    <div className="radius-selector">
      <span className="radius-selector__label">Radius:</span>
      {RADIUS_OPTIONS.map(opt => (
        <button
          key={opt.value}
          className={`radius-btn ${value === opt.value ? 'radius-btn--active' : ''}`}
          onClick={() => onChange(opt.value)}
          id={`radius-${opt.value}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
