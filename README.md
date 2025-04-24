# SYS File Cleanup

A powerful desktop application built with Electron to clean up various system files that can clutter your directories. The application specifically targets:

- Thumbs.db files (Windows thumbnail cache)
- .DS_Store files (macOS directory metadata)
- desktop.ini files (Windows folder customization)
- .BridgeSort files (Adobe Bridge sorting metadata)

![SYS File Cleanup Screenshot](screenshot.png)

## Features

- 🔍 Scans directories for multiple types of system files
- 📊 Shows detailed statistics for each file type
- 🧹 Clean and simple interface for easy file cleanup
- 💻 Windows-focused with fixed window size
- 🛡️ Safe and secure file deletion
- 📈 Real-time file count updates
- 📋 Copy directory path with one click
- ⚡ Quick cleanup with visual feedback

## Installation

### Windows Installer
1. Download the latest release from the [Releases](https://github.com/mdrathik/SysFile-Cleaner/releases) page
2. Run `Thumbs.db Cleanup Setup 1.1.2.exe`
3. Follow the installation wizard
4. Launch the application from the Start Menu or Desktop shortcut

### Portable Version
1. Download the portable version from the [Releases](https://github.com/mdrathik/SysFile-Cleaner/releases) page
2. Extract the contents
3. Run `Thumbs.db Cleanup 1.1.2.exe`

## Usage

1. Launch the application
2. Click "Select Directory" to choose a folder to clean
3. View the detailed file statistics in the table:
   - Total Files: All files in the directory
   - Thumbs.db Files: Windows thumbnail cache files
   - .DS_Store Files: macOS directory metadata
   - desktop.ini Files: Windows folder customization
   - .BridgeSort Files: Adobe Bridge sorting metadata
   - Actual Files: Your regular files
4. Click "Clean" to remove system files
5. The alert will show "Cleaned" when the process is complete

## Development

### Prerequisites
- Node.js
- npm

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development version:
   ```bash
   npm start
   ```

### Building
To build the Windows application:
```bash
npm run build
```

This will create both installer and portable versions in the `dist` directory.

## License

This project is licensed under the ISC License.

## Author

Md. Solaiman Hossain

## Version History

- 1.1.2 - Current version
- 1.1.1 - Fixed window size and improved UI
- 1.1.0 - Initial release with basic functionality
