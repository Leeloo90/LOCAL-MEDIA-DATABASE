const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(() => {
  const preloadPath = path.join(__dirname, 'out/preload/preload.mjs');
  console.log('Testing preload path:', preloadPath);
  console.log('File exists:', require('fs').existsSync(preloadPath));
  
  const win = new BrowserWindow({
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true
    }
  });
  
  win.loadURL('about:blank');
});
