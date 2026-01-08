import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

let db: Database.Database | null = null;

/**
 * UPDATED SCHEMA (v3.0 - Multi-Project Architecture)
 * - Enhanced projects table with fps, resolution, client, status
 * - story_graphs table for multiple canvas versions per project
 * - timeline_nodes for trimmed segment persistence
 * - Full support for cloud-ready metadata
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS projects (
    project_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    fps REAL DEFAULT 23.976,
    resolution TEXT DEFAULT '3840x2160',
    client TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_edited TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

  CREATE TABLE IF NOT EXISTS story_graphs (
    graph_id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    canvas_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS timeline_nodes (
    node_id TEXT PRIMARY KEY,
    graph_id INTEGER NOT NULL,
    asset_id INTEGER NOT NULL,
    start_tc TEXT NOT NULL,
    end_tc TEXT NOT NULL,
    content TEXT,
    x_pos REAL,
    y_pos REAL,
    FOREIGN KEY (graph_id) REFERENCES story_graphs(graph_id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES media_assets(asset_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS story_nodes (
    node_id TEXT PRIMARY KEY,
    project_id INTEGER NOT NULL,
    asset_id INTEGER NOT NULL,
    start_tc TEXT NOT NULL,
    end_tc TEXT NOT NULL,
    text_content TEXT,
    node_type TEXT DEFAULT 'media',
    x_pos REAL NOT NULL,
    y_pos REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES media_assets(asset_id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_media_project ON media_assets(project_id);
  CREATE INDEX IF NOT EXISTS idx_transcripts_asset ON transcripts(asset_id);
  CREATE INDEX IF NOT EXISTS idx_graphs_project ON story_graphs(project_id);
  CREATE INDEX IF NOT EXISTS idx_nodes_graph ON timeline_nodes(graph_id);
  CREATE INDEX IF NOT EXISTS idx_story_nodes_project ON story_nodes(project_id);
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

  // --- PROJECTS TABLE MIGRATION (v3.0) ---
  // Add new project columns for multi-project architecture
  // SQLite doesn't support non-constant defaults in ALTER TABLE, so we use NULL defaults
  try {
    const projectTableInfo = db.prepare("PRAGMA table_info(projects)").all() as any[];
    const projectColumns = projectTableInfo.map(col => col.name);

    const projectRequiredColumns = [
      { name: 'fps', type: 'REAL DEFAULT 23.976' },
      { name: 'resolution', type: 'TEXT DEFAULT "3840x2160"' },
      { name: 'client', type: 'TEXT' },
      { name: 'status', type: 'TEXT DEFAULT "active"' },
      { name: 'created_at', type: 'TIMESTAMP' },
      { name: 'last_edited', type: 'TIMESTAMP' }
    ];

    for (const col of projectRequiredColumns) {
      if (!projectColumns.includes(col.name)) {
        db.exec(`ALTER TABLE projects ADD COLUMN ${col.name} ${col.type};`);
        console.log(`--- DB MIGRATION: Added projects.${col.name} column ---`);
      }
    }

    // Set timestamps for existing projects that don't have them
    db.exec(`
      UPDATE projects
      SET created_at = CURRENT_TIMESTAMP
      WHERE created_at IS NULL OR created_at = '';
    `);
    db.exec(`
      UPDATE projects
      SET last_edited = CURRENT_TIMESTAMP
      WHERE last_edited IS NULL OR last_edited = '';
    `);
  } catch (e) {
    console.error('Projects table migration failed:', e);
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
    db.prepare(`
      INSERT INTO projects (name, description, fps, resolution, status, created_at, last_edited)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      'Main Production Workspace',
      'Primary media ingest',
      23.976,
      '3840x2160',
      'active'
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
    return getDatabase().prepare('SELECT * FROM projects ORDER BY last_edited DESC').all();
  },

  createProject(name: string, options?: { description?: string; fps?: number; resolution?: string; client?: string }) {
    const result = getDatabase().prepare(`
      INSERT INTO projects (name, description, fps, resolution, client, status, created_at, last_edited)
      VALUES (?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      name,
      options?.description || null,
      options?.fps || 23.976,
      options?.resolution || '3840x2160',
      options?.client || null
    );
    return result.lastInsertRowid as number;
  },

  updateProject(projectId: number, updates: { name?: string; description?: string; client?: string; status?: string }) {
    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.client !== undefined) {
      fields.push('client = ?');
      values.push(updates.client);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    fields.push('last_edited = CURRENT_TIMESTAMP');
    values.push(projectId);

    if (fields.length > 1) { // More than just last_edited
      getDatabase().prepare(`UPDATE projects SET ${fields.join(', ')} WHERE project_id = ?`).run(...values);
    }
  },

  deleteProject(projectId: number) {
    getDatabase().prepare('DELETE FROM projects WHERE project_id = ?').run(projectId);
  },

  touchProject(projectId: number) {
    getDatabase().prepare('UPDATE projects SET last_edited = CURRENT_TIMESTAMP WHERE project_id = ?').run(projectId);
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
  },

  // Story Graph Operations
  getStoryGraphs(projectId: number) {
    return getDatabase().prepare('SELECT * FROM story_graphs WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
  },

  createStoryGraph(projectId: number, name: string) {
    const result = getDatabase()
      .prepare('INSERT INTO story_graphs (project_id, name, canvas_json) VALUES (?, ?, ?)')
      .run(projectId, name, '{}');
    return result.lastInsertRowid as number;
  },

  updateCanvasState(graphId: number, canvasJson: string) {
    getDatabase()
      .prepare('UPDATE story_graphs SET canvas_json = ? WHERE graph_id = ?')
      .run(canvasJson, graphId);
  },

  getCanvasState(graphId: number) {
    return getDatabase().prepare('SELECT * FROM story_graphs WHERE graph_id = ?').get(graphId);
  },

  deleteStoryGraph(graphId: number) {
    getDatabase().prepare('DELETE FROM story_graphs WHERE graph_id = ?').run(graphId);
  },

  // Timeline Node Operations
  saveTimelineNode(node: any) {
    const db = getDatabase();
    db.prepare(`
      INSERT OR REPLACE INTO timeline_nodes
      (node_id, graph_id, asset_id, start_tc, end_tc, content, x_pos, y_pos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      node.node_id,
      node.graph_id,
      node.asset_id,
      node.start_tc,
      node.end_tc,
      node.content,
      node.x_pos,
      node.y_pos
    );
  },

  getTimelineNodes(graphId: number) {
    return getDatabase().prepare('SELECT * FROM timeline_nodes WHERE graph_id = ?').all(graphId);
  },

  deleteTimelineNode(nodeId: string) {
    getDatabase().prepare('DELETE FROM timeline_nodes WHERE node_id = ?').run(nodeId);
  },

  // Story Node Operations (Project-Scoped Canvas State)
  getStoryNodes(projectId: number) {
    return getDatabase().prepare('SELECT * FROM story_nodes WHERE project_id = ? ORDER BY created_at ASC').all(projectId);
  },

  saveStoryNode(node: {
    node_id: string;
    project_id: number;
    asset_id: number;
    start_tc: string;
    end_tc: string;
    text_content?: string;
    node_type: string;
    x_pos: number;
    y_pos: number;
  }) {
    const db = getDatabase();
    db.prepare(`
      INSERT OR REPLACE INTO story_nodes
      (node_id, project_id, asset_id, start_tc, end_tc, text_content, node_type, x_pos, y_pos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      node.node_id,
      node.project_id,
      node.asset_id,
      node.start_tc,
      node.end_tc,
      node.text_content || null,
      node.node_type,
      node.x_pos,
      node.y_pos
    );
  },

  updateStoryNodePosition(nodeId: string, x: number, y: number) {
    getDatabase().prepare('UPDATE story_nodes SET x_pos = ?, y_pos = ? WHERE node_id = ?').run(x, y, nodeId);
  },

  deleteStoryNode(nodeId: string) {
    getDatabase().prepare('DELETE FROM story_nodes WHERE node_id = ?').run(nodeId);
  },

  clearStoryNodes(projectId: number) {
    getDatabase().prepare('DELETE FROM story_nodes WHERE project_id = ?').run(projectId);
  }
};