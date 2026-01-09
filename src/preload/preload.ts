

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialogs
  dialog: {
    openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  },

  // Media Scanning
  media: {
    scan: (paths: string[], projectId: number) => ipcRenderer.invoke('media:scan', paths, projectId),
  },

  // Transcript Matching
  transcript: {
    matchManual: (assetId: number) => ipcRenderer.invoke('transcript:match-manual', assetId),
  },

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

    // Canvas Management
    getCanvases: (projectId: number) => ipcRenderer.invoke('db:getCanvases', projectId),
    createCanvas: (projectId: number, name: string, description?: string) => ipcRenderer.invoke('db:createCanvas', projectId, name, description),
    updateCanvas: (canvasId: number, name: string, description?: string) => ipcRenderer.invoke('db:updateCanvas', canvasId, name, description),
    deleteCanvas: (canvasId: number) => ipcRenderer.invoke('db:deleteCanvas', canvasId),

    // Story Nodes (Canvas State - use canvasId)
    getStoryNodes: (canvasId: number) => ipcRenderer.invoke('db:getStoryNodes', canvasId),
    saveStoryNode: (node: any) => ipcRenderer.invoke('db:saveStoryNode', node),
    updateStoryNodePosition: (nodeId: string, x: number, y: number) => ipcRenderer.invoke('db:updateStoryNodePosition', nodeId, x, y),
    deleteStoryNode: (nodeId: string) => ipcRenderer.invoke('db:deleteStoryNode', nodeId),

    // Story Edges (use canvasId)
    getStoryEdges: (canvasId: number) => ipcRenderer.invoke('db:getStoryEdges', canvasId),
    saveStoryEdge: (edge: any) => ipcRenderer.invoke('db:saveStoryEdge', edge),
    deleteStoryEdge: (edgeId: string) => ipcRenderer.invoke('db:deleteStoryEdge', edgeId),

    // Node Enable/Disable
    updateNodeEnabled: (nodeId: string, isEnabled: boolean) => ipcRenderer.invoke('db:updateNodeEnabled', nodeId, isEnabled),

    // Act Operations
    getActs: (canvasId: number) => ipcRenderer.invoke('db:getActs', canvasId),
    createAct: (act: any) => ipcRenderer.invoke('db:createAct', act),
    updateActPosition: (actId: number, x: number, y: number) => ipcRenderer.invoke('db:updateActPosition', actId, x, y),
    deleteAct: (actId: number) => ipcRenderer.invoke('db:deleteAct', actId),

    // Scene Operations
    getScenes: (actId: number) => ipcRenderer.invoke('db:getScenes', actId),
    getScenesByCanvas: (canvasId: number) => ipcRenderer.invoke('db:getScenesByCanvas', canvasId),
    createScene: (scene: any) => ipcRenderer.invoke('db:createScene', scene),
    updateScenePosition: (sceneId: number, x: number, y: number) => ipcRenderer.invoke('db:updateScenePosition', sceneId, x, y),
    deleteScene: (sceneId: number) => ipcRenderer.invoke('db:deleteScene', sceneId),

    // Bucket Operations
    getBucketItems: (projectId: number, canvasId?: number) => ipcRenderer.invoke('db:getBucketItems', projectId, canvasId),
    addBucketItem: (item: any) => ipcRenderer.invoke('db:addBucketItem', item),
    updateBucketItemNotes: (bucketItemId: number, notes: string) => ipcRenderer.invoke('db:updateBucketItemNotes', bucketItemId, notes),
    deleteBucketItem: (bucketItemId: number) => ipcRenderer.invoke('db:deleteBucketItem', bucketItemId),
  },

  // Platform Info
  platform: process.platform,
  versions: process.versions
});
