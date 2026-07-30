import React, { useState, useEffect, useRef } from 'react';
import './TaskItem.css';

function notesSnippet(notes, maxWords = 10) {
  if (!notes || !notes.trim()) return '';
  const words = notes.trim().split(/\s+/);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ') + '…';
}

export function TaskItem({
  task,
  isInbox,
  isEditing,
  onStartEdit,
  onEndEdit,
  onTitleChange,
  onComplete,
  onNotesChange,
}) {
  const [editValue, setEditValue] = useState(task.title);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesInput, setNotesInput] = useState(task.notes ?? '');
  const [snippetHeight, setSnippetHeight] = useState(0);
  const inputRef = useRef(null);
  const notesRef = useRef(null);
  const snippetMeasureRef = useRef(null);

  useEffect(() => {
    setEditValue(task.title);
  }, [task.title]);

  useEffect(() => {
    setNotesInput(task.notes ?? '');
  }, [task.notes]);

  useEffect(() => {
    const hasNotesVal = !!(task.notes && task.notes.trim());
    if (snippetMeasureRef.current && hasNotesVal) {
      const h = snippetMeasureRef.current.getBoundingClientRect().height;
      setSnippetHeight(Math.ceil(h));
    }
  }, [task.notes]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (notesOpen && notesRef.current) {
      notesRef.current.focus();
    }
  }, [notesOpen]);

  const handleSubmitEdit = () => {
    const v = editValue.trim();
    if (v) onTitleChange(v);
    onEndEdit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmitEdit();
    if (e.key === 'Escape') {
      setEditValue(task.title);
      onEndEdit();
    }
  };

  const handleArrowClick = () => {
    if (notesOpen) {
      const trimmed = notesInput.trim();
      if (trimmed !== (task.notes ?? '')) onNotesChange?.(trimmed);
      setNotesOpen(false);
    } else {
      setNotesInput(task.notes ?? '');
      setNotesOpen(true);
    }
  };

  const handleSaveNotes = () => {
    const trimmed = notesInput.trim();
    if (trimmed !== (task.notes ?? '')) onNotesChange?.(trimmed);
    setNotesOpen(false);
  };

  const hasNotes = !!(task.notes && task.notes.trim());
  const snippet = notesSnippet(task.notes, 10);

  return (
    <div className="task-item">
      <button
        type="button"
        className="task-item-check"
        onClick={onComplete}
        aria-label={`Mark "${task.title}" complete`}
      />
      <div className="task-item-content">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="task-item-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSubmitEdit}
            onKeyDown={handleKeyDown}
            aria-label="Edit task title"
          />
        ) : (
          <>
            <span
              className="task-item-title"
              onDoubleClick={onStartEdit}
              title="Double-click to rename"
            >
              {task.title}
            </span>
          </>
        )}
        {hasNotes && (
          <div
            ref={snippetMeasureRef}
            style={{ position: 'absolute', left: -9999, visibility: 'hidden' }}
            aria-hidden
          >
            <p className="task-item-notes-snippet">{snippet}</p>
          </div>
        )}
        <div
          className={`task-item-accordion ${notesOpen ? 'open' : hasNotes ? 'open-snippet' : ''}`}
          style={hasNotes && !notesOpen && snippetHeight > 0 ? { '--snippet-height': `${snippetHeight}px` } : undefined}
        >
          <div className="task-item-accordion-inner">
            {notesOpen && (
              <>
                <textarea
                  ref={notesRef}
                  className="task-item-notes-field"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.metaKey && e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveNotes();
                    }
                  }}
                  placeholder="Notes…"
                  aria-label="Notes for this task"
                  rows={3}
                />
                <button
                  type="button"
                  className="task-item-notes-save"
                  onClick={handleSaveNotes}
                >
                  Save
                </button>
              </>
            )}
            {!notesOpen && hasNotes && (
              <div className="task-item-accordion-snippet-wrap">
                <p className="task-item-notes-snippet" aria-hidden>
                  {snippet}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        className={`task-item-arrow ${notesOpen ? 'open' : ''}`}
        onClick={handleArrowClick}
        aria-expanded={notesOpen}
        aria-label={notesOpen ? 'Close notes' : 'Open notes'}
        title={notesOpen ? 'Close notes (⌘↵)' : 'Open notes'}
      >
        <span className="task-item-arrow-icon" aria-hidden>▲</span>
      </button>
    </div>
  );
}
