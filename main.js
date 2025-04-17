const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { enable } = require('@electron/remote/main');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    enable(win.webContents);
    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    return result.filePaths[0];
});

ipcMain.handle('cleanup-thumbsdb', async (event, directoryPath) => {
    const deletedFiles = [];
    
    function searchAndDeleteFiles(dir) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                searchAndDeleteFiles(filePath);
            } else if (file.toLowerCase() === 'thumbs.db' || file === '.DS_Store') {
                fs.unlinkSync(filePath);
                deletedFiles.push(filePath);
            }
        }
    }
    
    try {
        searchAndDeleteFiles(directoryPath);
        return {
            success: true,
            deletedFiles
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('get-directory-stats', async (event, directoryPath) => {
    const stats = [];
    let totalFilesCount = 0;
    
    function collectStats(dir) {
        const files = fs.readdirSync(dir);
        let thumbsCount = 0;
        let dsStoreCount = 0;
        let otherFilesCount = 0;
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                collectStats(filePath);
            } else {
                totalFilesCount++;
                if (file.toLowerCase() === 'thumbs.db') {
                    thumbsCount++;
                } else if (file === '.DS_Store') {
                    dsStoreCount++;
                } else {
                    otherFilesCount++;
                }
            }
        }
        
        if (thumbsCount > 0 || dsStoreCount > 0) {
            stats.push({
                directory: dir,
                thumbsCount,
                dsStoreCount,
                otherFilesCount
            });
        }
    }
    
    try {
        collectStats(directoryPath);
        return {
            success: true,
            stats,
            totalFilesCount
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('open-external-link', async (event, url) => {
    await shell.openExternal(url);
}); 