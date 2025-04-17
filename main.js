const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { enable } = require('@electron/remote/main');

// Create logs directory if it doesn't exist
const logsDir = path.join(app.getPath('userData'), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Logging function
function logActivity(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    const logFile = path.join(logsDir, 'cleanup.log');
    fs.appendFileSync(logFile, logMessage);
}

function createWindow() {
    const win = new BrowserWindow({
        width: 500,
        height: 500,
        minWidth: 500,
        minHeight: 500,
        maxWidth: 500,
        maxHeight: 500,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        autoHideMenuBar: true
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
                logActivity(`Deleted: ${filePath}`);
            }
        }
    }
    
    try {
        logActivity(`Starting cleanup in directory: ${directoryPath}`);
        searchAndDeleteFiles(directoryPath);
        logActivity(`Cleanup completed. Total files deleted: ${deletedFiles.length}`);
        return {
            success: true,
            deletedFiles
        };
    } catch (error) {
        logActivity(`Error during cleanup: ${error.message}`);
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
        logActivity(`Getting stats for directory: ${directoryPath}`);
        collectStats(directoryPath);
        logActivity(`Stats collected. Total files: ${totalFilesCount}`);
        return {
            success: true,
            stats,
            totalFilesCount
        };
    } catch (error) {
        logActivity(`Error collecting stats: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('open-external-link', async (event, url) => {
    await shell.openExternal(url);
}); 