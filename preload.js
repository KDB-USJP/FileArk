const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to renderer via IPC
contextBridge.exposeInMainWorld('ark', {
    // Dialog
    selectFolder: (title) => ipcRenderer.invoke('select-folder', title),

    // App info
    getVersion: () => ipcRenderer.invoke('get-version'),

    // File operations
    scanDirectory: (dir, options) => ipcRenderer.invoke('scan-directory', dir, options),
    copyFiles: (files, destDir, options) => ipcRenderer.invoke('copy-files', files, destDir, options),
    cancelCopy: () => ipcRenderer.invoke('cancel-copy'),

    // Progress listener
    onCopyProgress: (callback) => {
        ipcRenderer.on('copy-progress', (event, data) => callback(data));
    },

    // Platform info
    platform: process.platform
});

console.log('[Creative Ark] Preload script loaded');
