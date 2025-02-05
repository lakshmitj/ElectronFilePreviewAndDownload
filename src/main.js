const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');

// For Window, process.platform: win32
// For linux, process.platform: linux
const isMac = process.platform === 'darwin';

const isDev = process.env.NODE_ENV == 'development';

let mainWindow;
let modal;

function createMainWindow() {
  mainWindow = new BrowserWindow({
      width: 500,
      height: 500 ,
      backgroundColor: '#ffffff',
      webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          enableRemoteModule: false,
          nodeIntegration: false
      }
  });

  mainWindow.loadURL(pathToFileURL(path.join(__dirname, 'index.html')).href);

  // To Debug
  if (isDev) {
      mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
      mainWindow = null;
      if (modal && !modal.isDestroyed()) {
        modal.close();  // Close modal if event is received
        modal = null;
      }
  });
}

function createModal() {
  modal = new BrowserWindow({
      parent: mainWindow,
      // modal: true,
      show: false,
      width: 400,
      height: 300,
      // frame: false,
      transparent: true,
      webPreferences: {
          nodeIntegration: true,
          preload: path.join(__dirname, 'preload.js'),
      },
  });

    modal.loadURL(pathToFileURL(path.join(__dirname, 'modal.html')).href);

    modal.once('ready-to-show', () => {
        console.log('ready-to-show');
        modal.show(); // Show modal when ready
    });

    if (isDev) {
      modal.webContents.openDevTools();
    }
}

//Adding Squirrel.Windows boilerplate
if (require('electron-squirrel-startup')) app.quit();

app.whenReady().then(() => {
    createMainWindow();

    // Listen for close-modal event and close the modal
    ipcMain.handle('close-modal', async (_) => {
      console.log('close-modal event received in main process');
      if (modal && !modal.isDestroyed()) {
        modal.close();  // Close modal if event is received
        modal = null;
      }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (!isMac) {
        app.quit();
    }
});

ipcMain.handle('select-file', async () => {

  // Using electron dialogs, file explorer can be added in electron app. 
  // https://www.electronjs.org/docs/latest/api/dialog
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }, 
    { name: 'Text Files', extensions: ['txt', 'md'] }]
  });

  if (filePaths.length > 0) {
    const filePath = filePaths[0];
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.png', '.gif'].includes(ext)) {
      return { path: filePath, type: 'image' };
    } else {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { path: filePath, content, type: 'text' };
    }
  }
  return null;
});


ipcMain.handle('download-file', async (_, prams) => {

  console.log("defaultPath", prams.defaultPath);
  console.log("filePath", prams.filePath);
  console.log("path.basename(prams.filePath)", path.basename(prams.filePath));
  
  const savePath = path.join(prams.defaultPath, path.basename(prams.filePath));
  fs.copyFileSync(prams.filePath, savePath);
  return savePath;
});

ipcMain.handle('select-path', async (_, defaultPath) => {
  console.log("select-path defaultPath", defaultPath);
  
  try{

    if (!defaultPath || !fs.existsSync(defaultPath)) {
      console.warn('Invalid defaultPath provided');
      defaultPath = undefined; // Fallback to default path if provided one is invalid
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      parent: mainWindow,
      properties: ['openDirectory'],
      defaultPath: defaultPath
    })
  
    console.log(result);

    if (!result.canceled && result.filePaths.length > 0 ) {
      const downloadPath = result.filePaths[0]; 
      return downloadPath;
    }else{
      return null; // User canceled
    }
  }
  catch (error) {
    console.error("Error opening dialog:", error);
    return null;  // In case of error
  }
  
});

ipcMain.handle('get-default-download-path', () => {
  return path.join(app.getPath('downloads'), "/electronjs");  // Return the default download path
});


ipcMain.handle('browser-download-path', async (_, defaultPath) => {

  console.log("defaultPathbvnvnbv", defaultPath);
  
  try{
    if (!modal ) {
      console.log("createModal");
      createModal(); // Only create the modal if it hasn't been created yet
    } else {
      console.log("modal.show");
      modal.show(); // Show the modal if it already exists
    }
  }
  catch (error) {
    console.error("Error opening dialog:", error);
    return null;  // In case of error
  }
  
});

ipcMain.handle('get-parent-dom-value', async () => {
  // You can retrieve data from the main window's DOM using webContents
  console.log('get-parent-dom-value');

  const downloadPath = await mainWindow.webContents.executeJavaScript('document.getElementById("downloadPath").value');
  console.log( downloadPath);
  const filePath = await mainWindow.webContents.executeJavaScript('document.getElementById("downloadFile").dataset.filePath');

  return {
    downloadPath: downloadPath, 
    filePath: filePath
  };
});





