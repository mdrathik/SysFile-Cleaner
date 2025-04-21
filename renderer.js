const { ipcRenderer } = require('electron');

const selectDirButton = document.getElementById('selectDir');
const cleanupButton = document.getElementById('cleanup');
const selectedPathDiv = document.getElementById('selectedPath');
const alertDiv = document.getElementById('alert');
const loadingDiv = document.querySelector('.loading');
const statsTable = document.getElementById('statsTable');
const totalFilesCell = document.getElementById('totalFiles');
const thumbsFilesCell = document.getElementById('thumbsFiles');
const dsStoreFilesCell = document.getElementById('dsStoreFiles');
const actualFilesCell = document.getElementById('actualFiles');
const desktopIniFilesCell = document.getElementById('desktopIniFiles');
const bridgeSortFilesCell = document.getElementById('bridgeSortFiles');
const resultDiv = document.getElementById('result');
const fileListDiv = document.getElementById('fileList');

let selectedDirectory = null;

// Function to reset all results and UI elements
function resetResults() {
    alertDiv.style.display = 'none';
    statsTable.style.display = 'none';
    totalFilesCell.textContent = '0';
    thumbsFilesCell.textContent = '0';
    dsStoreFilesCell.textContent = '0';
    actualFilesCell.textContent = '0';
    cleanupButton.disabled = true;
}

// Function to show alert
function showAlert() {
    alertDiv.style.display = 'block';
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 2000);
}

