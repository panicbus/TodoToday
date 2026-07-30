import React, { useState, useCallback } from 'react';
import { TaskInput } from './TaskInput';
import { TaskList } from './TaskList';
import { SearchBar } from './SearchBar';
import { SearchResults } from './SearchResults';
import { generateId } from '../services/storage';
import peaceImg from '../../assets/images/peace.png';
import './TaskArea.css';

export function TaskArea({
  listId,
  listName,
  tasks,
  completed,
  onTasksChange,
  onCompletedChange,
  onListNameChange,
  isInbox,
  searchQuery = '',
  onSearchQueryChange,
  searchResults = [],
  onSearchResultSelect,
  onTaskCompleted,
}) {
  const [editingTaskId, setEditingTaskId] = useState(null);

  const addTask = useCallback(
    (title) => {
      const t = title.trim();
      if (!t) return;
      const newTask = { id: generateId(), title: t, order: tasks.length };
      onTasksChange([...tasks, newTask]);
    },
    [tasks, onTasksChange]
  );

  const toggleComplete = useCallback(
    (task) => {
      onTasksChange(tasks.filter((x) => x.id !== task.id));
      const completedAt = new Date().toISOString();
      onCompletedChange([
        ...completed,
        { id: task.id, title: task.title, listId, completedAt, notes: task.notes },
      ]);
      onTaskCompleted?.(task, listId);
    },
    [tasks, completed, listId, onTasksChange, onCompletedChange, onTaskCompleted]
  );

  const updateTask = useCallback(
    (id, updates) => {
      const next = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
      onTasksChange(next);
    },
    [tasks, onTasksChange]
  );

  const reorderTasks = useCallback(
    (fromIndex, toIndex) => {
      const next = [...tasks];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      const withOrder = next.map((t, i) => ({ ...t, order: i }));
      onTasksChange(withOrder);
    },
    [tasks, onTasksChange]
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className="task-area">
      <header className="task-area-header">
        <div className="task-area-header-row">
          <h2 className="task-area-title">
            {isSearching ? 'Search results' : listName}
          </h2>
          <SearchBar
            value={searchQuery}
            onChange={onSearchQueryChange}
            placeholder="Search all..."
          />
        </div>
      </header>
      <div className="task-area-body">
        {isSearching ? (
          <div className="task-area-search-results">
            <SearchResults
              results={searchResults}
              onSelect={onSearchResultSelect}
            />
          </div>
        ) : (
          <>
            <div className="task-area-scroll">
              {tasks.length === 0 ? (
                <div className="task-area-empty">
                  <h2 className="task-area-empty-title">Rock on, Rocker</h2>
                  <div className="task-area-empty-image" aria-hidden>
                    <img src={peaceImg} alt="" />
                  </div>
                </div>
              ) : (
                <TaskList
                  listId={listId}
                  tasks={tasks}
                  isInbox={isInbox}
                  editingTaskId={editingTaskId}
                  onEditingTaskIdChange={setEditingTaskId}
                  onToggleComplete={toggleComplete}
                  onUpdateTask={updateTask}
                  onNotesChange={(id, notes) => updateTask(id, { notes })}
                  onReorder={reorderTasks}
                />
              )}
            </div>
            <TaskInput onAdd={addTask} placeholder={`Add to ${listName}…`} />
          </>
        )}
      </div>
    </main>
  );
}
