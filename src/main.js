const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const os = require('os');
const { screen } = require('electron');

//setup app logging
const logDirectory = path.join(app.getPath('userData'), 'logs'); // This will use AppData for Windows
// Create logs directory if it doesn't exist
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Configure the file transport to use the dynamic path
log.transports.file.file = () => path.join(logDirectory, 'main.log');

// Configure the console log format
log.transports.console.format = '{h}:{i}:{s} {level} {text}';

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Example log messages
log.info('Log file path is set to:', log.transports.file.file());

// For Window, process.platform: win32
// For linux, process.platform: linux
const isMac = process.platform === 'darwin';

const isDev = process.env.NODE_ENV == 'development';
log.info(`isDev:${isDev}`);

let mainWindow;
let modal;

function createMainWindow() {
  if (mainWindow) return; // Prevent re-creation
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  mainWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      // width: Math.round(width * 0.8),  // 80% of parent width
      // height: Math.round(height * 0.8), // 80% of parent height
      minWidth: 1024, // Prevents the window from being too small
      minHeight: 600,
      backgroundColor: '#ffffff',
      webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          contextIsolation: true,
          enableRemoteModule: false,
          nodeIntegration: false
      }
  });

  mainWindow.loadURL(pathToFileURL(path.join(__dirname, 'index.html')).href);

  // Disable the default menu
  Menu.setApplicationMenu(null); // This will remove the default menu bar

  // To Debug
  if (isDev) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', function () {
      mainWindow = null;
      if (modal && !modal.isDestroyed()) {
        modal.close();  // Close modal if event is received
        modal = null;
      }
  });

  log.info('mainWindow created');
}

function createModal() {
  if (modal) return; // Prevent re-creation

  const { width, height } = mainWindow.getBounds();

  modal = new BrowserWindow({
      parent: mainWindow,
      modal: false,
      show: false,
      // width: 400,
      // height: 300,
      width: Math.round(width * 0.5),  // 50% of parent width
      height: Math.round(height * 0.5), // 50% of parent height
      // frame: false,
      transparent: false,
      webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,  // Consider using contextIsolation instead
          contextIsolation: true
      },
  });

    modal.loadURL(pathToFileURL(path.join(__dirname, 'modal.html')).href);
    modal.once('ready-to-show', () => {
      console.log('ready-to-show');
      log.info('ready-to-show');

      if (modal.isVisible()) {
          console.log('Modal is already visible.');
          log.info('Modal is already visible.');
      } else {
          console.log('Showing modal...');
          log.info('Showing modal...');
          modal.show();  // Show modal when ready
          modal.focus(); // Ensure it gets focus
      }
    });

    modal.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load modal content:', errorCode, errorDescription);
      log.error(`Failed to load modal content: ${errorCode} ${errorDescription}`);
    });

    modal.on('closed', () => {
      modal = null;  // Clean up memory when modal is closed
    });

    if (isDev) {
      // Open the DevTools.
      modal.webContents.openDevTools();
    }
    log.info('modal created');
}

//Adding Squirrel.Windows boilerplate
if (require('electron-squirrel-startup')) app.quit();

if (process.platform === 'win32') {
  app.setAppUserModelId("com.dowloadmanager.app");
}

// Log any uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error('Unhandled Exception:', error);
});

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

    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!isMac) {
      app.quit();
  }
});

// Function to handle log messages from Renderer
ipcMain.handle('log-message', (_, level, message) => {
  log[level](message); // Supports log.info, log.error, etc.
  setTimeout(() => { // Async to prevent UI flickering
    log[level](message)
  }, 500)
});

