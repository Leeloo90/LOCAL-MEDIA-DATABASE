import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

let db: Database.Database | null = null;

/**
 * UPDATED SCHEMA (v1.4)
 * - Includes end_tc, resolution, codec, and size for professional media tracking.
 */
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
    end_tc TEXT NOT NULL,
    duration_frames INTEGER NOT NULL,
    fps REAL NOT NULL,
    type TEXT CHECK(type IN ('BROLL', 'DIALOGUE')) NOT NULL DEFAULT 'BROLL',
    resolution TEXT,
    codec TEXT,
    size INTEGER,
    metadata TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS transcripts (
    segment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    speaker_label TEXT NOT NULL,
    time_in TEXT NOT NULL,
    time_out TEXT NOT NULL,
    content TEXT NOT NULL,
    word_map TEXT,
    FOREIGN KEY (asset_id) REFERENCES media_assets(asset_id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_media_project ON media_assets(project_id);
  CREATE INDEX IF NOT EXISTS idx_transcripts_asset ON transcripts(asset_id);
`;

export function initDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'story_graph.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);

  // --- AUTO-MIGRATION LOGIC ---
  // This ensures your existing DB file gets the new columns without crashing
  try {
    const tableInfo = db.prepare("PRAGMA table_info(media_assets)").all() as any[];
    const columns = tableInfo.map(col => col.name);

    const requiredColumns = [
      { name: 'end_tc', type: 'TEXT DEFAULT "00:00:00:00" NOT NULL' },
      { name: 'resolution', type: 'TEXT' },
      { name: 'codec', type: 'TEXT' },
      { name: 'size', type: 'INTEGER' }
    ];

    for (const col of requiredColumns) {
      if (!columns.includes(col.name)) {
        db.exec(`ALTER TABLE media_assets ADD COLUMN ${col.name} ${col.type};`);
        console.log(`--- DB MIGRATION: Added ${col.name} column ---`);
      }
    }
  } catch (e) {
    console.error('Migration check failed:', e);
  }

  // --- TRANSCRIPT TABLE MIGRATION ---
  // Migrate from old transcript_segments table to new transcripts table
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    const tableNames = tables.map(t => t.name);

    if (tableNames.includes('transcript_segments')) {
      console.log('--- DB MIGRATION: Migrating transcript_segments to transcripts ---');

      // Copy data from old table to new table
      db.exec(`
        INSERT INTO transcripts (segment_id, asset_id, speaker_label, time_in, time_out, content, word_map)
        SELECT segment_id, asset_id, speaker, time_in, time_out, content, word_data
        FROM transcript_segments;
      `);

      // Drop old table
      db.exec('DROP TABLE transcript_segments;');
      console.log('--- DB MIGRATION: transcript_segments migrated successfully ---');
    }
  } catch (e) {
    console.error('Transcript table migration failed:', e);
  }

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
  getProjects() {
    return getDatabase().prepare('SELECT * FROM projects').all();
  },

  getAssets(projectId: number) {
    return getDatabase().prepare('SELECT * FROM media_assets WHERE project_id = ?').all(projectId);
  },

  insertAssets(assets: any[]) {
    const db = getDatabase();
    const insert = db.prepare(`
      INSERT INTO media_assets (
        project_id, file_name, file_path, start_tc, end_tc, 
        duration_frames, fps, type, resolution, size, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(file_path) DO UPDATE SET
        start_tc = excluded.start_tc,
        end_tc = excluded.end_tc,
        duration_frames = excluded.duration_frames,
        fps = excluded.fps,
        resolution = excluded.resolution,
        size = excluded.size,
        metadata = excluded.metadata
    `);

    const insertMany = db.transaction((assetList: any[]) => {
      for (const asset of assetList) {
        insert.run(
          asset.project_id || 1,
          asset.file_name,
          asset.file_path,
          asset.start_tc,
          asset.end_tc,
          asset.duration_frames,
          asset.fps,
          asset.type || 'BROLL',
          asset.resolution || 'N/A',
          asset.size || 0,
          asset.metadata || '{}'
        );
      }
    });

    insertMany(assets);
  },

  updateAssetType(assetId: number, type: string) {
    getDatabase().prepare('UPDATE media_assets SET type = ? WHERE asset_id = ?').run(type, assetId);
  },

  deleteAsset(assetId: number) {
    getDatabase().prepare('DELETE FROM media_assets WHERE asset_id = ?').run(assetId);
  },

  getSegments(assetId: number) {
    return getDatabase().prepare('SELECT * FROM transcripts WHERE asset_id = ?').all(assetId);
  },

  insertSegments(segments: any[]) {
    const db = getDatabase();
    const insert = db.prepare(`
      INSERT INTO transcripts (asset_id, speaker_label, time_in, time_out, content, word_map)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((segmentList: any[]) => {
      for (const segment of segmentList) {
        insert.run(
          segment.asset_id,
          segment.speaker_label,
          segment.time_in,
          segment.time_out,
          segment.content,
          segment.word_map
        );
      }
    });
    insertMany(segments);
  },

  findAssetByFileName(fileName: string) {
    return getDatabase().prepare('SELECT * FROM media_assets WHERE file_name LIKE ?').get(`${fileName}%`);
  },

  clearAllData() {
    const db = getDatabase();
    db.prepare('DELETE FROM transcripts').run();
    db.prepare('DELETE FROM media_assets').run();
    console.log('--- STORY GRAPH: Database Cleared ---');
  },

  renameSpeaker(assetId: number, oldName: string, newName: string) {
    getDatabase()
      .prepare('UPDATE transcripts SET speaker_label = ? WHERE asset_id = ? AND speaker_label = ?')
      .run(newName, assetId, oldName);
  }
};