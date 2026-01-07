
export enum MediaType {
  BROLL = 'BROLL',
  DIALOGUE = 'DIALOGUE'
}

export interface Project {
  project_id: number;
  name: string;
  description: string;
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
  speaker: string;
  time_in: string;
  time_out: string;
  content: string;
  word_data: any[];
}

export interface IngestSession {
  id: string;
  startTime: number;
  status: 'scanning' | 'parsing' | 'completed' | 'idle';
  foundCount: number;
  processedCount: number;
}
