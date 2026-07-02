// Tauri bridge — exposes window.api identical to the Electron preload
(function () {
    const { invoke } = window.__TAURI__.core;
    const { listen } = window.__TAURI__.event;

    let ytOutputUnlisten = null;
    let downloadFinishedUnlisten = null;

    // Tauri rejects with a raw string; renderer expects { details } shape
    function wrapErr(p) {
        return p.catch(e => Promise.reject(typeof e === 'string' ? { error: 'yt-dlp error', details: e } : e));
    }

    window.api = {
        fetchMetadata: (url) => wrapErr(invoke('fetch_metadata', { url })),
        startDownload: (opts) => wrapErr(invoke('start_download', { args: opts })),
        cancelDownload: (id) => invoke('cancel_download', { id }),
        selectFolder: () => invoke('select_folder'),
        readClipboard: () => invoke('read_clipboard'),
        openFolder: (path) => invoke('open_folder', { path }),
        openFile: (path) => invoke('open_file', { path }),
        deleteFile: (path) => invoke('delete_file', { path }),
        getAppVersion: () => invoke('get_app_version'),

        onYtOutput: (cb) => {
            if (ytOutputUnlisten) ytOutputUnlisten();
            listen('yt-output', (e) => cb(e.payload)).then(u => { ytOutputUnlisten = u; });
        },
        onDownloadFinished: (cb) => {
            if (downloadFinishedUnlisten) downloadFinishedUnlisten();
            listen('download-finished', (e) => cb(e.payload)).then(u => { downloadFinishedUnlisten = u; });
        },
    };
})();
