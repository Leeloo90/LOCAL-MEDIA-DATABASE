
import { Project, MediaAsset, TranscriptSegment, MediaType } from '../types';
import { parseTranscript } from './parser';

declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      scanMedia: (path: string) => Promise<any[]>;
      saveData: (data: string) => Promise<boolean>;
      loadData: () => Promise<string | null>;
    }
  }
}

class StoryGraphDB {
  private projects: Project[] = [
    { project_id: 1, name: 'Main Production Workspace', description: 'Primary media ingest' }
  ];
  private assets: MediaAsset[] = [];
  private segments: TranscriptSegment[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadFromStorage();
  }

  private async loadFromStorage() {
    if (window.electronAPI) {
      const data = await window.electronAPI.loadData();
      if (data) {
        const parsed = JSON.parse(data);
        this.projects = parsed.projects || this.projects;
        this.assets = parsed.assets || [];
        this.segments = parsed.segments || [];
        return;
      }
    }
    
    // Fallback to localStorage if not in Electron (e.g. preview)
    const localData = localStorage.getItem('story_graph_db');
    if (localData) {
      const parsed = JSON.parse(localData);
      this.projects = parsed.projects || this.projects;
      this.assets = parsed.assets || [];
      this.segments = parsed.segments || [];
    }
  }

  private async saveToStorage() {
    const payload = JSON.stringify({
      projects: this.projects,
      assets: this.assets,
      segments: this.segments
    });

    if (window.electronAPI) {
      await window.electronAPI.saveData(payload);
    } else {
      localStorage.setItem('story_graph_db', payload);
    }
  }

  getProjects() { return this.projects; }

  getAssets(projectId: number) {
    return this.assets.filter(a => a.project_id === projectId);
  }

  getTranscripts(assetId: number) {
    return this.segments.filter(s => s.asset_id === assetId);
  }

  async ingestFromFolder(projectId: number) {
    if (!window.electronAPI) {
       console.warn("Native folder selection requires Electron environment.");
       return [];
    }

    const folderPath = await window.electronAPI.selectFolder();
    if (!folderPath) return [];

    const scannedFiles = await window.electronAPI.scanMedia(folderPath);
    
    const newAssets: MediaAsset[] = scannedFiles.map(data => ({
      ...data,
      asset_id: Math.floor(Math.random() * 1000000),
      project_id: projectId,
      type: MediaType.BROLL,
    }));

    this.assets = [...this.assets, ...newAssets];
    await this.saveToStorage();
    return newAssets;
  }

  async matchTranscripts(transcriptFiles: File[]) {
    for (const file of transcriptFiles) {
      const content = await file.text();
      // Matcher: Strip suffixes (e.g., C0043_SAT.txt becomes C0043)
      const baseName = file.name.replace(/\.[^/.]+$/, "").split('_')[0];
      
      const matchedAsset = this.assets.find(a => a.file_name.startsWith(baseName));
      
      if (matchedAsset) {
        matchedAsset.type = MediaType.DIALOGUE;
        const parsedSegments = parseTranscript(content, matchedAsset.asset_id);
        const segmentsWithIds = parsedSegments.map(s => ({
          ...s,
          segment_id: Math.floor(Math.random() * 1000000),
          word_data: []
        })) as TranscriptSegment[];
        
        this.segments = [
          ...this.segments.filter(s => s.asset_id !== matchedAsset.asset_id),
          ...segmentsWithIds
        ];
      }
    }
    await this.saveToStorage();
  }

  async deleteAsset(assetId: number) {
    this.assets = this.assets.filter(a => a.asset_id !== assetId);
    this.segments = this.segments.filter(s => s.asset_id !== assetId);
    await this.saveToStorage();
  }
}

export const db = new StoryGraphDB();
