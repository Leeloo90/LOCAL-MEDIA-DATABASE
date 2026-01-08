
import { Project, MediaAsset, TranscriptSegment, MediaType } from '../types';
// Note: parseTranscript is handled by main process in Electron environment

class StoryGraphDB {
  private projects: Project[] = [
    { project_id: 1, name: 'Default Project', description: 'Initial ingest workspace' }
  ];
  private assets: MediaAsset[] = [];
  private segments: TranscriptSegment[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const data = localStorage.getItem('story_graph_db');
    if (data) {
      const parsed = JSON.parse(data);
      this.projects = parsed.projects || this.projects;
      this.assets = parsed.assets || [];
      this.segments = parsed.segments || [];
    }
  }

  private saveToStorage() {
    localStorage.setItem('story_graph_db', JSON.stringify({
      projects: this.projects,
      assets: this.assets,
      segments: this.segments
    }));
  }

  getProjects() { return this.projects; }

  getAssets(projectId: number) {
    return this.assets.filter(a => a.project_id === projectId);
  }

  getTranscripts(assetId: number) {
    return this.segments.filter(s => s.asset_id === assetId);
  }

  async ingestFiles(files: File[], projectId: number) {
    const newAssets: MediaAsset[] = [];
    
    for (const file of files) {
      // Simulate ffprobe metadata extraction
      const isVideo = file.name.endsWith('.mp4') || file.name.endsWith('.mov');
      const asset: MediaAsset = {
        asset_id: Math.floor(Math.random() * 1000000),
        project_id: projectId,
        file_name: file.name,
        file_path: `/Volumes/Media/${file.name}`,
        start_tc: '00:00:00:00',
        duration_frames: 2400,
        fps: 23.976,
        type: MediaType.BROLL,
        metadata: {
          resolution: isVideo ? '3840x2160' : 'N/A',
          codec: isVideo ? 'ProRes 422' : 'PCM',
          size: file.size
        }
      };
      newAssets.push(asset);
    }

    this.assets = [...this.assets, ...newAssets];
    this.saveToStorage();
    return newAssets;
  }

  async matchTranscripts(transcriptFiles: File[]) {
    for (const file of transcriptFiles) {
      const content = await file.text();
      // Matcher: Strip suffixes (e.g., C0043_SAT.srtx becomes C0043)
      const baseName = file.name.replace(/\.[^/.]+$/, "").split('_')[0];
      
      const matchedAsset = this.assets.find(a => a.file_name.startsWith(baseName));
      
      if (matchedAsset) {
        // Type Promotion
        matchedAsset.type = MediaType.DIALOGUE;
        
        // Note: In mock environment, we simulate parsed segments
        // Real parsing happens in main process via parseTranscript
        const segmentsWithIds: TranscriptSegment[] = [{
          segment_id: Math.floor(Math.random() * 1000000),
          asset_id: matchedAsset.asset_id,
          speaker_label: 'Speaker 1',
          time_in: '00:00:00:00',
          time_out: '00:00:10:00',
          content: 'Mock transcript content',
          word_map: '[]'
        }];
        
        // Replace existing transcripts for this asset if any
        this.segments = [
          ...this.segments.filter(s => s.asset_id !== matchedAsset.asset_id),
          ...segmentsWithIds
        ];
      }
    }
    this.saveToStorage();
  }

  deleteAsset(assetId: number) {
    this.assets = this.assets.filter(a => a.asset_id !== assetId);
    this.segments = this.segments.filter(s => s.asset_id !== assetId);
    this.saveToStorage();
  }
}

export const db = new StoryGraphDB();
