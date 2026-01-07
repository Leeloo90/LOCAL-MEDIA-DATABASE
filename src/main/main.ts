
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { initDatabase, closeDatabase, dbOperations } from './database';

const execAsync = promisify(exec);

const isDev = process.env.NODE_ENV === 'development';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0c0c0c',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development, load from Vite dev server; in production, load built files
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

/**
 * RECURSIVE CRAWLER
 */
async function recursiveScan(dir: string, extensions: string[]): Promise<string[]> {
  let results: string[] = [];
  try {
    const list = await fs.promises.readdir(dir);
    for (const file of list) {
      const filePath = path.resolve(dir, file);
      const stat = await fs.promises.stat(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(await recursiveScan(filePath, extensions));
      } else {
        if (extensions.includes(path.extname(filePath).toLowerCase())) {
          results.push(filePath);
        }
      }
    }
  } catch (e) {
    console.error(`Error scanning directory ${dir}:`, e);
  }
  return results;
}

/**
 * FFPROBE METADATA EXTRACTION
 */
async function getMetadata(filePath: string): Promise<any> {
  try {
    const command = `ffprobe -v error -show_format -show_streams -of json "${filePath}"`;
    const { stdout } = await execAsync(command);
    const data = JSON.parse(stdout);

    // Extract relevant metadata
    const videoStream = data.streams?.find((s: any) => s.codec_type === 'video');
    const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');
    const format = data.format;

    // Calculate FPS from frame rate string (e.g., "24000/1001" -> 23.976)
    let fps = null;
    if (videoStream?.r_frame_rate) {
      const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
      fps = den ? num / den : num;
    }

    return {
      duration: parseFloat(format.duration) || 0,
      fps,
      resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : null,
      codec: videoStream?.codec_name || audioStream?.codec_name || 'unknown',
      bitrate: format.bit_rate ? parseInt(format.bit_rate) : null,
      size: format.size ? parseInt(format.size) : null,
    };
  } catch (error) {
    console.error('ffprobe error:', error);
    return null;
  }
}

/**
 * IPC HANDLERS - SYSTEM & MEDIA
 */
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('get-metadata', async (_, filePath: string) => {
  return await getMetadata(filePath);
});

ipcMain.handle('media:scan', async (_, rootDir: string) => {
  const extensions = ['.mp4', '.mov', '.wav', '.mp3'];
  const files = await recursiveScan(rootDir, extensions);

  // Extract real metadata using ffprobe
  const results = await Promise.all(
    files.map(async (file) => {
      const metadata = await getMetadata(file);
      const fps = metadata?.fps || 23.976;
      const duration = metadata?.duration || 0;
      const durationFrames = Math.floor(duration * fps);

      return {
        file_name: path.basename(file),
        file_path: file,
        start_tc: '00:00:00:00',
        fps,
        duration_frames: durationFrames,
        metadata: {
          resolution: metadata?.resolution || 'N/A',
          codec: metadata?.codec || 'Unknown',
          bitrate: metadata?.bitrate,
          size: metadata?.size,
        }
      };
    })
  );

  return results;
});

/**
 * IPC HANDLERS - DATABASE OPERATIONS (SQLite)
 */
// Projects
ipcMain.handle('db:getProjects', async () => {
  return dbOperations.getProjects();
});

// Media Assets
ipcMain.handle('db:getAssets', async (_, projectId: number) => {
  return dbOperations.getAssets(projectId);
});

ipcMain.handle('db:insertAsset', async (_, asset: any) => {
  return dbOperations.insertAsset(asset);
});

ipcMain.handle('db:insertAssets', async (_, assets: any[]) => {
  dbOperations.insertAssets(assets);
  return true;
});

ipcMain.handle('db:updateAssetType', async (_, assetId: number, type: string) => {
  dbOperations.updateAssetType(assetId, type);
  return true;
});

ipcMain.handle('db:deleteAsset', async (_, assetId: number) => {
  dbOperations.deleteAsset(assetId);
  return true;
});

ipcMain.handle('db:findAssetByFileName', async (_, fileName: string) => {
  return dbOperations.findAssetByFileName(fileName);
});

// Transcript Segments
ipcMain.handle('db:getSegments', async (_, assetId: number) => {
  return dbOperations.getSegments(assetId);
});

ipcMain.handle('db:insertSegment', async (_, segment: any) => {
  return dbOperations.insertSegment(segment);
});

ipcMain.handle('db:insertSegments', async (_, segments: any[]) => {
  dbOperations.insertSegments(segments);
  return true;
});

ipcMain.handle('db:deleteSegmentsByAsset', async (_, assetId: number) => {
  dbOperations.deleteSegmentsByAsset(assetId);
  return true;
});

app.whenReady().then(() => {
  initDatabase();
  createWindow();
});

app.on('before-quit', () => {
  closeDatabase();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
