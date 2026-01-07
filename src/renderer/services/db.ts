
import { Project, MediaAsset, TranscriptSegment, MediaType } from '../types';
import { parseTranscript } from './parser';

declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      scanMedia: (path: string) => Promise<any[]>;
      getMetadata: (filePath: string) => Promise<any>;
      db: {
        getProjects: () => Promise<any[]>;
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
      description: p.description
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
      duration_frames: a.duration_frames,
      fps: a.fps,
      type: a.type as MediaType,
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
      speaker: s.speaker,
      time_in: s.time_in,
      time_out: s.time_out,
      content: s.content,
      word_data: s.word_data ? JSON.parse(s.word_data) : []
    }));
  }

  // Ingest media files from folder using Electron's filesystem API
  async ingestFromFolder(projectId: number): Promise<MediaAsset[]> {
    if (!window.electronAPI) {
      console.warn('Native folder selection requires Electron environment.');
      return [];
    }

    const folderPath = await window.electronAPI.selectFolder();
    if (!folderPath) return [];

    const scannedFiles = await window.electronAPI.scanMedia(folderPath);

    // Prepare assets for bulk insert
    const assetsToInsert = scannedFiles.map(data => ({
      project_id: projectId,
      file_name: data.file_name,
      file_path: data.file_path,
      start_tc: data.start_tc,
      duration_frames: data.duration_frames,
      fps: data.fps,
      type: 'BROLL',
      metadata: JSON.stringify(data.metadata)
    }));

    // Insert all assets into SQLite
    await window.electronAPI.db.insertAssets(assetsToInsert);

    // Fetch the newly inserted assets
    return await this.getAssets(projectId);
  }

  // Match transcript files to existing media assets
  async matchTranscripts(transcriptFiles: File[]): Promise<void> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return;
    }

    for (const file of transcriptFiles) {
      const content = await file.text();
      // Matcher: Strip suffixes (e.g., C0043_SAT.txt becomes C0043)
      const baseName = file.name.replace(/\.[^/.]+$/, "").split('_')[0];

      // Find matching asset in database
      const matchedAsset = await window.electronAPI.db.findAssetByFileName(baseName);

      if (matchedAsset) {
        // Type Promotion: BROLL -> DIALOGUE
        await window.electronAPI.db.updateAssetType(matchedAsset.asset_id, 'DIALOGUE');

        // Parse transcript into segments
        const parsedSegments = parseTranscript(content, matchedAsset.asset_id);

        // Delete old segments for this asset (if any)
        await window.electronAPI.db.deleteSegmentsByAsset(matchedAsset.asset_id);

        // Prepare segments for insertion
        const segmentsToInsert = parsedSegments.map(s => ({
          asset_id: matchedAsset.asset_id,
          speaker: s.speaker,
          time_in: s.time_in,
          time_out: s.time_out,
          content: s.content,
          word_data: JSON.stringify(s.word_data || [])
        }));

        // Insert all segments
        await window.electronAPI.db.insertSegments(segmentsToInsert);
      }
    }
  }

  // Delete an asset and its associated segments
  async deleteAsset(assetId: number): Promise<void> {
    if (!window.electronAPI) {
      console.warn('Electron API not available');
      return;
    }
    await window.electronAPI.db.deleteAsset(assetId);
  }
}

export const db = new StoryGraphDB();
