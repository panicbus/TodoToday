import React, { useState, useEffect, useRef, Fragment } from 'react';
import { getListKey, writeList, readList } from '../services/storage';
import './Sidebar.css';

const INBOX_ID = 'inbox';
const TASK_MOVE_TYPE = 'application/x-todotoday-task';

function getListIndexFromId(id) {
  const m = /^list-(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : -1;
}

export function Sidebar({
  currentListId,
  listNames,
  activeListIds,
  onSelect,
  onRename,
  onAddList,
  onDeleteList,
  onReorderLists,
  onMoveTaskTo,
  listIdToEdit,
  onClearListIdToEdit,
  width,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [taskDropTargetId, setTaskDropTargetId] = useState(null);
  const listEditInputRef = useRef(null);

  const isTaskDrag = (e) => e.dataTransfer.types.includes(TASK_MOVE_TYPE);

  useEffect(() => {
    if (!listIdToEdit) return;
    if (activeListIds.includes(listIdToEdit)) {
      setEditingId(listIdToEdit);
      setEditValue(listNames[listIdToEdit] ?? '');
    }
  }, [listIdToEdit]);

  useEffect(() => {
    if (editingId && editingId === listIdToEdit && listEditInputRef.current) {
      listEditInputRef.current.focus();
      listEditInputRef.current.select();
    }
  }, [editingId, listIdToEdit]);

  const handleStartRename = (id, currentName) => {
    setEditingId(id);
    setEditValue(currentName || '');
  };

  const handleSaveRename = async (id) => {
    const name = editValue.trim() || (id === INBOX_ID ? 'Inbox' : getListKey(getListIndexFromId(id)));
    setEditingId(null);
    onRename(id, name);
    if (id !== INBOX_ID) {
      const index = getListIndexFromId(id);
      if (index >= 0) {
        const data = await readList(index);
        if (data) await writeList(index, { ...data, name });
      }
    }
    if (id === listIdToEdit) onClearListIdToEdit?.();
  };

  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') handleSaveRename(id);
    if (e.key === 'Escape') {
      setEditingId(null);
      setEditValue('');
      if (id === listIdToEdit) onClearListIdToEdit?.();
    }
  };

  const handleDeleteClick = (e, id) => {
    e.stopPropagation();
    onDeleteList(id);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', activeListIds[index]);
  };

  const handleDragOver = (e, index) => {
    if (isTaskDrag(e)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setTaskDropTargetId(activeListIds[index]);
      setDragOverIndex(null);
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
    setTaskDropTargetId(null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setTaskDropTargetId(null);
  };

  const handleDrop = (e, toIndex) => {
    const targetId = activeListIds[toIndex];
    if (isTaskDrag(e)) {
      e.preventDefault();
      setTaskDropTargetId(null);
      setDragOverIndex(null);
      try {
        const raw = e.dataTransfer.getData(TASK_MOVE_TYPE);
        const { task, sourceListId } = JSON.parse(raw);
        if (sourceListId !== targetId && onMoveTaskTo) onMoveTaskTo(task, sourceListId, targetId);
      } catch (_) {}
      return;
    }
    e.preventDefault();
    setDraggedIndex(null);
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === toIndex) return;
    const next = [...activeListIds];
    const [removed] = next.splice(draggedIndex, 1);
    next.splice(toIndex, 0, removed);
    onReorderLists?.(next);
  };

  const handleInboxDragOver = (e) => {
    if (!isTaskDrag(e)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setTaskDropTargetId(INBOX_ID);
  };

  const handleInboxDragLeave = () => setTaskDropTargetId((prev) => (prev === INBOX_ID ? null : prev));

  const handleInboxDrop = (e) => {
    if (!isTaskDrag(e)) return;
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData(TASK_MOVE_TYPE);
      const { task, sourceListId } = JSON.parse(raw);
      if (sourceListId !== INBOX_ID && onMoveTaskTo) onMoveTaskTo(task, sourceListId, INBOX_ID);
    } catch (_) {}
    setTaskDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setTaskDropTargetId(null);
  };

  return (
    <aside className="sidebar" style={{ width: width ?? 220, minWidth: width ?? 220 }}>
      <div className="sidebar-head">
        <h1 className="sidebar-title">TodoToday <span className="sidebar-title-emoji" aria-hidden>🧘</span></h1>
      </div>
      <nav className="sidebar-nav">
        <div
          className={`sidebar-inbox-drop ${taskDropTargetId === INBOX_ID ? 'sidebar-drop-target' : ''}`}
          onDragOver={handleInboxDragOver}
          onDragLeave={handleInboxDragLeave}
          onDrop={handleInboxDrop}
        >
          <button
            className={`sidebar-item ${currentListId === INBOX_ID ? 'active' : ''}`}
            onClick={() => onSelect(INBOX_ID)}
            aria-current={currentListId === INBOX_ID ? 'true' : undefined}
          >
            <span className="sidebar-item-icon">📥</span>
            {editingId === INBOX_ID ? (
              <input
                className="sidebar-edit-input"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleSaveRename(INBOX_ID)}
                onKeyDown={(e) => handleKeyDown(e, INBOX_ID)}
                autoFocus
                aria-label="Rename Inbox"
              />
            ) : (
              <span
                className="sidebar-item-label"
                onDoubleClick={() => handleStartRename(INBOX_ID, 'Inbox')}
                title="Double-click to rename"
              >
                Inbox
              </span>
            )}
          </button>
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-lists-header">
          <span className="sidebar-section-label">Lists</span>
          <button
            type="button"
            className="sidebar-add-btn"
            onClick={onAddList}
            aria-label="Add list"
            title="Add list"
          >
            +
          </button>
        </div>
        {activeListIds.map((id, index) => {
          const name = listNames[id] || id;
          return (
            <Fragment key={id}>
              {dragOverIndex === index && (
                <div className="sidebar-drop-line" aria-hidden />
              )}
              <div
                className={`sidebar-item-wrap ${currentListId === id ? 'active' : ''} ${draggedIndex === index ? 'sidebar-item-dragging' : ''} ${taskDropTargetId === id ? 'sidebar-drop-target' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
              <span className="sidebar-item-drag-handle" title="Drag to reorder" aria-hidden>⋮⋮</span>
              <button
                className="sidebar-item"
                onClick={() => onSelect(id)}
                aria-current={currentListId === id ? 'true' : undefined}
              >
                {editingId === id ? (
                  <input
                    ref={id === listIdToEdit ? listEditInputRef : undefined}
                    className="sidebar-edit-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => handleSaveRename(id)}
                    onKeyDown={(e) => handleKeyDown(e, id)}
                    autoFocus={id !== listIdToEdit}
                    aria-label={`Rename ${name}`}
                  />
                ) : (
                  <span
                    className="sidebar-item-label"
                    onDoubleClick={() => handleStartRename(id, name)}
                    title="Double-click to rename"
                  >
                    {name}
                  </span>
                )}
              </button>
              <button
                type="button"
                className="sidebar-delete-btn"
                onClick={(e) => handleDeleteClick(e, id)}
                aria-label={`Delete list ${name}`}
                title="Delete list"
              >
                🗑
              </button>
            </div>
            </Fragment>
          );
        })}
      </nav>
    </aside>
  );
}
