
import { Project, MediaAsset, TranscriptSegment, MediaType } from '../types';

declare global {
  interface Window {
    electronAPI: {
      selectFiles: () => Promise<string[] | null>;
      scanMedia: (paths: string[], projectId: number) => Promise<any[]>;
      getMetadata: (filePath: string) => Promise<any>;
      matchTranscript: (assetId: number) => Promise<boolean>;
      db: {
        getProjects: () => Promise<any[]>;
        createProject: (name: string, options?: any) => Promise<number>;
        deleteProject: (projectId: number) => Promise<boolean>;
        touchProject: (projectId: number) => Promise<boolean>;

        getAssets: (projectId: number) => Promise<any[]>;
        insertAsset: (asset: any) => Promise<number>;
        insertAssets: (assets: any[]) => Promise<boolean>;
        updateAssetType: (assetId: number, type: string) => Promise<boolean>;
        deleteAsset: (assetId: number) => Promise<boolean>;
        findAssetByFileName: (fileName: string) => Promise<any>;

        getSegments: (assetId: number) => Promise<any[]>;
        insertSegment: (segment: any) => Promise<number>;
        insertSegments: (segments: any[]) => Promise<boolean>;
        deleteSegmentsByAsset: (assetId: number) => Promise<boolean>;
        renameSpeaker: (assetId: number, oldName: string, newName: string) => Promise<boolean>;
        clear: () => Promise<boolean>;

        // Canvas Management
        getCanvases: (projectId: number) => Promise<any[]>;
        createCanvas: (projectId: number, name: string, description?: string) => Promise<number>;
        updateCanvas: (canvasId: number, name: string, description?: string) => Promise<boolean>;
        deleteCanvas: (canvasId: number) => Promise<boolean>;

        // Story Nodes
        getStoryNodes: (canvasId: number) => Promise<any[]>;
        saveStoryNode: (node: any) => Promise<boolean>;
        updateStoryNodePosition: (nodeId: string, x: number, y: number) => Promise<boolean>;
        deleteStoryNode: (nodeId: string) => Promise<boolean>;
        updateNodeEnabled: (nodeId: string, isEnabled: boolean) => Promise<boolean>;

        // Story Edges
        getStoryEdges: (canvasId: number) => Promise<any[]>;
        saveStoryEdge: (edge: any) => Promise<boolean>;
        deleteStoryEdge: (edgeId: string) => Promise<boolean>;

        // Acts
        getActs: (canvasId: number) => Promise<any[]>;
        createAct: (act: any) => Promise<number>;
        updateActPosition: (actId: number, x: number, y: number) => Promise<boolean>;
        deleteAct: (actId: number) => Promise<boolean>;

        // Scenes
        getScenes: (actId: number) => Promise<any[]>;
        getScenesByCanvas: (canvasId: number) => Promise<any[]>;
        createScene: (scene: any) => Promise<number>;
        updateScenePosition: (sceneId: number, x: number, y: number) => Promise<boolean>;
        deleteScene: (sceneId: number) => Promise<boolean>;

        // Bucket Operations
        getBucketItems: (projectId: number, canvasId?: number) => Promise<any[]>;
        addBucketItem: (item: any) => Promise<number>;
        updateBucketItemNotes: (bucketItemId: number, notes: string) => Promise<boolean>;
        deleteBucketItem: (bucketItemId: number) => Promise<boolean>;
      };
    };
  }
}

class StoryGraphDB {
  // Get all projects from SQLite
  async getProjects(): Promise<Project[]> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return [];
    }
    const projects = await window.electronAPI.db.getProjects();
    return projects.map((p: any) => ({
      project_id: p.project_id,
      name: p.name,
      description: p.description,
      fps: p.fps,
      resolution: p.resolution,
      client: p.client,
      status: p.status,
      created_at: p.created_at,
      last_edited: p.last_edited
    }));
  }

  // Get all assets for a project from SQLite
  async getAssets(projectId: number): Promise<MediaAsset[]> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return [];
    }
    const assets = await window.electronAPI.db.getAssets(projectId);
    return assets.map((a: any) => ({
      asset_id: a.asset_id,
      project_id: a.project_id,
      file_name: a.file_name,
      file_path: a.file_path,
      start_tc: a.start_tc,
      end_tc: a.end_tc,
      duration_frames: a.duration_frames,
      fps: a.fps,
      type: a.type as MediaType,
      resolution: a.resolution,
      size: a.size,
      metadata: a.metadata ? JSON.parse(a.metadata) : {}
    }));
  }

  // Get transcripts for an asset from SQLite
  async getTranscripts(assetId: number): Promise<TranscriptSegment[]> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return [];
    }
    const segments = await window.electronAPI.db.getSegments(assetId);
    return segments.map((s: any) => ({
      segment_id: s.segment_id,
      asset_id: s.asset_id,
      speaker_label: s.speaker_label,
      time_in: s.time_in,
      time_out: s.time_out,
      content: s.content,
      word_map: s.word_map || '[]'
    }));
  }

  // Ingest media files using Electron's filesystem API
  async ingestFiles(projectId: number): Promise<MediaAsset[]> {
    if (!window.electronAPI) {
      console.warn('Native file selection requires Electron environment.');
      return [];
    }

    const filePaths = await window.electronAPI.selectFiles();
    if (!filePaths || filePaths.length === 0) return [];

    const scannedFiles = await window.electronAPI.scanMedia(filePaths, projectId);

    // The data from scanMedia is already in the shape the DB expects.
    await window.electronAPI.db.insertAssets(scannedFiles);

    // Fetch the newly inserted assets
    return await this.getAssets(projectId);
  }

  // Delete an asset and its associated segments
  async deleteAsset(assetId: number): Promise<void> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return;
    }
    await window.electronAPI.db.deleteAsset(assetId);
  }

  // Clear all assets and segments from the database
  async clear(): Promise<void> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return;
    }
    await window.electronAPI.db.clear();
  }

  async matchTranscript(assetId: number): Promise<boolean> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return false;
    }
    return await window.electronAPI.matchTranscript(assetId);
  }
}

export const db = new StoryGraphDB();
