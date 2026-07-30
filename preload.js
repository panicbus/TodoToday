const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('todotoday', {
  storage: {
    read: (name) => ipcRenderer.invoke('storage:read', name),
    write: (name, data) => ipcRenderer.invoke('storage:write', name, data),
    getDataPath: () => ipcRenderer.invoke('storage:getDataPath'),
  },
  onStorageExternalChange: (fn) => {
    ipcRenderer.on('storage-external-change', () => fn());
  },
});
