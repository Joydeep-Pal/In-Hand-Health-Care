import React, { useEffect } from 'react';
import { formatDistance } from '../utils/distance';

const TYPE_CONFIG = {
  doctor: { icon: '🩺', label: 'Doctor' },
  hospital: { icon: '🏥', label: 'Hospital' },
  medicalShop: { icon: '💊', label: 'Pharmacy' }
};

export default function DetailsModal({ place, onClose, onDirections }) {
  // Close on Escape key
  useEffect(() => {
    if (!place) return undefined;
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose, place]);

  if (!place) return null;

  const config = TYPE_CONFIG[place.type] || TYPE_CONFIG.doctor;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal__header">
          <div>
            <h2 className="modal__name">{config.icon} {place.name}</h2>
            {place.specialty && place.type === 'doctor' && (
              <span className="modal__specialty">{place.specialty}</span>
            )}
          </div>
          <button className="modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__body">
          {/* Distance & Rating */}
          <div className="modal__section">
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-600)' }}>
                📍 {formatDistance(place.distance)} away
              </span>
              {place.rating > 0 && (
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gray-700)' }}>
                  ⭐ {place.rating.toFixed(1)}
                  {place.reviewsCount > 0 && (
                    <span style={{ fontWeight: 400, color: 'var(--gray-400)', fontSize: '0.85rem' }}>
                      {' '}({place.reviewsCount} reviews)
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Address */}
          {place.address && (
            <div className="modal__section">
              <h4 className="modal__section-title">Address</h4>
              <p className="modal__detail">
                <span className="modal__detail-icon">📌</span>
                {place.address}
              </p>
              {place.city && (
                <p className="modal__detail" style={{ color: 'var(--gray-500)', fontSize: '0.82rem', paddingLeft: '1.75rem' }}>
                  {[place.city, place.state, place.postalCode].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Contact */}
          {(place.phone || place.website) && (
            <div className="modal__section">
              <h4 className="modal__section-title">Contact</h4>
              {place.phone && (
                <p className="modal__detail">
                  <span className="modal__detail-icon">📞</span>
                  <a href={`tel:${place.phone}`} style={{ color: 'var(--primary-600)', fontWeight: 500 }}>
                    {place.phone}
                  </a>
                </p>
              )}
              {place.website && (
                <p className="modal__detail">
                  <span className="modal__detail-icon">🌐</span>
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--primary-600)', fontWeight: 500, wordBreak: 'break-all' }}
                  >
                    {place.website.replace(/^https?:\/\//, '').slice(0, 40)}
                    {place.website.length > 50 ? '...' : ''}
                  </a>
                </p>
              )}
            </div>
          )}

          {/* Opening Hours */}
          {place.openingHours && place.openingHours.length > 0 && (
            <div className="modal__section">
              <h4 className="modal__section-title">Opening Hours</h4>
              <div className="modal__hours">
                {place.openingHours.map((oh, i) => (
                  <React.Fragment key={i}>
                    <span className="modal__hours-day">{oh.day}</span>
                    <span className="modal__hours-time">{oh.hours}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {place.categories && place.categories.length > 0 && (
            <div className="modal__section">
              <h4 className="modal__section-title">Categories</h4>
              <div className="modal__categories">
                {place.categories.map((cat, i) => (
                  <span key={i} className="modal__category-tag">{cat}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="modal__actions">
            {place.phone && (
              <a href={`tel:${place.phone}`} className="btn btn--primary btn--sm" style={{ textAlign: 'center' }}>
                📞 Call Now
              </a>
            )}
            <button
              type="button"
              onClick={() => onDirections?.(place)}
              className="btn btn--accent btn--sm"
              style={{ textAlign: 'center' }}
            >
              🧭 Get Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
