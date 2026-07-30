import React from 'react';
import './CompletedSection.css';

export function CompletedSection({ items, onRestore, onClearCompleted }) {
  if (!items.length) return null;

  return (
    <section className="completed-section" aria-label="Completed tasks">
      <div className="completed-section-panel">
        <div className="completed-section-head">
          <h3 className="completed-section-title">Completed</h3>
          <button
            type="button"
            className="completed-section-clear"
            onClick={onClearCompleted}
            aria-label="Clear completed tasks"
          >
            Clear Completed
          </button>
        </div>
        <ul className="completed-list" role="list">
          {items.map((item) => (
            <li key={item.id} className="completed-item">
              <span className="completed-item-title">{item.title}</span>
              <button
                type="button"
                className="completed-item-restore"
                onClick={() => onRestore(item)}
                aria-label={`Restore "${item.title}" to list`}
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
