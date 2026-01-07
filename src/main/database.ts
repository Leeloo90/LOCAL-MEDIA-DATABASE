import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

let db: Database.Database | null = null;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS projects (
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS media_assets (
    asset_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    start_tc TEXT NOT NULL,
    duration_frames INTEGER NOT NULL,
    fps REAL NOT NULL,
    type TEXT CHECK(type IN ('BROLL', 'DIALOGUE')) NOT NULL DEFAULT 'BROLL',
    metadata TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transcript_segments (
    segment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    speaker TEXT NOT NULL,
    time_in TEXT NOT NULL,
    time_out TEXT NOT NULL,
    content TEXT NOT NULL,
    word_data TEXT,
    FOREIGN KEY (asset_id) REFERENCES media_assets(asset_id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_media_project ON media_assets(project_id);
  CREATE INDEX IF NOT EXISTS idx_segments_asset ON transcript_segments(asset_id);
`;

export function initDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'story_graph.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);

  // Create default project if none exists
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)').run(
      'Main Production Workspace',
      'Primary media ingest'
    );
  }

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// Database operations
export const dbOperations = {
  // Projects
  getProjects() {
    const db = getDatabase();
    return db.prepare('SELECT * FROM projects').all();
  },

  // Media Assets
  getAssets(projectId: number) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM media_assets WHERE project_id = ?').all(projectId);
  },

  insertAsset(asset: {
    project_id: number;
    file_name: string;
    file_path: string;
    start_tc: string;
    duration_frames: number;
    fps: number;
    type: string;
    metadata: string;
  }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO media_assets (project_id, file_name, file_path, start_tc, duration_frames, fps, type, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      asset.project_id,
      asset.file_name,
      asset.file_path,
      asset.start_tc,
      asset.duration_frames,
      asset.fps,
      asset.type,
      asset.metadata
    );
    return result.lastInsertRowid;
  },

  updateAssetType(assetId: number, type: string) {
    const db = getDatabase();
    db.prepare('UPDATE media_assets SET type = ? WHERE asset_id = ?').run(type, assetId);
  },

  deleteAsset(assetId: number) {
    const db = getDatabase();
    db.prepare('DELETE FROM media_assets WHERE asset_id = ?').run(assetId);
  },

  // Transcript Segments
  getSegments(assetId: number) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM transcript_segments WHERE asset_id = ?').all(assetId);
  },

  insertSegment(segment: {
    asset_id: number;
    speaker: string;
    time_in: string;
    time_out: string;
    content: string;
    word_data: string;
  }) {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO transcript_segments (asset_id, speaker, time_in, time_out, content, word_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      segment.asset_id,
      segment.speaker,
      segment.time_in,
      segment.time_out,
      segment.content,
      segment.word_data
    );
    return result.lastInsertRowid;
  },

  deleteSegmentsByAsset(assetId: number) {
    const db = getDatabase();
    db.prepare('DELETE FROM transcript_segments WHERE asset_id = ?').run(assetId);
  },

  // Bulk operations
  insertAssets(assets: any[]) {
    const db = getDatabase();
    const insert = db.prepare(`
      INSERT INTO media_assets (project_id, file_name, file_path, start_tc, duration_frames, fps, type, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((assetList: any[]) => {
      for (const asset of assetList) {
        insert.run(
          asset.project_id,
          asset.file_name,
          asset.file_path,
          asset.start_tc,
          asset.duration_frames,
          asset.fps,
          asset.type,
          asset.metadata
        );
      }
    });

    insertMany(assets);
  },

  insertSegments(segments: any[]) {
    const db = getDatabase();
    const insert = db.prepare(`
      INSERT INTO transcript_segments (asset_id, speaker, time_in, time_out, content, word_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((segmentList: any[]) => {
      for (const segment of segmentList) {
        insert.run(
          segment.asset_id,
          segment.speaker,
          segment.time_in,
          segment.time_out,
          segment.content,
          segment.word_data
        );
      }
    });

    insertMany(segments);
  },

  findAssetByFileName(fileName: string) {
    const db = getDatabase();
    return db.prepare('SELECT * FROM media_assets WHERE file_name LIKE ?').get(`${fileName}%`);
  }
};
