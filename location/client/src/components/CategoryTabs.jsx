const CATEGORIES = [
  { key: 'all', label: 'All', icon: '🏥', className: 'all' },
  { key: 'doctors', label: 'Doctors', icon: '🩺', className: 'doctors' },
  { key: 'hospitals', label: 'Hospitals', icon: '🏥', className: 'hospitals' },
  { key: 'medicalShops', label: 'Pharmacies', icon: '💊', className: 'pharmacies' }
];

export default function CategoryTabs({ active, onChange, counts = {} }) {
  return (
    <div className="category-tabs">
      {CATEGORIES.map(cat => (
        <button
          key={cat.key}
          className={`category-tab category-tab--${cat.className} ${active === cat.key ? 'category-tab--active' : ''}`}
          onClick={() => onChange(cat.key)}
          id={`tab-${cat.key}`}
        >
          <span className="category-tab__icon">{cat.icon}</span>
          {cat.label}
          {counts[cat.key] != null && (
            <span className="category-tab__count">{counts[cat.key]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
