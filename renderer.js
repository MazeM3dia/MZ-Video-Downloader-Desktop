// UI ELEMENTS
const urlEl = document.getElementById('url');
const fetchBtn = document.getElementById('fetch');
const fetchStatus = document.getElementById('fetchStatus');
const metaContainer = document.getElementById('metaContainer');
const thumb = document.getElementById('thumb');
const titleEl = document.getElementById('title');
const uploaderEl = document.getElementById('uploader');
const durationEl = document.getElementById('duration');
const downloadBtn = document.getElementById('download');
const filenameEl = document.getElementById('filename');
const downloadsList = document.getElementById('downloadsList');
const progressTemplate = document.getElementById('progressTemplate');
const uploadDateEl = document.getElementById('uploadDate');
const pickLocationBtn = document.getElementById('pickLocation');
const locationPathEl = document.getElementById('locationPath');

let customDownloadPath = null;
const activeUI = new Map();
let currentMeta = null;

downloadBtn.disabled = true;

// Set version from package.json
window.api.getAppVersion().then(v => {
    document.querySelectorAll('.app-version').forEach(el => el.textContent = `MZ Video Downloader V${v}`);
    document.title = `MZ Video Downloader V${v}`;
});

// --- FETCH METADATA ---
async function doFetch() {
    const url = urlEl.value.trim();
    if (!url) return;
    fetchStatus.textContent = '';
    fetchBtn.disabled = true;
    fetchBtn.innerHTML = '<i>hourglass_empty</i><span>Fetching...</span>';

    try {
        const res = await window.api.fetchMetadata(url);
        
        // FIX: Assign res directly to currentMeta
        currentMeta = res;
        
        if (!currentMeta) throw new Error("No metadata returned");

        titleEl.textContent = currentMeta.title || 'Unknown Video';
        uploaderEl.textContent = currentMeta.uploader || currentMeta.channel || currentMeta.creator || currentMeta.uploader_id || '';
        if (currentMeta.duration) {
            const totalSec = Math.floor(currentMeta.duration);
            const h = Math.floor(totalSec / 3600);
            const m = Math.floor((totalSec % 3600) / 60);
            const s = String(totalSec % 60).padStart(2, '0');
            durationEl.textContent = `Duration: ${h > 0 ? `${h}:${String(m).padStart(2,'0')}:${s}` : `${m}:${s}`}`;
        } else {
            durationEl.textContent = '';
        }

        const thumbUrl = currentMeta.thumbnail
            || (currentMeta.thumbnails?.length && currentMeta.thumbnails[currentMeta.thumbnails.length - 1]?.url)
            || '';
        if (thumbUrl) {
            thumb.src = thumbUrl;
            thumb.style.display = '';
        } else {
            thumb.src = '';
            thumb.style.display = 'none';
        }
        
        const rawDate = currentMeta.upload_date;
        uploadDateEl.textContent = rawDate ? `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}` : '';
        
        metaContainer.classList.remove('d-none');
        fetchStatus.textContent = '';
        downloadBtn.disabled = false;
    } catch (err) {
        const details = err?.details || '';
        let msg = 'Error fetching video';
        if (/private video/i.test(details)) msg = 'Video is private';
        else if (/video unavailable/i.test(details)) msg = 'Video unavailable';
        else if (/confirm your age/i.test(details)) msg = 'Age-restricted — sign in required';
        else if (/not available in your country/i.test(details)) msg = 'Geo-blocked in your region';
        else if (/unable to extract/i.test(details)) msg = 'Could not extract video info';
        else if (/unsupported url/i.test(details)) msg = 'Unsupported URL';
        fetchStatus.textContent = msg;
        console.error("Metadata fetch failed:", err);
    } finally {
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = 'Fetch Video';
    }
}

fetchBtn.addEventListener('click', doFetch);
urlEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') doFetch(); });

// --- PICK FOLDER ---
pickLocationBtn.addEventListener('click', async () => {
    // This calls the select-folder handler in main.js
    const selectedPath = await window.api.selectFolder();
    
    if (selectedPath) {
        customDownloadPath = selectedPath;
        const pathParts = selectedPath.split(/[\\/]/).filter(p => p);
        locationPathEl.textContent = pathParts.length > 2 
            ? `.../${pathParts.slice(-2).join('/')}` 
            : selectedPath;
    }
});

