import React from 'react';
import './SearchResults.css';

export function SearchResults({ results, onSelect }) {
  if (!results.length) {
    return (
      <div className="search-results-empty">
        No tasks match your search.
      </div>
    );
  }

  return (
    <ul className="search-results-list" role="list">
      {results.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            className={`search-results-item ${item.completed ? 'completed' : ''}`}
            onClick={() => onSelect(item.listId)}
            aria-label={`${item.title} in ${item.listName}${item.completed ? ', completed' : ''}`}
          >
            <span className="search-results-list-name">{item.listName}</span>
            <span className="search-results-title">{item.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
