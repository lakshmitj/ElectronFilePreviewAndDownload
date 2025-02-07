const { contextBridge, ipcRenderer } = require('electron');
// const { log } = require('electron-log');

console.log('Preload script loaded');
// log.info('Preload script loaded');

contextBridge.exposeInMainWorld('env', {
    NODE_ENV: process.env.NODE_ENV || 'development', // Default to 'development' if undefined
});

contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});

// contextBridge.exposeInMainWorld('logger', {
//     info: (message) => log.info(message),
//     warn: (message) => log.warn(message),
//     error: (message) => log.error(message)
//   });


contextBridge.exposeInMainWorld('electronLog', {
    log: (level, message) => ipcRenderer.invoke('log-message', level, message),
});
  