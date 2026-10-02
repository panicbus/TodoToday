import React, { useState, useEffect, useCallback } from 'react';
import {
  readInbox,
  writeInbox,
  readList,
  writeList,
  readCompleted,
  writeCompleted,
  readConfig,
  writeConfig,
  onStorageExternalChange,
  getListKey,
} from './services/storage';
import { Sidebar } from './components/Sidebar';
import { TaskArea } from './components/TaskArea';
import './App.css';

const INBOX_ID = 'inbox';

function getListIndexFromId(id) {
  if (id === INBOX_ID) return -1;
  const m = /^list-(\d+)$/.exec(id);
  return m ? parseInt(m[1], 10) : -1;
}

async function loadAllForSearch(listNames, listsOrder) {
  const listIds = listsOrder.length > 0 ? listsOrder : [0, 1, 2, 3, 4].map((i) => getListKey(i));
  const [inbox, ...listData] = await Promise.all([
    readInbox(),
    ...listIds.map((id) => readList(getListIndexFromId(id))),
    readCompleted(),
  ]);
  const completed = listData.pop();
  const inboxName = 'Inbox';
  const all = [];
  (inbox?.tasks || []).forEach((t) => all.push({ ...t, listId: INBOX_ID, listName: inboxName, completed: false }));
  listIds.forEach((id, idx) => {
    const data = listData[idx];
    const name = listNames[id] || data?.name || id;
    (data?.tasks || []).forEach((t) => all.push({ ...t, listId: id, listName: name, completed: false }));
  });
  (completed || []).forEach((c) => {
    const listName = c.listId === INBOX_ID ? 'Inbox' : (listNames[c.listId] || c.listId);
    all.push({ id: c.id, title: c.title, listId: c.listId, listName, completed: true });
  });
  return all;
}

function loadListData(id) {
  if (id === INBOX_ID) return readInbox();
  const index = getListIndexFromId(id);
  if (index >= 0) return readList(index);
  return Promise.resolve(null);
}

function saveListData(id, data) {
  if (id === INBOX_ID) return writeInbox(data);
  const index = getListIndexFromId(id);
  if (index >= 0) return writeList(index, data);
  return Promise.resolve();
}

