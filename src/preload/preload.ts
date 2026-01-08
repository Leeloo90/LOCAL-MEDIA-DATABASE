

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
    createProject: (name: string, options?: any) => ipcRenderer.invoke('db:createProject', name, options),
    updateProject: (projectId: number, updates: any) => ipcRenderer.invoke('db:updateProject', projectId, updates),
    deleteProject: (projectId: number) => ipcRenderer.invoke('db:deleteProject', projectId),
    touchProject: (projectId: number) => ipcRenderer.invoke('db:touchProject', projectId),

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

    // Story Nodes (Canvas State)
    getStoryNodes: (projectId: number) => ipcRenderer.invoke('db:getStoryNodes', projectId),
    saveStoryNode: (node: any) => ipcRenderer.invoke('db:saveStoryNode', node),
    updateStoryNodePosition: (nodeId: string, x: number, y: number) => ipcRenderer.invoke('db:updateStoryNodePosition', nodeId, x, y),
    deleteStoryNode: (nodeId: string) => ipcRenderer.invoke('db:deleteStoryNode', nodeId),
    clearStoryNodes: (projectId: number) => ipcRenderer.invoke('db:clearStoryNodes', projectId),
  },

  // Platform Info
  platform: process.platform,
  versions: process.versions
});
