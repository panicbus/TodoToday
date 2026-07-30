import React, { useState, useRef, useEffect } from 'react';
import './TaskInput.css';

export function TaskInput({ onAdd, placeholder = 'Add a task…' }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const submit = () => {
    const v = value.trim();
    if (v) {
      onAdd(v);
      setValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="task-input-wrap">
      <input
        ref={inputRef}
        type="text"
        className="task-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      <button
        type="button"
        className="task-input-btn"
        onClick={submit}
        aria-label="Add task"
      >
        Add
      </button>
    </div>
  );
}
