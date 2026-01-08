
export enum MediaType {
  BROLL = 'BROLL',
  DIALOGUE = 'DIALOGUE'
}

export interface Project {
  project_id: number;
  name: string;
  description: string | null;
  fps: number;
  resolution: string;
  client: string | null;
  status: 'active' | 'archived' | 'completed';
  created_at: string;
  last_edited: string;
}

export interface StoryGraph {
  graph_id: number;
  project_id: number;
  name: string;
  canvas_json: string;
  created_at: string;
}

export interface MediaAsset {
  asset_id: number;
  project_id: number;
  file_name: string;
  file_path: string;
  start_tc: string;
  end_tc: string;
  duration_frames: number;
  fps: number;
  type: MediaType;
  resolution: string;
  size: number;
  metadata: any;
}

export interface TranscriptSegment {
  segment_id: number;
  asset_id: number;
  speaker_label: string;
  time_in: string;
  time_out: string;
  content: string;
  word_map: string; // JSON string of array: [{word: string, in: string, out: string}]
}

export interface IngestSession {
  id: string;
  startTime: number;
  status: 'scanning' | 'parsing' | 'completed' | 'idle';
  foundCount: number;
  processedCount: number;
}
