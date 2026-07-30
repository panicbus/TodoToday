import React from 'react';
import './SearchBar.css';

export function SearchBar({ value, onChange, placeholder = 'Search all...' }) {
  return (
    <div className="search-bar-wrap">
      <span className="search-bar-icon" aria-hidden>🔍</span>
      <input
        type="search"
        className="search-bar-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="search-bar-clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
