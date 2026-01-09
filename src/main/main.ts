import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase, dbOperations } from './database';
import { parseTranscript } from './parser';

const execAsync = promisify(exec);

// Standard environment checks
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

/**
 * DEFENSIVE PRELOAD RESOLUTION
 */
function resolvePreloadPath(): string {
  const preloadDir = path.resolve(__dirname, '..', 'preload');
  const possibleNames = ['index.js', 'index.mjs', 'preload.js', 'preload.mjs', 'preload.cjs'];
  let resolvedPath = '';
  if (fs.existsSync(preloadDir)) {
    const filesInDir = fs.readdirSync(preloadDir);
    for (const name of possibleNames) {
      if (filesInDir.includes(name)) {
        resolvedPath = path.join(preloadDir, name);
        break;
      }
    }
  }
  return resolvedPath;
}

function createWindow() {
  const actualPreloadPath = resolvePreloadPath();
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0c0c0c',
    webPreferences: {
      preload: actualPreloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false 
    },
  });

  if (isDev && process.env['VITE_DEV_SERVER_URL']) {
    mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }
  mainWindow.once('ready-to-show', () => mainWindow?.show());
}

/**
 * TIMECODE & METADATA UTILITIES
 */
const tcToTotalFrames = (tc: string, fps: number): number => {
  if (!tc || !tc.includes(':')) return 0;
  const parts = tc.split(/[:;]/).map(Number);
  if (parts.length !== 4) return 0;
  const [h, m, s, f] = parts;
  return Math.round(((h * 3600) + (m * 60) + s) * fps) + f;
}

const framesToTcString = (totalFrames: number, fps: number): string => {
  const h = Math.floor(totalFrames / (3600 * fps));
  const m = Math.floor((totalFrames % (3600 * fps)) / (60 * fps));
  const s = Math.floor((totalFrames % (60 * fps)) / fps);
  const f = Math.round(totalFrames % fps);
  return [h, m, s, f].map(v => String(v).padStart(2, '0')).join(':');
}

async function getMetadata(filePath: string): Promise<any> {
  try {
    const sanitizedPath = filePath.replace(/"/g, '\\"');
    const command = `ffprobe -v error -find_stream_info -show_format -show_streams -of json "${sanitizedPath}"`;
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);
    const videoStream = data.streams?.find((s: any) => s.codec_type === 'video');
    const format = data.format;

    let fps = 23.976;
    if (videoStream?.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
      fps = den > 0 ? num / den : num;
    }

    let start_tc = '00:00:00:00';
    if (format.tags?.timecode) {
      start_tc = format.tags.timecode;
    } else {
      for (const stream of data.streams) {
        if (stream.tags?.timecode) {
          start_tc = stream.tags.timecode;
          break;
        }
      }
    }

    return {
      duration: parseFloat(format.duration) || 0,
      fps: parseFloat(fps.toFixed(3)),
      start_tc,
      resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'N/A',
      codec: videoStream?.codec_name || 'unknown',
      size: format.size ? parseInt(format.size) : 0,
    };
  } catch (error) {
    return null;
  }
}

/**
 * IPC HANDLER REGISTRATION
 */
