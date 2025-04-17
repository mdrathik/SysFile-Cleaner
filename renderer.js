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
            let totalOtherFiles = 0;
            
            result.stats.forEach(stat => {
                totalThumbs += stat.thumbsCount;
                totalDSStore += stat.dsStoreCount;
                totalOtherFiles += stat.otherFilesCount;
            });
            
            totalFilesCell.textContent = result.totalFilesCount;
            thumbsFilesCell.textContent = totalThumbs;
            dsStoreFilesCell.textContent = totalDSStore;
            actualFilesCell.textContent = result.totalFilesCount - totalThumbs - totalDSStore;
            
            statsTable.style.display = 'table';
            cleanupButton.disabled = (totalThumbs === 0 && totalDSStore === 0);
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
    await processDirectory(path);
});

cleanupButton.addEventListener('click', async () => {
    if (!selectedDirectory) return;

    // Show loading state
    loadingDiv.style.display = 'block';
    cleanupButton.disabled = true;
    selectDirButton.disabled = true;

    try {
        const result = await ipcRenderer.invoke('cleanup-thumbsdb', selectedDirectory);
        
        // Hide loading state
        loadingDiv.style.display = 'none';
        
        if (result.success) {
            showAlert();
            
            // Update the stats after cleanup
            try {
                const statsResult = await ipcRenderer.invoke('get-directory-stats', selectedDirectory);
                if (statsResult.success) {
                    let totalThumbs = 0;
                    let totalDSStore = 0;
                    
                    statsResult.stats.forEach(stat => {
                        totalThumbs += stat.thumbsCount;
                        totalDSStore += stat.dsStoreCount;
                    });
                    
                    totalFilesCell.textContent = statsResult.totalFilesCount;
                    thumbsFilesCell.textContent = totalThumbs;
                    dsStoreFilesCell.textContent = totalDSStore;
                    actualFilesCell.textContent = statsResult.totalFilesCount - totalThumbs - totalDSStore;
                    
                    // Disable clean button if no more files to clean
                    cleanupButton.disabled = (totalThumbs === 0 && totalDSStore === 0);
                }
            } catch (error) {
                console.error('Error updating stats:', error);
            }
        } else {
            alertDiv.textContent = `Error: ${result.error}`;
            alertDiv.style.backgroundColor = '#ff4444';
            showAlert();
        }
    } catch (error) {
        loadingDiv.style.display = 'none';
        alertDiv.textContent = `Error: ${error.message}`;
        alertDiv.style.backgroundColor = '#ff4444';
        showAlert();
    }

    // Re-enable select button
    selectDirButton.disabled = false;
});

// Add link click handlers for company links
document.querySelectorAll('a[href*="bzmgraphics.com"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        ipcRenderer.invoke('open-external-link', 'https://www.bzmgraphics.com/');
    });
}); 