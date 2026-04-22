const { app, BrowserWindow, ipcMain, dialog, clipboard, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const https = require('https');

const { version: APP_VERSION } = require('./package.json');

const USER_DATA_YTDLP = path.join(app.getPath('userData'), 'yt-dlp.exe');

const BUNDLED_YTDLP = app.isPackaged
    ? path.join(process.resourcesPath, 'yt-dlp.exe')
    : path.join(__dirname, 'bin', 'yt-dlp.exe');

function getYtdlpPath() {
    return fs.existsSync(USER_DATA_YTDLP) ? USER_DATA_YTDLP : BUNDLED_YTDLP;
}

const FFMPEG_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'ffmpeg.exe')
    : path.join(__dirname, 'bin', 'ffmpeg.exe');

const activeProcesses = new Map(); // { id: { child, outPath } }
const activeUrls = new Set();

let mainWindow = null;

ipcMain.handle('read-clipboard', () => clipboard.readText());
ipcMain.handle('get-app-version', () => APP_VERSION);

ipcMain.handle('open-folder', async (event, filePath) => {
    shell.showItemInFolder(filePath);
});

function createWindow() {
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

    mainWindow.webContents.once('did-finish-load', () => {
        setTimeout(() => checkYtdlpUpdate(), 2000);
    });
}

app.whenReady().then(createWindow);

// --- YT-DLP UPDATE CHECK ---

function getCurrentVersion() {
    return new Promise((resolve) => {
        const child = spawn(getYtdlpPath(), ['--version'], { windowsHide: true });
        let out = '';
        child.stdout.on('data', (d) => { out += d.toString(); });
        child.on('close', () => resolve(out.trim()));
        child.on('error', () => resolve('unknown'));
    });
}

function getLatestRelease() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: '/repos/yt-dlp/yt-dlp/releases/latest',
            headers: { 'User-Agent': 'MZ-Video-Downloader' }
        };
        https.get(options, (res) => {
            let data = '';
            res.on('data', (d) => { data += d; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const asset = json.assets?.find(a => a.name === 'yt-dlp.exe');
                    resolve({
                        version: json.tag_name,
                        downloadUrl: asset?.browser_download_url || null
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function checkYtdlpUpdate() {
    try {
        const [current, latest] = await Promise.all([getCurrentVersion(), getLatestRelease()]);
        if (latest.version && current !== latest.version) {
            mainWindow?.webContents.send('ytdlp-update-available', {
                currentVersion: current,
                latestVersion: latest.version,
                downloadUrl: latest.downloadUrl
            });
        }
    } catch (e) {
        console.error('Update check failed:', e.message);
    }
}

ipcMain.handle('download-ytdlp-update', async (event, downloadUrl) => {
    return new Promise((resolve) => {
        const tmpPath = USER_DATA_YTDLP + '.tmp';
        const file = fs.createWriteStream(tmpPath);

        const doRequest = (url, redirectCount = 0) => {
            if (redirectCount > 5) {
                resolve({ success: false, error: 'Too many redirects' });
                return;
            }
            https.get(url, { headers: { 'User-Agent': 'MZ-Video-Downloader' } }, (res) => {
                if (res.statusCode === 302 || res.statusCode === 301) {
                    doRequest(res.headers.location, redirectCount + 1);
                    return;
                }
                const total = parseInt(res.headers['content-length'] || '0', 10);
                let received = 0;
                res.on('data', (chunk) => {
                    received += chunk.length;
                    if (total) {
                        const pct = Math.round((received / total) * 100);
                        event.sender.send('ytdlp-download-progress', pct);
                    }
                });
                res.pipe(file);
                file.on('finish', () => {
                    file.close(() => {
                        try {
                            if (fs.existsSync(USER_DATA_YTDLP)) fs.unlinkSync(USER_DATA_YTDLP);
                            fs.renameSync(tmpPath, USER_DATA_YTDLP);
                            resolve({ success: true });
                        } catch (e) {
                            resolve({ success: false, error: e.message });
                        }
                    });
                });
            }).on('error', (e) => {
                fs.unlink(tmpPath, () => {});
                resolve({ success: false, error: e.message });
            });
        };

        doRequest(downloadUrl);
    });
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
        : ['-f', `bestvideo[height<=${formatTag}]+bestaudio/best`, '--merge-output-format', 'mp4'];

    const args = [
        ...formatArg,
        '--ffmpeg-location', FFMPEG_PATH,
        '--newline',
        '--no-playlist',
        '-o', outPath,
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
