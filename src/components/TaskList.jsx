import React, { useState, useCallback, useMemo, Fragment } from 'react';
import { TaskItem } from './TaskItem';
import './TaskList.css';

const TASK_MOVE_TYPE = 'application/x-todotoday-task';

export function TaskList({
  listId,
  tasks,
  isInbox,
  editingTaskId,
  onEditingTaskIdChange,
  onToggleComplete,
  onUpdateTask,
  onNotesChange,
  onReorder,
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const sorted = useMemo(() => [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [tasks]);

  const handleDragStart = useCallback(
    (e, index) => {
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
      const task = sorted[index];
      if (task && listId) {
        e.dataTransfer.setData(TASK_MOVE_TYPE, JSON.stringify({ task, sourceListId: listId }));
      }
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      e.dataTransfer.setDragImage(el, e.clientX - rect.left, e.clientY - rect.top);
    },
    [listId, sorted]
  );

  const handleDragOver = useCallback(
    (e, index) => {
      if (draggedIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    [draggedIndex]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e, toIndex) => {
      e.preventDefault();
      if (draggedIndex === null) return;
      setDraggedIndex(null);
      setDragOverIndex(null);
      if (draggedIndex !== toIndex) onReorder(draggedIndex, toIndex);
    },
    [draggedIndex, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <ul className="task-list" role="list">
      {sorted.map((task, index) => (
        <Fragment key={task.id}>
          {dragOverIndex === index && (
            <li className="task-list-drop-line" aria-hidden />
          )}
          <li
            className={`task-list-item ${draggedIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <TaskItem
              task={task}
              isInbox={isInbox}
              isEditing={editingTaskId === task.id}
              onStartEdit={() => onEditingTaskIdChange(task.id)}
              onEndEdit={() => onEditingTaskIdChange(null)}
              onTitleChange={(title) => onUpdateTask(task.id, { title })}
              onComplete={() => onToggleComplete(task)}
              onNotesChange={(notes) => onNotesChange(task.id, notes)}
            />
          </li>
        </Fragment>
      ))}
    </ul>
  );
}