// Function to process directory selection
async function processDirectory(path) {
    if (!path) return;
    
    selectedDirectory = path;
    selectedPathDiv.textContent = `Selected directory: ${path}`;
    
    // Reset all previous results
    resetResults();
    
    try {
        const result = await ipcRenderer.invoke('get-directory-stats', path);
        
        if (result.success) {
            let totalThumbs = 0;
            let totalDSStore = 0;
            let totalDesktopIni = 0;
            let totalBridgeSort = 0;
            let totalOtherFiles = 0;
            
            result.stats.forEach(stat => {
                totalThumbs += stat.thumbsCount;
                totalDSStore += stat.dsStoreCount;
                totalDesktopIni += stat.desktopIniCount;
                totalBridgeSort += stat.bridgeSortCount;
                totalOtherFiles += stat.otherFilesCount;
            });
            
            totalFilesCell.textContent = result.totalFilesCount;
            thumbsFilesCell.textContent = totalThumbs;
            dsStoreFilesCell.textContent = totalDSStore;
            desktopIniFilesCell.textContent = totalDesktopIni;
            bridgeSortFilesCell.textContent = totalBridgeSort;
            actualFilesCell.textContent = result.totalFilesCount - totalThumbs - totalDSStore - totalDesktopIni - totalBridgeSort;
            
            statsTable.style.display = 'table';
            cleanupButton.disabled = (totalThumbs === 0 && totalDSStore === 0 && totalDesktopIni === 0 && totalBridgeSort === 0);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        alertDiv.textContent = `Error: ${error.message}`;
        alertDiv.style.backgroundColor = '#ff4444';
        showAlert();
    }
}

selectDirButton.addEventListener('click', async () => {
    const path = await ipcRenderer.invoke('select-directory');
    console.log('Directory selected:', path);
    
    if (path) {
        selectedDirectory = path;
        if (selectedPathDiv) {
            selectedPathDiv.textContent = `Selected directory: ${path}`;
            
            // Add click to copy functionality
            selectedPathDiv.onclick = () => {
                navigator.clipboard.writeText(path).then(() => {
                    // Show a temporary tooltip
                    const tooltip = document.createElement('div');
                    tooltip.textContent = 'Copied to clipboard!';
                    tooltip.style.position = 'fixed';
                    tooltip.style.backgroundColor = '#92C46B';
                    tooltip.style.color = 'white';
                    tooltip.style.padding = '5px 10px';
                    tooltip.style.borderRadius = '4px';
                    tooltip.style.fontSize = '12px';
                    tooltip.style.zIndex = '1000';
                    
                    // Position the tooltip near the cursor
                    const rect = selectedPathDiv.getBoundingClientRect();
                    tooltip.style.left = `${rect.left}px`;
                    tooltip.style.top = `${rect.top - 30}px`;
                    
                    document.body.appendChild(tooltip);
                    
                    // Remove the tooltip after 1.5 seconds
                    setTimeout(() => {
                        document.body.removeChild(tooltip);
                    }, 1500);
                }).catch(err => {
                    console.error('Failed to copy path:', err);
                });
            };
        }
        
        // Remove any existing file count div
        const existingCountDiv = document.querySelector('.file-count-div');
        if (existingCountDiv) {
            existingCountDiv.remove();
        }
        
        // Add file count text
        const fileCountDiv = document.createElement('div');
        fileCountDiv.className = 'file-count-div';
        fileCountDiv.style.textAlign = 'center';
        fileCountDiv.style.marginTop = '10px';
        fileCountDiv.style.color = '#7f8c8d';
        fileCountDiv.style.fontStyle = 'italic';
        fileCountDiv.style.fontSize = '13px';
        
        // Insert the file count div after the selected path div
        if (selectedPathDiv && selectedPathDiv.parentNode) {
            selectedPathDiv.parentNode.insertBefore(fileCountDiv, selectedPathDiv.nextSibling);
        }
        
        // Show loading state
        fileCountDiv.textContent = 'Scanning files...';
        
        // Hide previous results
        if (resultDiv) {
            resultDiv.style.display = 'none';
        }
        
        try {
            console.log('Requesting directory stats...');
            const result = await ipcRenderer.invoke('get-directory-stats', path);
            console.log('Received directory stats:', JSON.stringify(result, null, 2));
            
            if (result && result.success) {
                // Calculate total system files
                const totalSystemFiles = (result.totalThumbsCount || 0) + 
                                       (result.totalDSStoreCount || 0) + 
                                       (result.totalDesktopIniCount || 0) + 
                                       (result.totalBridgeSortCount || 0);
                
                const totalFiles = result.totalFilesCount || 0;
                
                console.log('Calculated totals:', {
                    totalFiles,
                    totalSystemFiles,
                    details: {
                        thumbs: result.totalThumbsCount,
                        dsStore: result.totalDSStoreCount,
                        desktopIni: result.totalDesktopIniCount,
                        bridgeSort: result.totalBridgeSortCount
                    }
                });
                
                // Update the file count text
                fileCountDiv.textContent = `Total Files: ${totalFiles} | System Files: ${totalSystemFiles}`;
                
                // Update the stats table if elements exist
                if (totalFilesCell) totalFilesCell.textContent = totalFiles;
                if (thumbsFilesCell) thumbsFilesCell.textContent = result.totalThumbsCount || 0;
                if (dsStoreFilesCell) dsStoreFilesCell.textContent = result.totalDSStoreCount || 0;
                if (desktopIniFilesCell) desktopIniFilesCell.textContent = result.totalDesktopIniCount || 0;
                if (bridgeSortFilesCell) bridgeSortFilesCell.textContent = result.totalBridgeSortCount || 0;
                if (actualFilesCell) actualFilesCell.textContent = result.totalOtherFilesCount || 0;
                
                // Show the stats table if it exists
                if (statsTable) {
                    statsTable.style.display = 'table';
                }
                
                // Disable cleanup button if no system files found
                if (cleanupButton) {
                    cleanupButton.disabled = totalSystemFiles === 0;
                }
                
                // Show message if no system files found
                if (totalSystemFiles === 0 && resultDiv && fileListDiv) {
                    resultDiv.style.display = 'block';
                    resultDiv.className = 'info';
                    fileListDiv.innerHTML = 'No system files found in the selected directory.';
                }
            } else {
                const errorMessage = result?.error || 'Unknown error occurred';
                console.error('Error in directory stats:', errorMessage);
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Error getting directory stats:', error);
            fileCountDiv.textContent = 'Error scanning files';
            if (resultDiv && fileListDiv) {
                resultDiv.style.display = 'block';
                resultDiv.className = 'error';
                fileListDiv.innerHTML = `Error: ${error.message}`;
            }
            // Disable cleanup button on error
            if (cleanupButton) {
                cleanupButton.disabled = true;
            }
        }
    }
});

cleanupButton.addEventListener('click', async () => {
    if (!selectedDirectory) return;

    // Show loading state
    if (loadingDiv) {
        loadingDiv.style.display = 'block';
    }
    if (cleanupButton) {
        cleanupButton.disabled = true;
    }
    if (selectDirButton) {
        selectDirButton.disabled = true;
    }
    if (resultDiv) {
        resultDiv.style.display = 'none';
    }

    try {
        console.log('Starting cleanup process...');
        const result = await ipcRenderer.invoke('cleanup-thumbsdb', selectedDirectory);
        console.log('Cleanup result:', result);
        
        // Hide loading state
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
        
        if (result.success) {
            // Show success alert
            const alertDiv = document.getElementById('alert');
            if (alertDiv) {
                alertDiv.classList.add('show');
                setTimeout(() => {
                    alertDiv.classList.remove('show');
                }, 2000);
            }

            if (resultDiv) {
                resultDiv.style.display = 'block';
                resultDiv.className = 'success';
            }
            if (fileListDiv) {
                if (result.deletedFiles.length === 0) {
                    fileListDiv.innerHTML = 'No system files found to clean.';
                } else {
                    fileListDiv.innerHTML = `<p>Successfully deleted ${result.deletedFiles.length} file(s):</p>`;
                    const ul = document.createElement('ul');
                    result.deletedFiles.forEach(file => {
                        const li = document.createElement('li');
                        li.textContent = file;
                        ul.appendChild(li);
                    });
                    fileListDiv.appendChild(ul);
                }
            }

            // Update the stats after cleanup
            try {
                const statsResult = await ipcRenderer.invoke('get-directory-stats', selectedDirectory);
                if (statsResult.success) {
                    // Calculate total system files
                    const totalSystemFiles = (statsResult.totalThumbsCount || 0) + 
                                           (statsResult.totalDSStoreCount || 0) + 
                                           (statsResult.totalDesktopIniCount || 0) + 
                                           (statsResult.totalBridgeSortCount || 0);
                    
                    const totalFiles = statsResult.totalFilesCount || 0;
                    
                    // Update the file count text
                    const fileCountDiv = document.querySelector('.file-count-div');
                    if (fileCountDiv) {
                        fileCountDiv.textContent = `Total Files: ${totalFiles} | System Files: ${totalSystemFiles}`;
                    }
                    
                    // Update the stats table
                    if (totalFilesCell) totalFilesCell.textContent = totalFiles;
                    if (thumbsFilesCell) thumbsFilesCell.textContent = statsResult.totalThumbsCount || 0;
                    if (dsStoreFilesCell) dsStoreFilesCell.textContent = statsResult.totalDSStoreCount || 0;
                    if (desktopIniFilesCell) desktopIniFilesCell.textContent = statsResult.totalDesktopIniCount || 0;
                    if (bridgeSortFilesCell) bridgeSortFilesCell.textContent = statsResult.totalBridgeSortCount || 0;
                    if (actualFilesCell) actualFilesCell.textContent = statsResult.totalOtherFilesCount || 0;
                    
                    // Show the stats table
                    if (statsTable) {
                        statsTable.style.display = 'table';
                    }
                    
                    // Disable cleanup button if no system files remain
                    if (cleanupButton) {
                        cleanupButton.disabled = totalSystemFiles === 0;
                    }
                }
            } catch (error) {
                console.error('Error updating stats:', error);
            }
        } else {
            if (resultDiv) {
                resultDiv.style.display = 'block';
                resultDiv.className = 'error';
            }
            if (fileListDiv) {
                fileListDiv.innerHTML = `Error: ${result.error}`;
            }
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
        }
        if (resultDiv) {
            resultDiv.style.display = 'block';
            resultDiv.className = 'error';
        }
        if (fileListDiv) {
            fileListDiv.innerHTML = `Error: ${error.message}`;
        }
    }

    // Re-enable select button
    if (selectDirButton) {
        selectDirButton.disabled = false;
    }
});

// Add link click handlers for company links
document.querySelectorAll('a[href*="bzmgraphics.com"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.invoke('open-external-link', 'https://www.bzmgraphics.com/');
    });
}); 