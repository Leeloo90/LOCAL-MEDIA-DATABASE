import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

let db: Database.Database | null = null;

/**
 * UPDATED SCHEMA (v3.0 - Multi-Project Architecture)
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

  CREATE TABLE IF NOT EXISTS story_nodes (
    node_id TEXT PRIMARY KEY,
    project_id INTEGER NOT NULL,
    asset_id INTEGER NOT NULL,
    start_tc TEXT NOT NULL,
    end_tc TEXT NOT NULL,
    text_content TEXT,
    node_type TEXT DEFAULT 'mediaNode',
    x_pos REAL NOT NULL,
    y_pos REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES media_assets(asset_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS story_edges (
    edge_id TEXT PRIMARY KEY,
    project_id INTEGER NOT NULL,
    source_node TEXT NOT NULL,
    target_node TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_media_project ON media_assets(project_id);
  CREATE INDEX IF NOT EXISTS idx_transcripts_asset ON transcripts(asset_id);
  CREATE INDEX IF NOT EXISTS idx_story_nodes_project ON story_nodes(project_id);
  CREATE INDEX IF NOT EXISTS idx_story_edges_project ON story_edges(project_id);`;

export function initDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'story_graph.db');

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  console.log('Executing SCHEMA...');
  db.exec(SCHEMA);
  console.log('SCHEMA executed.');

  // --- AUTO-MIGRATION LOGIC ---
  try {
    const tableInfo = db.prepare("PRAGMA table_info(media_assets)").all() as any[];
    const columns = tableInfo.map(col => col.name);

    if (!columns.includes('end_tc')) {
      db.exec('ALTER TABLE media_assets ADD COLUMN end_tc TEXT DEFAULT "00:00:00:00" NOT NULL;');
      console.log('Migration: Added end_tc to media_assets.');
    }
    if (!columns.includes('resolution')) {
      db.exec('ALTER TABLE media_assets ADD COLUMN resolution TEXT;');
      console.log('Migration: Added resolution to media_assets.');
    }

    // Migration for 'canvases' table
    const canvasesTableInfo = db.prepare("PRAGMA table_info(canvases)").all() as any[];
    if (canvasesTableInfo.length === 0) {
      db.exec(`
        CREATE TABLE canvases (
          canvas_id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_edited TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
        );
        CREATE INDEX idx_canvases_project ON canvases(project_id);
      `);
      console.log('Migration: Created canvases table.');
    }

    // Migration for 'canvas_id' in 'story_nodes'
    const storyNodesTableInfo = db.prepare("PRAGMA table_info(story_nodes)").all() as any[];
    const storyNodesColumns = storyNodesTableInfo.map(col => col.name);
    if (!storyNodesColumns.includes('canvas_id')) {
      db.exec('ALTER TABLE story_nodes ADD COLUMN canvas_id INTEGER DEFAULT 1 NOT NULL;');
      db.exec('CREATE INDEX idx_story_nodes_canvas ON story_nodes(canvas_id);');
      console.log('Migration: Added canvas_id to story_nodes.');
    }

    // Migration for 'canvas_id' in 'story_edges'
    const storyEdgesTableInfo = db.prepare("PRAGMA table_info(story_edges)").all() as any[];
    const storyEdgesColumns = storyEdgesTableInfo.map(col => col.name);
    if (!storyEdgesColumns.includes('canvas_id')) {
      db.exec('ALTER TABLE story_edges ADD COLUMN canvas_id INTEGER DEFAULT 1 NOT NULL;');
      db.exec('CREATE INDEX idx_story_edges_canvas ON story_edges(canvas_id);');
      console.log('Migration: Added canvas_id to story_edges.');
    }

    // Migration for 'node_subtype' in 'story_nodes' (spine, satellite, spring)
    if (!storyNodesColumns.includes('node_subtype')) {
      db.exec("ALTER TABLE story_nodes ADD COLUMN node_subtype TEXT DEFAULT 'spine';");
      console.log('Migration: Added node_subtype to story_nodes.');
    }

    // Migration for 'duration_seconds' in 'story_nodes'
    if (!storyNodesColumns.includes('duration_seconds')) {
      db.exec('ALTER TABLE story_nodes ADD COLUMN duration_seconds REAL;');
      console.log('Migration: Added duration_seconds to story_nodes.');
    }

    // Migration for 'anchor_word_index' in 'story_nodes' (for satellite positioning)
    if (!storyNodesColumns.includes('anchor_word_index')) {
      db.exec('ALTER TABLE story_nodes ADD COLUMN anchor_word_index INTEGER;');
      console.log('Migration: Added anchor_word_index to story_nodes.');
    }

    // Migration for 'sequence_order' in 'story_nodes' (for spine ordering)
    if (!storyNodesColumns.includes('sequence_order')) {
      db.exec('ALTER TABLE story_nodes ADD COLUMN sequence_order INTEGER;');
      console.log('Migration: Added sequence_order to story_nodes.');
    }

    // Migration for 'is_enabled' in 'story_nodes' (for disabling nodes)
    if (!storyNodesColumns.includes('is_enabled')) {
      db.exec('ALTER TABLE story_nodes ADD COLUMN is_enabled INTEGER DEFAULT 1;');
      console.log('Migration: Added is_enabled to story_nodes.');
    }

    // Migration for 'scene_id' in 'story_nodes' (for hierarchical containers)
    if (!storyNodesColumns.includes('scene_id')) {
      db.exec('ALTER TABLE story_nodes ADD COLUMN scene_id INTEGER;');
      console.log('Migration: Added scene_id to story_nodes.');
    }

    // Migration for acts table
    const actsTableInfo = db.prepare("PRAGMA table_info(acts)").all() as any[];
    if (actsTableInfo.length === 0) {
      db.exec(`
        CREATE TABLE acts (
          act_id INTEGER PRIMARY KEY AUTOINCREMENT,
          canvas_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          sequence_order INTEGER,
          x_pos REAL NOT NULL,
          y_pos REAL NOT NULL,
          width REAL DEFAULT 800,
          height REAL DEFAULT 600,
          collapsed INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (canvas_id) REFERENCES canvases(canvas_id) ON DELETE CASCADE
        );
        CREATE INDEX idx_acts_canvas ON acts(canvas_id);
      `);
      console.log('Migration: Created acts table.');
    }

    // Migration for scenes table
    const scenesTableInfo = db.prepare("PRAGMA table_info(scenes)").all() as any[];
    if (scenesTableInfo.length === 0) {
      db.exec(`
        CREATE TABLE scenes (
          scene_id INTEGER PRIMARY KEY AUTOINCREMENT,
          act_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          sequence_order INTEGER,
          x_pos REAL NOT NULL,
          y_pos REAL NOT NULL,
          width REAL DEFAULT 600,
          height REAL DEFAULT 400,
          collapsed INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (act_id) REFERENCES acts(act_id) ON DELETE CASCADE
        );
        CREATE INDEX idx_scenes_act ON scenes(act_id);
      `);
      console.log('Migration: Created scenes table.');
    }

    // Migration for 'anchor_to_node' and 'anchor_word_timecode' in 'story_edges' (for word-level anchoring)
    if (!storyEdgesColumns.includes('anchor_to_node')) {
      db.exec('ALTER TABLE story_edges ADD COLUMN anchor_to_node TEXT;');
      console.log('Migration: Added anchor_to_node to story_edges.');
    }
    if (!storyEdgesColumns.includes('anchor_word_timecode')) {
      db.exec('ALTER TABLE story_edges ADD COLUMN anchor_word_timecode TEXT;');
      console.log('Migration: Added anchor_word_timecode to story_edges.');
    }
    if (!storyEdgesColumns.includes('anchor_mode')) {
      db.exec("ALTER TABLE story_edges ADD COLUMN anchor_mode TEXT DEFAULT 'clip';");
      console.log('Migration: Added anchor_mode to story_edges.');
    }

    // Migration for bucket_items table (holding area for clips "on ice")
    const bucketTableInfo = db.prepare("PRAGMA table_info(bucket_items)").all() as any[];
    if (bucketTableInfo.length === 0) {
      db.exec(`
        CREATE TABLE bucket_items (
          bucket_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_id INTEGER NOT NULL,
          canvas_id INTEGER,
          asset_id INTEGER NOT NULL,
          start_tc TEXT NOT NULL,
          end_tc TEXT NOT NULL,
          text_content TEXT,
          item_type TEXT DEFAULT 'clip',
          notes TEXT,
          sequence_order INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
          FOREIGN KEY (canvas_id) REFERENCES canvases(canvas_id) ON DELETE SET NULL,
          FOREIGN KEY (asset_id) REFERENCES media_assets(asset_id) ON DELETE CASCADE
        );
        CREATE INDEX idx_bucket_project ON bucket_items(project_id);
        CREATE INDEX idx_bucket_canvas ON bucket_items(canvas_id);
      `);
      console.log('Migration: Created bucket_items table.');
    }

  } catch (e) {
    console.error('Migration check failed:', e.message, e);
  }

  // Create default project if none exists
  let mainProjectId: number;
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    const result = db.prepare(`
      INSERT INTO projects (name, description, fps, resolution, status)
      VALUES (?, ?, ?, ?, ?)
    `).run('Main Production Workspace', 'Primary media ingest', 23.976, '3840x2160', 'active');
    mainProjectId = result.lastInsertRowid as number;
  } else {
    // If projects exist, get the ID of the 'Main Production Workspace' or the first one
    const mainProject = db.prepare('SELECT project_id FROM projects WHERE name = ?').get('Main Production Workspace') as { project_id: number } | undefined;
    if (mainProject) {
      mainProjectId = mainProject.project_id;
    } else {
      // Fallback to the first project if 'Main Production Workspace' is not found
      mainProjectId = (db.prepare('SELECT project_id FROM projects LIMIT 1').get() as { project_id: number }).project_id;
    }
  }

  // Create default canvas if none exists for the main project
  const canvasCount = db.prepare('SELECT COUNT(*) as count FROM canvases WHERE project_id = ?').get(mainProjectId) as { count: number };
  if (canvasCount.count === 0) {
    db.prepare(`
      INSERT INTO canvases (project_id, name, description)
      VALUES (?, ?, ?)
    `).run(mainProjectId, 'Main Canvas', 'The primary canvas for this project');
  }

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

export const dbOperations = {
  // Project Operations
  getProjects() {
    return getDatabase().prepare('SELECT * FROM projects ORDER BY last_edited DESC').all();
  },

  createProject(name: string, options?: { description?: string; fps?: number; resolution?: string; client?: string }) {
    const result = getDatabase().prepare(`
      INSERT INTO projects (name, description, fps, resolution, client, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).run(
      name,
      options?.description || null,
      options?.fps || 23.976,
      options?.resolution || '3840x2160',
      options?.client || null
    );
    return result.lastInsertRowid as number;
  },

  touchProject(projectId: number) {
    getDatabase().prepare('UPDATE projects SET last_edited = CURRENT_TIMESTAMP WHERE project_id = ?').run(projectId);
  },

  deleteProject(projectId: number) {
    getDatabase().prepare('DELETE FROM projects WHERE project_id = ?').run(projectId);
  },

  // Canvas Operations
  getCanvases(projectId: number) {
    return getDatabase().prepare('SELECT * FROM canvases WHERE project_id = ? ORDER BY created_at DESC').all(projectId);
  },

  createCanvas(projectId: number, name: string, description?: string) {
    const result = getDatabase().prepare(`
      INSERT INTO canvases (project_id, name, description)
      VALUES (?, ?, ?)
    `).run(projectId, name, description || null);
    return result.lastInsertRowid as number;
  },

  updateCanvas(canvasId: number, name: string, description?: string) {
    getDatabase().prepare(`
      UPDATE canvases SET name = ?, description = ? WHERE canvas_id = ?
    `).run(name, description || null, canvasId);
  },

  deleteCanvas(canvasId: number) {
    getDatabase().prepare('DELETE FROM canvases WHERE canvas_id = ?').run(canvasId);
  },

  // Asset Operations
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

  // Transcript Operations
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

  renameSpeaker(assetId: number, oldName: string, newName: string) {
    getDatabase()
      .prepare('UPDATE transcripts SET speaker_label = ? WHERE asset_id = ? AND speaker_label = ?')
      .run(newName, assetId, oldName);
  },

  // Canvas Node Operations
  getStoryNodes(canvasId: number) {
    return getDatabase().prepare('SELECT * FROM story_nodes WHERE canvas_id = ?').all(canvasId);
  },

  saveStoryNode(node: any) {
    getDatabase().prepare(`
      INSERT OR REPLACE INTO story_nodes
      (node_id, project_id, canvas_id, asset_id, start_tc, end_tc, text_content, node_type, node_subtype, x_pos, y_pos, duration_seconds, sequence_order, anchor_word_index, is_enabled, scene_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      node.node_id,
      node.project_id,
      node.canvas_id,
      node.asset_id,
      node.start_tc,
      node.end_tc,
      node.text_content || null,
      node.node_type,
      node.node_subtype || 'spine',
      node.x_pos,
      node.y_pos,
      node.duration_seconds || null,
      node.sequence_order || null,
      node.anchor_word_index || null,
      node.is_enabled !== undefined ? node.is_enabled : 1,
      node.scene_id || null
    );
  },

  updateNodeEnabled(nodeId: string, isEnabled: boolean) {
    getDatabase().prepare('UPDATE story_nodes SET is_enabled = ? WHERE node_id = ?').run(isEnabled ? 1 : 0, nodeId);
  },

  updateStoryNodePosition(nodeId: string, x: number, y: number) {
    getDatabase().prepare('UPDATE story_nodes SET x_pos = ?, y_pos = ? WHERE node_id = ?').run(x, y, nodeId);
  },

  deleteStoryNode(nodeId: string) {
    getDatabase().prepare('DELETE FROM story_nodes WHERE node_id = ?').run(nodeId);
  },

  // Canvas Edge Operations
  getStoryEdges(canvasId: number) {
    return getDatabase().prepare('SELECT * FROM story_edges WHERE canvas_id = ?').all(canvasId);
  },

  saveStoryEdge(edge: { edge_id: string; project_id: number; canvas_id: number; source_node: string; target_node: string; anchor_to_node?: string; anchor_word_timecode?: string; anchor_mode?: string; }) {
    getDatabase().prepare(`
      INSERT OR REPLACE INTO story_edges (edge_id, project_id, canvas_id, source_node, target_node, anchor_to_node, anchor_word_timecode, anchor_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      edge.edge_id,
      edge.project_id,
      edge.canvas_id,
      edge.source_node,
      edge.target_node,
      edge.anchor_to_node || null,
      edge.anchor_word_timecode || null,
      edge.anchor_mode || 'clip'
    );
  },

  deleteStoryEdge(edgeId: string) {
    getDatabase().prepare('DELETE FROM story_edges WHERE edge_id = ?').run(edgeId);
  },

  // Act Operations
  getActs(canvasId: number) {
    return getDatabase().prepare('SELECT * FROM acts WHERE canvas_id = ? ORDER BY sequence_order').all(canvasId);
  },

  createAct(act: { canvas_id: number; name: string; x_pos: number; y_pos: number; sequence_order?: number; width?: number; height?: number; }) {
    const result = getDatabase().prepare(`
      INSERT INTO acts (canvas_id, name, x_pos, y_pos, sequence_order, width, height)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      act.canvas_id,
      act.name,
      act.x_pos,
      act.y_pos,
      act.sequence_order || 0,
      act.width || 800,
      act.height || 600
    );
    return result.lastInsertRowid as number;
  },

  updateActPosition(actId: number, x: number, y: number) {
    getDatabase().prepare('UPDATE acts SET x_pos = ?, y_pos = ? WHERE act_id = ?').run(x, y, actId);
  },

  deleteAct(actId: number) {
    getDatabase().prepare('DELETE FROM acts WHERE act_id = ?').run(actId);
  },

  // Scene Operations
  getScenes(actId: number) {
    return getDatabase().prepare('SELECT * FROM scenes WHERE act_id = ? ORDER BY sequence_order').all(actId);
  },

  getScenesByCanvas(canvasId: number) {
    return getDatabase().prepare(`
      SELECT s.* FROM scenes s
      JOIN acts a ON s.act_id = a.act_id
      WHERE a.canvas_id = ?
      ORDER BY s.sequence_order
    `).all(canvasId);
  },

  createScene(scene: { act_id: number; name: string; x_pos: number; y_pos: number; sequence_order?: number; width?: number; height?: number; }) {
    const result = getDatabase().prepare(`
      INSERT INTO scenes (act_id, name, x_pos, y_pos, sequence_order, width, height)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      scene.act_id,
      scene.name,
      scene.x_pos,
      scene.y_pos,
      scene.sequence_order || 0,
      scene.width || 600,
      scene.height || 400
    );
    return result.lastInsertRowid as number;
  },

  updateScenePosition(sceneId: number, x: number, y: number) {
    getDatabase().prepare('UPDATE scenes SET x_pos = ?, y_pos = ? WHERE scene_id = ?').run(x, y, sceneId);
  },

  deleteScene(sceneId: number) {
    getDatabase().prepare('DELETE FROM scenes WHERE scene_id = ?').run(sceneId);
  },

  // Bucket Operations (Holding Area)
  getBucketItems(projectId: number, canvasId?: number) {
    if (canvasId) {
      return getDatabase().prepare('SELECT * FROM bucket_items WHERE project_id = ? AND canvas_id = ? ORDER BY sequence_order, created_at DESC').all(projectId, canvasId);
    }
    return getDatabase().prepare('SELECT * FROM bucket_items WHERE project_id = ? ORDER BY sequence_order, created_at DESC').all(projectId);
  },

  addBucketItem(item: { project_id: number; canvas_id?: number; asset_id: number; start_tc: string; end_tc: string; text_content?: string; item_type?: string; notes?: string; sequence_order?: number; }) {
    const result = getDatabase().prepare(`
      INSERT INTO bucket_items (project_id, canvas_id, asset_id, start_tc, end_tc, text_content, item_type, notes, sequence_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.project_id,
      item.canvas_id || null,
      item.asset_id,
      item.start_tc,
      item.end_tc,
      item.text_content || null,
      item.item_type || 'clip',
      item.notes || null,
      item.sequence_order || null
    );
    return result.lastInsertRowid as number;
  },

  updateBucketItemNotes(bucketItemId: number, notes: string) {
    getDatabase().prepare('UPDATE bucket_items SET notes = ? WHERE bucket_item_id = ?').run(notes, bucketItemId);
  },

  deleteBucketItem(bucketItemId: number) {
    getDatabase().prepare('DELETE FROM bucket_items WHERE bucket_item_id = ?').run(bucketItemId);
  }
};