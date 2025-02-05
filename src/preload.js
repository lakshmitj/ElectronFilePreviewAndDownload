const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script loaded');

contextBridge.exposeInMainWorld('env', {
    NODE_ENV: process.env.NODE_ENV || 'development', // Default to 'development' if undefined
});

contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, data) => ipcRenderer.invoke(channel, data)
});