const { ipcRenderer } = require('electron');

const selectDirButton = document.getElementById('selectDir');
const cleanupButton = document.getElementById('cleanup');
const selectedPathDiv = document.getElementById('selectedPath');
const resultDiv = document.getElementById('result');
const fileListDiv = document.getElementById('fileList');
const loadingDiv = document.querySelector('.loading');
const statsTable = document.getElementById('statsTable');
const totalFilesCell = document.getElementById('totalFiles');
const thumbsFilesCell = document.getElementById('thumbsFiles');
const dsStoreFilesCell = document.getElementById('dsStoreFiles');
const actualFilesCell = document.getElementById('actualFiles');

let selectedDirectory = null;

// Tab switching functionality
document.querySelectorAll('.nav-menu button').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons and tabs
        document.querySelectorAll('.nav-menu button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        
        // Add active class to clicked button and corresponding tab
        button.classList.add('active');
        document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
    });
});

selectDirButton.addEventListener('click', async () => {
    const path = await ipcRenderer.invoke('select-directory');
    if (path) {
        selectedDirectory = path;
        selectedPathDiv.textContent = `Selected directory: ${path}`;
        
        // Show loading state
        loadingDiv.style.display = 'block';
        statsTable.style.display = 'none';
        
        try {
            const result = await ipcRenderer.invoke('get-directory-stats', path);
            
            // Hide loading state
            loadingDiv.style.display = 'none';
            
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
            loadingDiv.style.display = 'none';
            resultDiv.style.display = 'block';
            resultDiv.className = 'error';
            fileListDiv.innerHTML = `Error: ${error.message}`;
        }
    }
});

cleanupButton.addEventListener('click', async () => {
    if (!selectedDirectory) return;

    // Show loading state
    loadingDiv.style.display = 'block';
    cleanupButton.disabled = true;
    selectDirButton.disabled = true;
    resultDiv.style.display = 'none';

    try {
        const result = await ipcRenderer.invoke('cleanup-thumbsdb', selectedDirectory);
        
        // Hide loading state
        loadingDiv.style.display = 'none';
        resultDiv.style.display = 'block';
        
        if (result.success) {
            resultDiv.className = 'success';
            if (result.deletedFiles.length === 0) {
                fileListDiv.innerHTML = 'No thumbs.db files found.';
            } else {
                fileListDiv.innerHTML = `<p>Successfully deleted ${result.deletedFiles.length} thumbs.db file(s):</p>`;
                const ul = document.createElement('ul');
                result.deletedFiles.forEach(file => {
                    const li = document.createElement('li');
                    li.textContent = file;
                    ul.appendChild(li);
                });
                fileListDiv.appendChild(ul);
            }
        } else {
            resultDiv.className = 'error';
            fileListDiv.innerHTML = `Error: ${result.error}`;
        }
    } catch (error) {
        loadingDiv.style.display = 'none';
        resultDiv.style.display = 'block';
        resultDiv.className = 'error';
        fileListDiv.innerHTML = `Error: ${error.message}`;
    }

    // Re-enable buttons
    cleanupButton.disabled = false;
    selectDirButton.disabled = false;
});

// Add link click handler
document.querySelector('.credit a').addEventListener('click', (e) => {
    e.preventDefault();
    ipcRenderer.invoke('open-external-link', 'https://www.bzmgraphics.com/');
}); 