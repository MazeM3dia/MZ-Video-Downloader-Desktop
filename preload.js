const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  fetchMetadata: (url) => ipcRenderer.invoke('fetch-metadata', url),
  startDownload: (opts) => ipcRenderer.invoke('start-download', opts),
  cancelDownload: (id) => ipcRenderer.invoke('cancel-download', id),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),
  openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onYtOutput: (cb) => {
    ipcRenderer.removeAllListeners('yt-output');
    ipcRenderer.on('yt-output', (ev, data) => cb(data));
  },
  onDownloadFinished: (cb) => {
    ipcRenderer.removeAllListeners('download-finished');
    ipcRenderer.on('download-finished', (ev, data) => cb(data));
  },
});