function registerIpcHandlers() {
  // SYSTEM HANDLERS
  ipcMain.handle('dialog:openFiles', async () => {
    if (!mainWindow) return [];
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Media',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Media Files', extensions: ['mp4', 'mov', 'wav', 'mp3', 'mkv', 'avi'] }]
    });
    return filePaths || [];
  });

  ipcMain.handle('media:scan', async (_, files: string[], projectId: number) => {
    const targetProjectId = projectId || 1;
    return await Promise.all(
      files.map(async (file) => {
        const meta = await getMetadata(file);
        const fps = meta?.fps || 23.976;
        const durationFrames = Math.round((meta?.duration || 0) * fps);
        const startFrames = tcToTotalFrames(meta?.start_tc, fps);
        
        return {
          project_id: targetProjectId,
          file_name: path.basename(file),
          file_path: file,
          start_tc: meta?.start_tc || '00:00:00:00',
          end_tc: framesToTcString(startFrames + durationFrames, fps),
          fps,
          duration_frames: durationFrames,
          type: 'BROLL',
          resolution: meta?.resolution || 'N/A', 
          size: meta?.size || 0,
          metadata: JSON.stringify({
            original_duration: meta?.duration,
            codec: meta?.codec
          })
        };
      })
    );
  });

  // PROJECT HANDLERS
  ipcMain.handle('db:getProjects', () => dbOperations.getProjects());
  ipcMain.handle('db:createProject', (_, name, options) => dbOperations.createProject(name, options));
  ipcMain.handle('db:deleteProject', (_, projectId) => {
    dbOperations.deleteProject(projectId);
    return true;
  });
  ipcMain.handle('db:touchProject', (_, projectId) => {
    dbOperations.touchProject(projectId);
    return true;
  });

  // ASSET HANDLERS
  ipcMain.handle('db:getAssets', (_, pid) => dbOperations.getAssets(pid));
  ipcMain.handle('db:insertAssets', (_, assets) => {
    dbOperations.insertAssets(assets);
    return true;
  });

  // TRANSCRIPT HANDLERS
  ipcMain.handle('db:getSegments', (_, aid) => dbOperations.getSegments(aid));
  ipcMain.handle('db:insertSegments', (_, segs) => {
    dbOperations.insertSegments(segs);
    return true;
  });
  ipcMain.handle('db:renameSpeaker', (_, assetId, oldName, newName) => {
    dbOperations.renameSpeaker(assetId, oldName, newName);
    return true;
  });
  ipcMain.handle('db:updateAssetType', (_, aid, type) => {
    dbOperations.updateAssetType(aid, type);
    return true;
  });

  // CANVAS HANDLERS
  // Canvas Management
  ipcMain.handle('db:getCanvases', (_, projectId) => dbOperations.getCanvases(projectId));
  ipcMain.handle('db:createCanvas', (_, projectId, name, description) => {
    return dbOperations.createCanvas(projectId, name, description);
  });
  ipcMain.handle('db:updateCanvas', (_, canvasId, name, description) => {
    dbOperations.updateCanvas(canvasId, name, description);
    return true;
  });
  ipcMain.handle('db:deleteCanvas', (_, canvasId) => {
    dbOperations.deleteCanvas(canvasId);
    return true;
  });

  // Canvas Nodes (use canvasId, not projectId)
  ipcMain.handle('db:getStoryNodes', (_, canvasId) => dbOperations.getStoryNodes(canvasId));
  ipcMain.handle('db:saveStoryNode', (_, node) => {
    dbOperations.saveStoryNode(node);
    return true;
  });
  ipcMain.handle('db:updateStoryNodePosition', (_, nodeId, x, y) => {
    dbOperations.updateStoryNodePosition(nodeId, x, y);
    return true;
  });
  ipcMain.handle('db:deleteStoryNode', (_, nodeId) => {
    dbOperations.deleteStoryNode(nodeId);
    return true;
  });

  // Canvas Edges (use canvasId, not projectId)
  ipcMain.handle('db:getStoryEdges', (_, canvasId) => dbOperations.getStoryEdges(canvasId));
  ipcMain.handle('db:saveStoryEdge', (_, edge) => {
    dbOperations.saveStoryEdge(edge);
    return true;
  });
  ipcMain.handle('db:deleteStoryEdge', (_, edgeId) => {
    dbOperations.deleteStoryEdge(edgeId);
    return true;
  });

  // Node Enable/Disable
  ipcMain.handle('db:updateNodeEnabled', (_, nodeId, isEnabled) => {
    dbOperations.updateNodeEnabled(nodeId, isEnabled);
    return true;
  });

  // Act Operations
  ipcMain.handle('db:getActs', (_, canvasId) => dbOperations.getActs(canvasId));
  ipcMain.handle('db:createAct', (_, act) => dbOperations.createAct(act));
  ipcMain.handle('db:updateActPosition', (_, actId, x, y) => {
    dbOperations.updateActPosition(actId, x, y);
    return true;
  });
  ipcMain.handle('db:deleteAct', (_, actId) => {
    dbOperations.deleteAct(actId);
    return true;
  });

  // Scene Operations
  ipcMain.handle('db:getScenes', (_, actId) => dbOperations.getScenes(actId));
  ipcMain.handle('db:getScenesByCanvas', (_, canvasId) => dbOperations.getScenesByCanvas(canvasId));
  ipcMain.handle('db:createScene', (_, scene) => dbOperations.createScene(scene));
  ipcMain.handle('db:updateScenePosition', (_, sceneId, x, y) => {
    dbOperations.updateScenePosition(sceneId, x, y);
    return true;
  });
  ipcMain.handle('db:deleteScene', (_, sceneId) => {
    dbOperations.deleteScene(sceneId);
    return true;
  });

  // Bucket Operations
  ipcMain.handle('db:getBucketItems', (_, projectId, canvasId) => dbOperations.getBucketItems(projectId, canvasId));
  ipcMain.handle('db:addBucketItem', (_, item) => dbOperations.addBucketItem(item));
  ipcMain.handle('db:updateBucketItemNotes', (_, bucketItemId, notes) => {
    dbOperations.updateBucketItemNotes(bucketItemId, notes);
    return true;
  });
  ipcMain.handle('db:deleteBucketItem', (_, bucketItemId) => {
    dbOperations.deleteBucketItem(bucketItemId);
    return true;
  });

  ipcMain.handle('transcript:match-manual', async (_, assetId: number) => {
    if (!mainWindow) return false;
    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Transcript for Asset',
      filters: [{ name: 'Transcript Files', extensions: ['srtx', 'srt'] }]
    });
  
    if (!filePaths || filePaths.length === 0) return false;
  
    const content = fs.readFileSync(filePaths[0], 'utf-8');
    const segments = parseTranscript(content, assetId); 
    dbOperations.insertSegments(segments);
    dbOperations.updateAssetType(assetId, 'DIALOGUE');
    return true;
  });
}

// Lifecycle
app.whenReady().then(() => {
  initDatabase();
  registerIpcHandlers();
  createWindow();
});

app.on('before-quit', closeDatabase);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });