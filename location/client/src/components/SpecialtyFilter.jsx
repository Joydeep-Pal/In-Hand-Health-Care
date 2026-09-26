import { useEffect, useRef, useState } from 'react';

const SPECIALTIES = [
  'All Doctors',
  'Cardiologist',
  'Dermatologist',
  'Endocrinologist',
  'ENT Doctor',
  'Gastroenterologist',
  'Gynecologist',
  'Neurologist',
  'Orthopedic Doctor',
  'Pediatrician',
  'Psychiatrist',
  'Pulmonologist',
  'Rheumatologist'
];

export default function SpecialtyFilter({ value, onChange, visible }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selectedLabel = SPECIALTIES.find((specialty) => (specialty === 'All Doctors' ? '' : specialty) === value) || 'All Doctors';
  const options = SPECIALTIES.filter((specialty) => specialty.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  if (!visible) return null;

  return (
    <div className="specialty-filter" ref={rootRef}>
      <label className="specialty-filter__label" htmlFor="specialty-filter">Doctor type</label>
      <input
        id="specialty-filter"
        className="specialty-filter__input"
        role="combobox"
        aria-expanded={open}
        aria-controls="specialty-filter-options"
        aria-autocomplete="list"
        value={open ? query : selectedLabel}
        placeholder="Search doctor types"
        onFocus={() => { setQuery(''); setOpen(true); }}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
          if (event.key === 'Enter' && options.length) {
            event.preventDefault();
            onChange(options[0] === 'All Doctors' ? '' : options[0]);
            setOpen(false);
          }
        }}
      />
      {open && (
        <div className="specialty-filter__options" id="specialty-filter-options" role="listbox">
          {options.map((specialty) => (
            <button
              key={specialty}
              type="button"
              role="option"
              aria-selected={(specialty === 'All Doctors' ? '' : specialty) === value}
              className="specialty-filter__option"
              onClick={() => {
                onChange(specialty === 'All Doctors' ? '' : specialty);
                setOpen(false);
                setQuery('');
              }}
            >
              {specialty}
            </button>
          ))}
          {!options.length && <p className="specialty-filter__empty">No doctor types found.</p>}
        </div>
      )}
    </div>
  );
}
