const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { enable } = require('@electron/remote/main');

// Add hot reload
try {
    require('electron-reloader')(module, {
        debug: true,
        watchRenderer: true
    });
} catch (_) { console.log('Error'); }

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
        try {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                try {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory()) {
                        searchAndDeleteFiles(filePath);
                    } else if (
                        file.toLowerCase() === 'thumbs.db' || 
                        file === '.DS_Store' ||
                        file.toLowerCase() === 'desktop.ini' ||
                        file === '.BridgeSort'
                    ) {
                        try {
                            fs.unlinkSync(filePath);
                            deletedFiles.push(filePath);
                            logActivity(`Deleted: ${filePath}`);
                        } catch (deleteError) {
                            console.error(`Error deleting file ${filePath}:`, deleteError);
                            logActivity(`Error deleting file ${filePath}: ${deleteError.message}`);
                        }
                    }
                } catch (fileError) {
                    console.error(`Error processing file ${file}:`, fileError);
                    continue;
                }
            }
        } catch (dirError) {
            console.error(`Error reading directory ${dir}:`, dirError);
        }
    }
    
    try {
        if (!directoryPath) {
            throw new Error('No directory path provided');
        }
        
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
    console.log('Starting get-directory-stats for:', directoryPath);
    
    const stats = [];
    let totalFilesCount = 0;
    let totalThumbsCount = 0;
    let totalDSStoreCount = 0;
    let totalDesktopIniCount = 0;
    let totalBridgeSortCount = 0;
    let totalOtherFilesCount = 0;
    
    function collectStats(dir) {
        try {
            // Normalize the path for macOS
            const normalizedDir = path.normalize(dir);
            console.log('Scanning directory:', normalizedDir);
            
            if (!fs.existsSync(normalizedDir)) {
                console.error('Directory does not exist:', normalizedDir);
                return;
            }
            
            const files = fs.readdirSync(normalizedDir);
            console.log(`Found ${files.length} items in directory`);
            
            for (const file of files) {
                try {
                    const filePath = path.join(normalizedDir, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory()) {
                        collectStats(filePath);
                    } else {
                        totalFilesCount++;
                        const fileName = file.toLowerCase();
                        
                        if (fileName === 'thumbs.db') {
                            totalThumbsCount++;
                            console.log('Found thumbs.db:', filePath);
                        } else if (file === '.DS_Store') {
                            totalDSStoreCount++;
                            console.log('Found .DS_Store:', filePath);
                        } else if (fileName === 'desktop.ini') {
                            totalDesktopIniCount++;
                            console.log('Found desktop.ini:', filePath);
                        } else if (file === '.BridgeSort') {
                            totalBridgeSortCount++;
                            console.log('Found .BridgeSort:', filePath);
                        } else {
                            totalOtherFilesCount++;
                        }
                    }
                } catch (fileError) {
                    console.error(`Error processing file ${file}:`, fileError);
                    continue;
                }
            }
        } catch (dirError) {
            console.error(`Error reading directory ${dir}:`, dirError);
        }
    }
    
    try {
        if (!directoryPath) {
            throw new Error('No directory path provided');
        }
        
        collectStats(directoryPath);
        
        const result = {
            success: true,
            totalFilesCount,
            totalThumbsCount,
            totalDSStoreCount,
            totalDesktopIniCount,
            totalBridgeSortCount,
            totalOtherFilesCount
        };
        
        console.log('Stats collection completed:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('Error in get-directory-stats:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

ipcMain.handle('open-external-link', async (event, url) => {
    await shell.openExternal(url);
}); 