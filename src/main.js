const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');
const os = require('os');

//Configure log options
// log.transports.file.resolvePath = () => `${__dirname}/logs/main.log`;
// // log.transports.file.file = path.join(os.homedir(), 'logs', 'main.log');
// log.transports.console.format = '{h}:{i}:{s} {level} {text}';

const logDirectory = path.join(app.getPath('userData'), 'logs'); // This will use AppData for Windows

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

// Configure the file transport to use the dynamic path
log.transports.file.resolvePath = () => path.join(logDirectory, 'main.log');

// Configure the console log format
log.transports.console.format = '{h}:{i}:{s} {level} {text}';

// Example log messages
log.info('Log file path is set to:', log.transports.file.resolvePath());


log.transports.file.level = 'info';
log.transports.console.level = 'debug';


// For Window, process.platform: win32
// For linux, process.platform: linux
const isMac = process.platform === 'darwin';

const isDev = process.env.NODE_ENV == 'development';
log.info(`isDev:${isDev}`);

let mainWindow;
let modal;

function createMainWindow() {
  if (mainWindow) return; // Prevent re-creation

  mainWindow = new BrowserWindow({
      width: isDev? 1200: 500,
      height: isDev? 1200: 500 ,
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
  //if (isDev) {
    mainWindow.webContents.openDevTools();
  //}

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

  modal = new BrowserWindow({
      parent: mainWindow,
      modal: false,
      show: false,
      width: isDev? 800: 400,
      height: isDev? 600: 300,
      // frame: false,
      transparent: false,
      webPreferences: {
          preload: path.join(__dirname, 'preload.js'),
          nodeIntegration: false,  // Consider using contextIsolation instead
          contextIsolation: true
      },
  });

    modal.loadURL(pathToFileURL(path.join(__dirname, 'modal.html')).href);

    // modal.once('ready-to-show', () => {
    //     console.log('ready-to-show');
    //     log.info('ready-to-show');
    //     modal.show(); // Show modal when ready
    //     modal.focus(); // Ensure it gets focus
    // });

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

    // if (isDev) {
      modal.webContents.openDevTools();
    // }
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

// Function to handle log messages from Renderer
ipcMain.handle('log-message', (_, level, message) => {
  log[level](message); // Supports log.info, log.error, etc.
  setTimeout(() => { // Async to prevent UI flickering
    log[level](message)
  }, 500)
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
  
  //log.info(`path.basename(prams.filePath) ${path.basename(prams.filePath)} `)

  const savePath = path.join(prams.defaultPath, path.basename(prams.filePath));
  fs.copyFileSync(prams.filePath, savePath);
  return savePath;
});

ipcMain.handle('select-path', async (_, defaultPath) => {
  console.log("select-path defaultPath", defaultPath);
 // log.info(`select-path defaultPath:${defaultPath}`);
  
  try{

    if (!defaultPath || !fs.existsSync(defaultPath)) {
      console.warn('Invalid defaultPath provided');
      // log.warn('select-path:Invalid defaultPath provided')
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
      return null; // User canceled
    }
  }
  catch (error) {
    console.error("Error opening dialog:", error);
    // log.error(`select-path:Error opening dialog: ${error}`);
    return null;  // In case of error
  }
  
});

ipcMain.handle('get-default-download-path', () => {
  return path.join(app.getPath('downloads'), "/electronjs");  // Return the default download path
});

ipcMain.handle('browser-download-path', async (_, defaultPath) => {

  console.log("browser-download-path", defaultPath);
  log.info(`browser-download-path: ${defaultPath}`);
  
  try{
    if (!modal ) {
      console.log("createModal");
      log.info(`browser-download-path:createModal`);
      createModal(); // Only create the modal if it hasn't been created yet
    } else {
      console.log("modal.show");
      log.info(`browser-download-path:modal.show`);
      modal.show(); // Show the modal if it already exists
    }
  }
  catch (error) {
    console.error("Error opening dialog:", error);
    log.error(`Error opening dialog: ${error}`);
    return null;  // In case of error
  }
  
});

ipcMain.handle('get-parent-dom-value', async () => {
  // You can retrieve data from the main window's DOM using webContents
  console.log('get-parent-dom-value');

  const downloadPath = await mainWindow.webContents.executeJavaScript('document.getElementById("downloadPath").value');
  console.log( downloadPath);
  //log.info(`get-parent-dom-value: ${downloadPath}`)
  const filePath = await mainWindow.webContents.executeJavaScript('document.getElementById("downloadFile").dataset.filePath');

  return {
    downloadPath: downloadPath, 
    filePath: filePath
  };
});





