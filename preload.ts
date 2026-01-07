

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Filesystem & Dialogs
  selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  scanMedia: (path: string) => ipcRenderer.invoke('media:scan', path),
  
  // Persistent Storage (SQLite Bridge)
  saveData: (jsonString: string) => ipcRenderer.invoke('db:save', jsonString),
  loadData: () => ipcRenderer.invoke('db:load'),
  
  // Platform Info
  // Fix: Accessing Node.js process properties in the preload script
  // We cast to any because the ambient 'Process' type in this context might not include these Node.js-specific properties.
  platform: (process as any).platform,
  versions: (process as any).versions
});