export default function App() {
  const [currentListId, setCurrentListId] = useState(INBOX_ID);
  const [listMeta, setListMeta] = useState({ name: 'Inbox', tasks: [] });
  const [completed, setCompleted] = useState([]);
  const [listNames, setListNames] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [listsOrder, setListsOrder] = useState([]);
  const [listIdToEdit, setListIdToEdit] = useState(null);
  const [undoToast, setUndoToast] = useState({ show: false, task: null, listId: null, leaving: false });
  const undoToastTimeoutRef = React.useRef(null);
  const undoToastLeaveRef = React.useRef(null);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const w = parseInt(localStorage.getItem('todotoday-sidebar-width'), 10);
      if (Number.isFinite(w) && w >= 180 && w <= 480) return w;
    } catch (_) {}
    return 220;
  });

  const loadCurrentList = useCallback(async (id = currentListId) => {
    const data = await loadListData(id);
    if (!data) return;
    const name = id === INBOX_ID ? 'Inbox' : (data.name || getListKey(getListIndexFromId(id)));
    setListMeta({ name, tasks: data.tasks || [] });
    if (id !== INBOX_ID) setListNames((prev) => ({ ...prev, [id]: name }));
  }, [currentListId]);

  const loadCompleted = useCallback(async () => {
    const data = await readCompleted();
    setCompleted(data);
  }, []);

  const loadAll = useCallback(async (overrideListId) => {
    const config = await readConfig();
    let order = (config.listsOrder && config.listsOrder.length > 0) ? config.listsOrder : [];
    if (order.length === 0) {
      for (let i = 0; i < 5; i++) {
        const d = await readList(i);
        if (d?.name) order.push(getListKey(i));
      }
      if (order.length > 0) await writeConfig({ ...config, listsOrder: order });
    }
    const names = {};
    for (const listId of order) {
      const idx = getListIndexFromId(listId);
      if (idx >= 0) {
        const d = await readList(idx);
        names[listId] = d?.name ?? '';
      }
    }
    setListNames(names);
    setListsOrder(order);
    const listToLoad = overrideListId ?? currentListId;
    await loadCurrentList(listToLoad);
    await loadCompleted();
  }, [currentListId, loadCurrentList]);

  const activeListIds = listsOrder;

  const handleAddList = useCallback(async () => {
    const nextIndex = listsOrder.length === 0
      ? 0
      : Math.max(...listsOrder.map((id) => getListIndexFromId(id)), 0) + 1;
    const id = getListKey(nextIndex);
    const newListNumbers = listsOrder
      .map((listId) => listNames[listId])
      .filter(Boolean)
      .map((n) => {
        if (n === 'New List') return 1;
        const m = /^New List (\d+)$/.exec(n);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((num) => num > 0);
    const nextNum = newListNumbers.length === 0 ? 1 : Math.max(...newListNumbers) + 1;
    const name = nextNum === 1 ? 'New List' : `New List ${nextNum}`;
    await writeList(nextIndex, { name, tasks: [] });
    const newOrder = [id, ...listsOrder];
    setListsOrder(newOrder);
    await writeConfig({ listsOrder: newOrder });
    setListNames((prev) => ({ ...prev, [id]: name }));
    setCurrentListId(id);
    setListIdToEdit(id);
    await loadAll(id);
  }, [listsOrder, listNames, loadAll]);

  const handleDeleteList = useCallback(
    async (id) => {
      const index = getListIndexFromId(id);
      if (index < 0) return;
      await writeList(index, { name: '', tasks: [] });
      setListNames((prev) => ({ ...prev, [id]: '' }));
      const nextOrder = activeListIds.filter((x) => x !== id);
      setListsOrder(nextOrder);
      await writeConfig({ listsOrder: nextOrder });
      if (currentListId === id) setCurrentListId(INBOX_ID);
      await loadAll();
    },
    [currentListId, activeListIds, loadAll]
  );

  const handleReorderLists = useCallback(async (newOrder) => {
    setListsOrder(newOrder);
    await writeConfig({ listsOrder: newOrder });
  }, []);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    return () => {
      if (undoToastTimeoutRef.current) clearTimeout(undoToastTimeoutRef.current);
      if (undoToastLeaveRef.current) clearTimeout(undoToastLeaveRef.current);
    };
  }, []);

  useEffect(() => {
    loadCurrentList(currentListId);
  }, [currentListId, loadCurrentList]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const q = searchQuery.trim().toLowerCase();
    loadAllForSearch(listNames, listsOrder).then((all) => {
      if (cancelled) return;
      const filtered = all.filter((t) => t.title && t.title.toLowerCase().includes(q));
      setSearchResults(filtered);
    });
    return () => { cancelled = true; };
  }, [searchQuery, listNames, listsOrder]);

  const handleExternalChange = useCallback(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    onStorageExternalChange(handleExternalChange);
  }, [handleExternalChange]);

  const persistTasks = useCallback(async (id, tasks) => {
    // Update state before awaiting: TaskArea derives every mutation from the
    // tasks prop, so a gap here lets a second quick interaction compute from
    // the pre-mutation array and undo the first one.
    setListMeta((prev) => ({ ...prev, tasks }));
    if (id === INBOX_ID) {
      await writeInbox({ tasks });
      return;
    }
    // Resolve the name from state rather than re-reading the file: a
    // read-modify-write would clobber a rename landing between the two.
    const name = listNames[id] || listMeta.name || getListKey(getListIndexFromId(id));
    await saveListData(id, { name, tasks });
  }, [listNames, listMeta.name]);

  const persistCompleted = useCallback(async (next) => {
    await writeCompleted(next);
    setCompleted(next);
  }, []);

  const switchList = useCallback((id) => {
    setCurrentListId(id);
  }, []);

  const handleMoveTaskToAnotherList = useCallback(
    async (task, sourceListId, targetListId) => {
      if (sourceListId === targetListId) return;
      const sourceData = await loadListData(sourceListId);
      const targetData = await loadListData(targetListId);
      if (!sourceData || !targetData) return;
      const sourceTasks = (sourceData.tasks || []).filter((t) => t.id !== task.id);
      const sourceWithOrder = sourceTasks.map((t, i) => ({ ...t, order: i }));
      await saveListData(sourceListId, { ...sourceData, tasks: sourceWithOrder });
      const newTask = { ...task, order: (targetData.tasks?.length ?? 0) };
      const targetTasks = [...(targetData.tasks || []), newTask];
      await saveListData(targetListId, { ...targetData, tasks: targetTasks });
      if (currentListId === sourceListId) {
        setListMeta((prev) => ({ ...prev, tasks: sourceWithOrder }));
      } else if (currentListId === targetListId) {
        setListMeta((prev) => ({ ...prev, tasks: targetTasks }));
      }
      await loadCurrentList(currentListId);
    },
    [currentListId, loadCurrentList]
  );

  const handleTaskCompleted = useCallback((task, listId) => {
    if (undoToastTimeoutRef.current) clearTimeout(undoToastTimeoutRef.current);
    if (undoToastLeaveRef.current) clearTimeout(undoToastLeaveRef.current);
    setUndoToast({ show: true, task: { ...task, order: task.order }, listId, leaving: false });
    undoToastTimeoutRef.current = setTimeout(() => {
      setUndoToast((prev) => ({ ...prev, leaving: true }));
      undoToastTimeoutRef.current = null;
      undoToastLeaveRef.current = setTimeout(() => {
        setUndoToast({ show: false, task: null, listId: null, leaving: false });
        undoToastLeaveRef.current = null;
      }, 300);
    }, 3000);
  }, []);

  const handleUndoComplete = useCallback(async () => {
    const { task, listId } = undoToast;
    if (!task || !listId) return;
    if (undoToastTimeoutRef.current) {
      clearTimeout(undoToastTimeoutRef.current);
      undoToastTimeoutRef.current = null;
    }
    if (undoToastLeaveRef.current) {
      clearTimeout(undoToastLeaveRef.current);
      undoToastLeaveRef.current = null;
    }
    setUndoToast({ show: false, task: null, listId: null, leaving: false });
    setCompleted((prev) => prev.filter((c) => c.id !== task.id));
    await writeCompleted(completed.filter((c) => c.id !== task.id));
    if (listId === currentListId) {
      const nextTasks = [...listMeta.tasks, { id: task.id, title: task.title, notes: task.notes, order: task.order ?? listMeta.tasks.length }]
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((t, i) => ({ ...t, order: i }));
      await persistTasks(listId, nextTasks);
    } else {
      const data = await loadListData(listId);
      if (data) {
        const nextTasks = [...(data.tasks || []), { id: task.id, title: task.title, notes: task.notes, order: (data.tasks?.length ?? 0) }]
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((t, i) => ({ ...t, order: i }));
        await saveListData(listId, { ...data, tasks: nextTasks });
      }
    }
  }, [undoToast, completed, currentListId, listMeta, persistTasks]);

  const handleSidebarResize = useCallback((e) => {
    const startX = e.clientX;
    const startW = sidebarWidth;
    const minW = 180;
    const maxW = 480;
    const onMove = (e2) => {
      const delta = e2.clientX - startX;
      let next = startW + delta;
      next = Math.max(minW, Math.min(maxW, next));
      setSidebarWidth(next);
      try {
        localStorage.setItem('todotoday-sidebar-width', String(next));
      } catch (_) {}
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [sidebarWidth]);

  return (
    <div className="app">
      <div className="app-sidebar-with-undo" style={{ width: sidebarWidth, minWidth: sidebarWidth }}>
        <Sidebar
          width={sidebarWidth}
          currentListId={currentListId}
          listNames={listNames}
          activeListIds={activeListIds}
          onSelect={switchList}
          onRename={(id, name) => {
            setListNames((prev) => ({ ...prev, [id]: name }));
            // Inbox is excluded: its rename is never persisted and
            // loadCurrentList hard-codes 'Inbox', so mirroring it here would
            // show a phantom name in the header until the next reload.
            if (id !== INBOX_ID && id === currentListId) {
              setListMeta((prev) => ({ ...prev, name }));
            }
          }}
          onAddList={handleAddList}
          onDeleteList={handleDeleteList}
          onReorderLists={handleReorderLists}
          onMoveTaskTo={handleMoveTaskToAnotherList}
          listIdToEdit={listIdToEdit}
          onClearListIdToEdit={() => setListIdToEdit(null)}
        />
        {undoToast.show && (
          <div
            className={`undo-toast ${undoToast.leaving ? 'undo-toast-leave' : ''}`}
            role="button"
            tabIndex={0}
            onClick={handleUndoComplete}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleUndoComplete(); } }}
            aria-label="Undo complete task"
            aria-live="polite"
          >
            UNDO
          </div>
        )}
      </div>
      <div
        className="app-sidebar-resize"
        onMouseDown={handleSidebarResize}
        role="separator"
        aria-label="Resize sidebar"
      />
      <TaskArea
        listId={currentListId}
        listName={listMeta.name}
        tasks={listMeta.tasks}
        completed={completed}
        onTasksChange={(tasks) => persistTasks(currentListId, tasks)}
        onCompletedChange={persistCompleted}
        onListNameChange={(name) => setListMeta((prev) => ({ ...prev, name }))}
        isInbox={currentListId === INBOX_ID}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchResults={searchResults}
        onSearchResultSelect={(listId) => {
          setCurrentListId(listId);
          setSearchQuery('');
        }}
        onTaskCompleted={handleTaskCompleted}
      />
    </div>
  );
}
