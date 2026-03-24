const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getApps: () => ipcRenderer.invoke('get-apps'),
  launchAll: (apps) => ipcRenderer.send('launch-all', apps)
});