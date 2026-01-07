
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import process from 'process';
import { fileURLToPath } from 'url';

// In a real environment, you'd use: import Database from 'better-sqlite3';
// For this bridge version, we'll implement a robust IPC-based state manager 
// that mimics SQLite behavior for the frontend.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0c0c0c',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // During development, we point to the local server or index.html
  mainWindow.loadFile('index.html');
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
 * IPC HANDLERS - SYSTEM & MEDIA
 */
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory']
  });
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('media:scan', async (event, rootDir: string) => {
  const extensions = ['.mp4', '.mov', '.wav', '.mp3'];
  const files = await recursiveScan(rootDir, extensions);
  
  // Simulation of ffprobe metadata extraction
  return files.map(file => ({
    file_name: path.basename(file),
    file_path: file,
    start_tc: '00:00:00:00',
    fps: 23.976,
    duration_frames: 1440,
    metadata: {
      resolution: path.extname(file).match(/\.(mp4|mov)/i) ? '3840x2160' : 'N/A',
      codec: path.extname(file).match(/\.(mp4|mov)/i) ? 'H.264 / ProRes' : 'PCM Audio'
    }
  }));
});

/**
 * IPC HANDLERS - DATA PERSISTENCE (SQLite Mock)
 * In production, these calls would execute SQL against a local .db file
 */
ipcMain.handle('db:save', async (event, data: string) => {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'story_graph_local.json');
  await fs.promises.writeFile(dbPath, data, 'utf8');
  return true;
});

ipcMain.handle('db:load', async () => {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'story_graph_local.json');
  if (fs.existsSync(dbPath)) {
    return await fs.promises.readFile(dbPath, 'utf8');
  }
  return null;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