// --- DOWNLOAD LOGIC ---
downloadBtn.addEventListener('click', async () => {
    const url = urlEl.value.trim();
    const fmt = document.querySelector('input[name="fmt"]:checked')?.value;
    if (!url) return;
    if (!fmt) {
        fetchStatus.textContent = 'Please select a format before downloading.';
        return;
    }

    let outName = filenameEl.value.trim() || currentMeta?.title || 'download';
    outName = outName
        .replace(/[\\/:"*?<>|]+/g, '')
        .replace(/[. ]+$/, '')
        .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, '_$1') || 'download';
    outName += (fmt === 'audio' ? '.mp3' : '.mp4');

    const clone = progressTemplate.content.cloneNode(true);
    const item = clone.querySelector('.download-item');
    const bar = clone.querySelector('.item-progress');
    const details = clone.querySelector('.item-details');
    const percentText = clone.querySelector('.item-percent');
    const stopBtn = clone.querySelector('.stop-btn');
    const stopIcon = stopBtn.querySelector('i');
    
    clone.querySelector('.item-title').textContent = outName;
    downloadsList.prepend(clone);

    // Pass the customDownloadPath to startDownload
    const res = await window.api.startDownload({ 
        url, 
        formatTag: fmt, 
        outputFilename: outName,
        savePath: customDownloadPath 
    });

    if (res.success) {
        activeUI.set(res.id, { bar, details, item, stopBtn, stopIcon, percentText });
        stopBtn.onclick = () => window.api.cancelDownload(res.id);
    } else if (res.error === 'already-downloading') {
        item.remove();
        fetchStatus.textContent = 'This video is already downloading.';
    } else {
        details.textContent = 'Failed to start';
    }
});

// --- OUTPUT HANDLERS ---
window.api.onYtOutput(({ id, text }) => {
    const ui = activeUI.get(id);
    if (!ui) return;

    if (text.includes('[Merger]') || text.includes('[ffmpeg]')) {
        ui.bar.classList.add('tertiary-text');
        ui.details.textContent = 'Finalizing...';
        return;
    }

    const m = text.match(/\[download\]\s+([0-9]{1,3}\.?[0-9]*)%(?:\s+of\s+([\S]+))?\s+at\s+([\S]+)\s+ETA\s+([\S]+)/i);
    if (m) {
        const p = parseFloat(m[1]);
        ui.bar.value = p;
        ui.percentText.textContent = p.toFixed(0) + '%';
        if (m[2] && !ui.fileSize) ui.fileSize = m[2];
        const sizeStr = ui.fileSize ? `${ui.fileSize} — ` : '';
        ui.details.textContent = `${sizeStr}${m[3]} — ETA ${m[4]}`;
        return;
    }
    const mSimple = text.match(/\[download\]\s+([0-9]{1,3}\.?[0-9]*)%/i);
    if (mSimple) {
        const p = parseFloat(mSimple[1]);
        ui.bar.value = p;
        ui.percentText.textContent = p.toFixed(0) + '%';
        ui.details.textContent = 'Downloading...';
    }
});

window.api.onDownloadFinished(({ id, success, exitCode, outPath }) => {
    const ui = activeUI.get(id);
    if (!ui) return;

    if (success) {
        ui.bar.value = 100;
        ui.bar.className = 'item-progress primary-text';
        ui.details.textContent = 'Completed';
        ui.stopBtn.className = 'stop-btn circle large no-margin primary';
        ui.stopIcon.textContent = 'delete_forever';

        const openBtn = document.createElement('button');
        openBtn.className = 'small border no-margin';
        openBtn.style.marginInlineStart = '0.5rem';
        openBtn.innerHTML = '<i>folder_open</i><span>Show in folder</span>';
        openBtn.onclick = () => window.api.openFolder(outPath);
        ui.item.querySelector('.item-details').after(openBtn);
    } else {
        ui.bar.className = 'item-progress error-text';
        ui.details.textContent = exitCode === null ? 'Cancelled' : `Failed (exit code ${exitCode})`;
        ui.stopIcon.textContent = 'report';
    }

    ui.stopBtn.onclick = () => {
        ui.item.remove();
        activeUI.delete(id);
    };
});

// --- HELPERS ---
document.getElementById('newDownload').addEventListener('click', () => {
    urlEl.value = '';
    filenameEl.value = '';
    metaContainer.classList.add('d-none');
    fetchStatus.textContent = '';
    currentMeta = null;
    document.querySelector('input[name="fmt"][value="1080"]').checked = true;
    downloadBtn.disabled = true;
});

// --- YT-DLP AUTO UPDATE ---
const updateBanner = document.getElementById('updateBanner');
updateBanner.style.display = 'none';
const updateBannerText = document.getElementById('updateBannerText');
const updateBannerBtn = document.getElementById('updateBannerBtn');
const updateBannerDismiss = document.getElementById('updateBannerDismiss');
let pendingDownloadUrl = null;

window.api.onYtdlpUpdateAvailable(({ currentVersion, latestVersion, downloadUrl }) => {
    pendingDownloadUrl = downloadUrl;
    updateBannerText.textContent = `yt-dlp update available: ${currentVersion} → ${latestVersion}`;
    updateBanner.style.display = 'block';
});

updateBannerDismiss.addEventListener('click', () => {
    updateBanner.style.display = 'none';
});

updateBannerBtn.addEventListener('click', async () => {
    if (!pendingDownloadUrl) return;
    updateBannerBtn.disabled = true;
    updateBannerDismiss.disabled = true;
    updateBannerText.textContent = 'Downloading update... 0%';

    window.api.onYtdlpDownloadProgress((pct) => {
        updateBannerText.textContent = `Downloading update... ${pct}%`;
    });

    const res = await window.api.downloadYtdlpUpdate(pendingDownloadUrl);
    updateBannerBtn.disabled = false;
    updateBannerDismiss.disabled = false;

    if (res.success) {
        updateBannerText.textContent = 'yt-dlp updated successfully. Restart the app to use the new version.';
        updateBannerBtn.style.display = 'none';
    } else {
        updateBannerText.textContent = `Update failed: ${res.error}`;
    }
});

urlEl.addEventListener('focus', async () => {
    if (urlEl.value.trim()) return;
    try {
        const text = await window.api.readClipboard();
        if (/^https?:\/\//i.test(text)) urlEl.value = text;
    } catch (_) {}
});

urlEl.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (typeof ui === "function") ui("#contextMenu", e);
});

document.getElementById("pasteOption").addEventListener("click", async () => {
    try {
        // Use the bridge instead of navigator.clipboard
        const text = await window.api.readClipboard(); 
        urlEl.value = text;
        urlEl.focus();
        
        // Close menu if beercss 'ui' function exists
        if (typeof ui === "function") ui("#contextMenu");
    } catch (err) {
        console.error("Paste failed", err);
    }
});