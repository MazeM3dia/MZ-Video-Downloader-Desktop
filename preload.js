const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fetchMetadata: (url) => ipcRenderer.invoke('fetch-metadata', url),
  startDownload: (opts) => ipcRenderer.invoke('start-download', opts),
  cancelDownload: (id) => ipcRenderer.invoke('cancel-download', id),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readClipboard: () => ipcRenderer.invoke('read-clipboard'), // Add this
  downloadYtdlpUpdate: (url) => ipcRenderer.invoke('download-ytdlp-update', url),
  openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onYtdlpUpdateAvailable: (cb) => {
    ipcRenderer.removeAllListeners('ytdlp-update-available');
    ipcRenderer.on('ytdlp-update-available', (ev, data) => cb(data));
  },
  onYtdlpDownloadProgress: (cb) => {
    ipcRenderer.removeAllListeners('ytdlp-download-progress');
    ipcRenderer.on('ytdlp-download-progress', (ev, pct) => cb(pct));
  },
  onYtOutput: (cb) => {
    ipcRenderer.removeAllListeners('yt-output');
    ipcRenderer.on('yt-output', (ev, data) => cb(data));
  },
  onDownloadFinished: (cb) => {
    ipcRenderer.removeAllListeners('download-finished');
    ipcRenderer.on('download-finished', (ev, data) => cb(data));
  },
});