ipcMain.handle('select-file', async () => {
  const methodName = 'select-file';
  console.log(`[IPC] ${methodName}`);
  log.info(`[IPC] ${methodName}`);
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

ipcMain.handle('download-file', async (_, params) => {
  const methodName = 'download-file';
  console.log(`[IPC] ${methodName} ${JSON.stringify(params)}`);
  log.info(`[IPC] ${methodName} ${JSON.stringify(params)}`);

  const savePath = path.join(params.defaultPath, path.basename(params.filePath));
  fs.copyFileSync(params.filePath, savePath);
  return savePath;
});

ipcMain.handle('select-path', async (_, defaultPath) => {
  console.log("select-path defaultPath", defaultPath);
  log.info(`main.js:select-path defaultPath:${defaultPath}`);

  const methodName = 'select-path';
  console.log(`[IPC] ${methodName} ${defaultPath}`);
  log.info(`[IPC] ${methodName} ${defaultPath}`);
  
  try{
    if (!defaultPath || !fs.existsSync(defaultPath)) {
      console.warn('main.js:Invalid defaultPath provided');
      log.warn('main.js:select-path:Invalid defaultPath provided')
      defaultPath = undefined; // Fallback to default path if provided one is invalid
    }

    const result = await dialog.showOpenDialog(mainWindow, {
      parent: mainWindow,
      properties: ['openDirectory'],
      defaultPath: defaultPath
    })
  
    console.log(result);
    // log.info(`select-path:${JSON.stringify(result)}`);

    if (!result.canceled && result.filePaths.length > 0 ) {
      const downloadPath = result.filePaths[0]; 
      return downloadPath;
    }else{
      return null; // User canceledjson
    }
  }
  catch (error) {
    console.error("Error opening dialog:", error);
    // log.error(`select-path:Error opening dialog: ${error}`);
    return null;  // In case of error
  }
  
});

// ipcMain.handle('get-default-download-path', () => {
//   // Return the default download path
//   return path.join(app.getPath('downloads'), "/electronjs");  
// });

handleWithLogging('get-default-download-path', async (_) => {
  console.log(`[Inside Handler] Processing...`);
  log.info(`[Inside Handler] Processing...`);

  // Your logic here...
  // Return the default download path
  return path.join(app.getPath('downloads'), "/electronjs"); 
});

ipcMain.handle('browser-download-path', async (_, defaultPath) => {

  const methodName = 'browser-download-path';
  console.log(`[IPC] ${methodName} called with defaultPath:`, defaultPath);
  log.info(`[IPC] ${methodName} called with defaultPath:: ${defaultPath}`);
  
  try{
    if (!modal ) {
      console.log(`[IPC] ${methodName}:createModal`);
      log.info(`[IPC] ${methodName}:createModal`);
      createModal(); // Only create the modal if it hasn't been created yet
    } else {
      console.log(`[IPC] ${methodName}: modal.show`);
      log.info(`[IPC] ${methodName}: modal.show`);
      modal.show(); // Show the modal if it already exists
    }
  }
  catch (error) {
    console.error("[IPC] ${methodName}:Error opening dialog:", error);
    log.error(`[IPC] ${methodName}:Error opening dialog: ${error}`);
    return null;  // In case of error
  }
  
});

ipcMain.handle('get-parent-dom-value', async () => {
  // You can retrieve data from the main window's DOM using webContents
  const methodName = 'get-parent-dom-value';
  console.log('[IPC] ${methodName}');
  log.info(`[IPC] ${methodName}`);

  const downloadPath = await mainWindow.webContents.executeJavaScript('document.getElementById("downloadPath").value');
  const filePath = await mainWindow.webContents.executeJavaScript('document.getElementById("downloadFile").dataset.filePath');

  var parentDomValues = {
    downloadPath: downloadPath, 
    filePath: filePath
  };

  console.log(`[IPC] ${methodName}: downloadPath`);
  log.info(`get-parent-dom-value: ${downloadPath}`)

  return parentDomValues;
});

function handleWithLogging(channel, handler) {
  ipcMain.handle(channel, async (event, ...args) => {
      console.log(`[IPC] ${channel} called with args:`, args);
      log.info(`[IPC] ${channel} called with args:`, args)

      try {
          const result = await handler(event, ...args);

          console.log(`[IPC] ${channel} success:`, result);
          log.info(`[IPC] ${channel} success:`, result);

          return result;
      } catch (error) {
          console.error(`[IPC] ${channel} error:`, error);
          log.info(`[IPC] ${channel} error:`, error);
          throw error;
      }
  });
}





