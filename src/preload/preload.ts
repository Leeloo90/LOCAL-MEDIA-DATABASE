

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Filesystem & Dialogs
  selectFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  scanMedia: (paths: string[]) => ipcRenderer.invoke('media:scan', paths),

  // Metadata Extraction (ffprobe bridge)
  getMetadata: (filePath: string) => ipcRenderer.invoke('get-metadata', filePath),
  matchTranscript: (assetId: number) => ipcRenderer.invoke('transcript:match-manual', assetId),

  // Database Operations (SQLite Bridge)
  db: {
    // Projects
    getProjects: () => ipcRenderer.invoke('db:getProjects'),

    // Media Assets
    getAssets: (projectId: number) => ipcRenderer.invoke('db:getAssets', projectId),
    insertAsset: (asset: any) => ipcRenderer.invoke('db:insertAsset', asset),
    insertAssets: (assets: any[]) => ipcRenderer.invoke('db:insertAssets', assets),
    updateAssetType: (assetId: number, type: string) => ipcRenderer.invoke('db:updateAssetType', assetId, type),
    deleteAsset: (assetId: number) => ipcRenderer.invoke('db:deleteAsset', assetId),
    findAssetByFileName: (fileName: string) => ipcRenderer.invoke('db:findAssetByFileName', fileName),

    // destructive
    clear: () => ipcRenderer.invoke('db:clear'),

    // Transcript Segments
    getSegments: (assetId: number) => ipcRenderer.invoke('db:getSegments', assetId),
    insertSegment: (segment: any) => ipcRenderer.invoke('db:insertSegment', segment),
    insertSegments: (segments: any[]) => ipcRenderer.invoke('db:insertSegments', segments),
    deleteSegmentsByAsset: (assetId: number) => ipcRenderer.invoke('db:deleteSegmentsByAsset', assetId),
    renameSpeaker: (assetId: number, oldName: string, newName: string) => ipcRenderer.invoke('db:renameSpeaker', assetId, oldName, newName),
  },

  // Platform Info
  platform: process.platform,
  versions: process.versions
});
