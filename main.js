const { app, BrowserWindow, ipcMain, dialog, clipboard, shell, Menu } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');

const { version: APP_VERSION } = require('./package.json');

let USER_DATA_YTDLP;
let BUNDLED_YTDLP;
let FFMPEG_PATH;

function getYtdlpPath() {
    return fs.existsSync(USER_DATA_YTDLP) ? USER_DATA_YTDLP : BUNDLED_YTDLP;
}

const activeProcesses = new Map(); // { id: { child, outPath } }
const activeUrls = new Set();

let mainWindow = null;

ipcMain.handle('read-clipboard', () => clipboard.readText());
ipcMain.handle('get-app-version', () => APP_VERSION);

ipcMain.handle('open-folder', async (event, filePath) => {
    shell.showItemInFolder(filePath);
});

function createWindow() {
    Menu.setApplicationMenu(null);
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 850,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        },
    });

    if (!fs.existsSync(BUNDLED_YTDLP) && !fs.existsSync(USER_DATA_YTDLP)) {
        dialog.showErrorBox("Missing Component", `yt-dlp.exe was not found.`);
    }

    mainWindow.loadFile('index.html');
    mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
    USER_DATA_YTDLP = path.join(app.getPath('userData'), 'yt-dlp.exe');
    BUNDLED_YTDLP = app.isPackaged
        ? path.join(process.resourcesPath, 'yt-dlp.exe')
        : path.join(__dirname, 'bin', 'yt-dlp.exe');
    FFMPEG_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'ffmpeg.exe')
        : path.join(__dirname, 'bin', 'ffmpeg.exe');
    createWindow();
});

// --- HANDLERS ---

// 1. Folder Selection
ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
});

// 2. Metadata Fetching
ipcMain.handle('fetch-metadata', async (event, url) => {
    return new Promise((resolve, reject) => {
        const child = spawn(getYtdlpPath(), ['-j', '--no-playlist', url], { windowsHide: true });
        let out = '';
        let err = '';

        child.stdout.on('data', (d) => { out += d.toString(); });
        child.stderr.on('data', (d) => { err += d.toString(); });

        const timeout = setTimeout(() => {
            child.kill();
            reject({ error: 'Timeout', details: 'Metadata fetch timed out after 30s' });
        }, 30000);

        child.on('close', (code) => {
            clearTimeout(timeout);
            if (code === 0) {
                try {
                    const meta = JSON.parse(out.split(/\r?\n/).find(Boolean));
                    resolve(meta);
                } catch (e) {
                    reject({ error: 'Parse error', details: e.message });
                }
            } else {
                reject({ error: 'yt-dlp error', details: err });
            }
        });
    });
});

// 3. Download Logic with ffmpeg support
ipcMain.handle('start-download', async (event, { url, formatTag, outputFilename, savePath }) => {
    if (activeUrls.has(url)) {
        return { success: false, error: 'already-downloading' };
    }

    const downloadId = Date.now().toString();
    const baseDir = savePath || app.getPath('downloads');
    const outPath = path.join(baseDir, outputFilename);

    let formatArg = (formatTag === 'audio')
        ? ['-f', 'bestaudio', '--extract-audio', '--audio-format', 'mp3']
        : ['-f', `bestvideo[height<=${formatTag}]+bestaudio[ext=m4a]/bestvideo[height<=${formatTag}]+bestaudio/best`, '--merge-output-format', 'mp4'];

    // yt-dlp appends .mp3 itself when using --extract-audio, so strip it from the -o path
    const ytdlpOutPath = (formatTag === 'audio') ? outPath.replace(/\.mp3$/, '') : outPath;

    const args = [
        ...formatArg,
        '--ffmpeg-location', FFMPEG_PATH,
        '--newline',
        '--no-playlist',
        '-o', ytdlpOutPath,
        url
    ];

    try {
        const child = spawn(getYtdlpPath(), args, { windowsHide: true });
        activeProcesses.set(downloadId, { child, outPath });
        activeUrls.add(url);

        child.stdout.on('data', (d) => {
            event.sender.send('yt-output', { id: downloadId, text: d.toString() });
        });

        child.stderr.on('data', (d) => {
            event.sender.send('yt-output', { id: downloadId, text: `ERROR: ${d.toString()}` });
        });

        child.on('close', (code) => {
            activeProcesses.delete(downloadId);
            activeUrls.delete(url);
            if (code !== 0) cleanPartFiles(outPath);
            event.sender.send('download-finished', {
                id: downloadId,
                success: code === 0,
                exitCode: code,
                outPath
            });
        });

        return { success: true, id: downloadId };
    } catch (err) {
        activeUrls.delete(url);
        return { success: false, error: err.message };
    }
});

// 4. Cancel Process
ipcMain.handle('cancel-download', async (event, downloadId) => {
    const entry = activeProcesses.get(downloadId);
    if (entry) {
        const { child, outPath } = entry;
        try {
            if (process.platform === 'win32') {
                exec(`taskkill /PID ${child.pid} /T /F`);
            } else {
                child.kill('SIGKILL');
            }
            activeProcesses.delete(downloadId);
            cleanPartFiles(outPath);
            return { canceled: true };
        } catch (e) {
            return { canceled: false, error: e.message };
        }
    }
    return { canceled: false };
});

function cleanPartFiles(outPath) {
    const dir = path.dirname(outPath);
    const base = path.basename(outPath);
    try {
        fs.readdirSync(dir)
            .filter(f => f.startsWith(base) && f.endsWith('.part'))
            .forEach(f => fs.unlinkSync(path.join(dir, f)));
    } catch (_) {}
}
