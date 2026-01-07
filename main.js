const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let cancelRequested = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 1040,
        minWidth: 500,
        minHeight: 700,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets', 'icon.png'),
        title: 'File Ark',
        backgroundColor: '#1a1612'
    });

    mainWindow.loadFile('renderer/index.html');
    mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// ========================================
// IPC Handlers
// ========================================

ipcMain.handle('select-folder', async (event, title) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: title || 'Select Folder',
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('get-version', () => {
    return app.getVersion();
});

ipcMain.handle('scan-directory', async (event, dir, options) => {
    return scanDirectory(dir, options);
});

// Cancel copy operation
ipcMain.handle('cancel-copy', () => {
    cancelRequested = true;
    return true;
});

// Async copy with progress
ipcMain.handle('copy-files', async (event, files, destDir, options) => {
    cancelRequested = false; // Reset cancel flag
    return copyFilesAsync(files, destDir, options, (current, total, filename) => {
        mainWindow.webContents.send('copy-progress', { current, total, filename });
    });
});

// ========================================
// File Operations
// ========================================

function scanDirectory(dir, options) {
    const results = [];
    const extensions = new Set(options.extensions.map(e => e.toLowerCase()));
    const minSizes = options.minSizes || {};
    const extToCategory = options.extToCategory || {};
    const excludeDirs = new Set([
        'node_modules', '.git', '$RECYCLE.BIN', 'System Volume Information',
        'Windows', 'Program Files', 'Program Files (x86)', 'AppData',
        '.Trash', '.DS_Store', 'Library', 'Temp', 'tmp', 'Cache', 'Caches',
        ...(options.excludeDirs || [])
    ].map(d => d.toLowerCase()));

    function walk(currentDir) {
        let entries;
        try {
            entries = fs.readdirSync(currentDir, { withFileTypes: true });
        } catch (e) {
            return;
        }

        for (const entry of entries) {
            try {
                const fullPath = path.join(currentDir, entry.name);

                if (entry.isDirectory()) {
                    if (!excludeDirs.has(entry.name.toLowerCase())) {
                        walk(fullPath);
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase().slice(1);
                    if (extensions.has(ext)) {
                        try {
                            const stats = fs.statSync(fullPath);
                            const minSize = minSizes[ext] || 0;

                            if (stats.size >= minSize) {
                                results.push({
                                    path: fullPath,
                                    name: entry.name,
                                    ext: ext,
                                    size: stats.size,
                                    category: extToCategory[ext] || 'Custom'
                                });
                            }
                        } catch (e) { }
                    }
                }
            } catch (e) { }
        }
    }

    walk(dir);
    return results;
}

/**
 * Async copy with progress updates and cancel support
 */
async function copyFilesAsync(files, destDir, options, onProgress) {
    const total = files.length;
    let copied = 0;
    let errors = 0;
    let cancelled = false;
    const manifest = [];

    const subfolderByExt = options?.subfolderByExt || false;
    const embedOriginalPath = options?.embedOriginalPath || false;

    // Create category folders (and extension subfolders if enabled)
    const categories = [...new Set(files.map(f => f.category))];
    for (const cat of categories) {
        const catDir = path.join(destDir, cat);
        if (!fs.existsSync(catDir)) {
            fs.mkdirSync(catDir, { recursive: true });
        }

        // Create extension subfolders if enabled
        if (subfolderByExt) {
            const extsInCat = [...new Set(files.filter(f => f.category === cat).map(f => f.ext.toUpperCase()))];
            for (const ext of extsInCat) {
                const extDir = path.join(catDir, ext);
                if (!fs.existsSync(extDir)) {
                    fs.mkdirSync(extDir, { recursive: true });
                }
            }
        }
    }

    const BATCH_SIZE = 5;

    for (let i = 0; i < files.length; i++) {
        if (cancelRequested) {
            cancelled = true;
            break;
        }

        const file = files[i];

        // Determine destination folder
        let targetDir;
        if (subfolderByExt) {
            targetDir = path.join(destDir, file.category, file.ext.toUpperCase());
        } else {
            targetDir = path.join(destDir, file.category);
        }

        let destPath = path.join(targetDir, file.name);

        // Handle duplicates
        let counter = 1;
        const baseName = path.basename(file.name, path.extname(file.name));
        const ext = path.extname(file.name);

        while (fs.existsSync(destPath)) {
            destPath = path.join(targetDir, `${baseName}_${counter}${ext}`);
            counter++;
        }

        try {
            fs.copyFileSync(file.path, destPath);
            copied++;

            // Write original path to sidecar file if enabled
            if (embedOriginalPath) {
                const originalFolder = path.dirname(file.path);
                const sidecarPath = destPath + '.origin.txt';
                fs.writeFileSync(sidecarPath, `Original location: ${originalFolder}\nOriginal path: ${file.path}\n`);
            }

            manifest.push({
                original: file.path,
                destination: destPath,
                size: file.size,
                category: file.category,
                originalFolder: path.dirname(file.path)
            });
        } catch (e) {
            errors++;
            manifest.push({
                original: file.path,
                error: e.message
            });
        }

        if (i % BATCH_SIZE === 0 || i === files.length - 1) {
            if (onProgress) {
                onProgress(i + 1, total, file.name);
            }
            await new Promise(resolve => setImmediate(resolve));
        }
    }

    // Write manifest
    const manifestPath = path.join(destDir, '_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify({
        created: new Date().toISOString(),
        totalFiles: total,
        copiedFiles: copied,
        errors: errors,
        cancelled: cancelled,
        options: { subfolderByExt, embedOriginalPath },
        categories: categories,
        files: manifest
    }, null, 2));

    return { success: !cancelled, copied, errors, cancelled };
}

console.log('[File Ark] Main process ready');
