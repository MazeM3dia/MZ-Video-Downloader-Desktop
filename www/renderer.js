document.addEventListener('contextmenu', e => {
    if (!e.target.matches('input, textarea')) e.preventDefault();
});

// Metadata (titles, artists, uploader names, etc.) comes from YouTube/yt-dlp —
// treat it as untrusted text and escape before inserting via innerHTML.
function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

// ── Element refs ──────────────────────────────────────────────
const urlEl           = document.getElementById('url');
const fetchBtn        = document.getElementById('fetch');
const fetchStatus     = document.getElementById('fetchStatus');
const cardsList       = document.getElementById('cardsList');
const cardTemplate    = document.getElementById('cardTemplate');
const emptyState      = document.getElementById('emptyState');
const ctxMenu         = document.getElementById('ctxMenu');
const settingsBtn     = document.getElementById('settingsBtn');
const settingsPopover = document.getElementById('settingsPopover');
const themeToggle     = document.getElementById('themeToggle');
const themeLabel      = document.getElementById('themeLabel');
const themeIconWrap   = document.getElementById('themeIconWrap');
const defaultLocationBtn   = document.getElementById('defaultLocationBtn');
const defaultLocationLabel = document.getElementById('defaultLocationLabel');
const clearListBtn    = document.getElementById('clearListBtn');
const titlebarMinimize = document.getElementById('titlebarMinimize');
const titlebarClose    = document.getElementById('titlebarClose');

titlebarMinimize.addEventListener('click', () => window.api.minimizeWindow());
titlebarClose.addEventListener('click', () => window.api.closeWindow());

// Update banner
const updateBanner       = document.getElementById('updateBanner');
const updateBannerText   = document.getElementById('updateBannerText');
const updateBannerBtn    = document.getElementById('updateBannerBtn');
const updateBannerDismiss = document.getElementById('updateBannerDismiss');

// Playlist modal
const playlistModal         = document.getElementById('playlistModal');
const playlistModalTitle    = document.getElementById('playlistModalTitle');
const playlistModalSub      = document.getElementById('playlistModalSub');
const playlistModalClose    = document.getElementById('playlistModalClose');
const playlistSelectAll     = document.getElementById('playlistSelectAll');
const playlistSelectNone    = document.getElementById('playlistSelectNone');
const playlistSelectedCount = document.getElementById('playlistSelectedCount');
const playlistTrackList     = document.getElementById('playlistTrackList');
const playlistTrackTemplate = document.getElementById('playlistTrackTemplate');
const playlistModalStatus   = document.getElementById('playlistModalStatus');
const playlistCancelBtn     = document.getElementById('playlistCancelBtn');
const playlistAddBtn        = document.getElementById('playlistAddBtn');

// Discard-confirm modal
const discardConfirmModal = document.getElementById('discardConfirmModal');
const discardConfirmText  = document.getElementById('discardConfirmText');
const discardKeepGoing    = document.getElementById('discardKeepGoing');
const discardConfirmBtn   = document.getElementById('discardConfirmBtn');

const activeUI   = new Map();
const urlClearBtn = document.getElementById('urlClear');

function updateUrlClear() {
    urlClearBtn.style.display = urlEl.value ? 'flex' : 'none';
}

urlClearBtn.addEventListener('click', () => {
    urlEl.value = '';
    fetchStatus.textContent = '';
    updateUrlClear();
});

urlEl.addEventListener('input', updateUrlClear);

// ── SVG snippets ──────────────────────────────────────────────
// Phosphor: MagnifyingGlass
const SVG_SEARCH = `<svg class="btn-icon-svg" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"/></svg>`;

// Phosphor-style spinner (arc loader, works with .spin CSS animation)
const SVG_LOADER = `<svg class="btn-icon-svg spin" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 256 256" fill="none" stroke="currentColor" stroke-width="24" stroke-linecap="round"><path d="M128 32 A96 96 0 0 1 224 128" /></svg>`;

// Phosphor: Folder (used in show-in-folder button)
const SVG_FOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M216,72H131.31L104,44.69A15.86,15.86,0,0,0,92.69,40H40A16,16,0,0,0,24,56V200.62A15.4,15.4,0,0,0,39.38,216H216.89A15.13,15.13,0,0,0,232,200.89V88A16,16,0,0,0,216,72ZM40,56H92.69l16,16H40ZM216,200H40V88H216Z"/></svg>`;

// Phosphor: User / CalendarBlank / Clock (meta row icons)
const SVG_USER  = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"/></svg>`;
const SVG_DATE  = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Zm-68-76a12,12,0,1,1-12-12A12,12,0,0,1,140,132Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,132ZM96,172a12,12,0,1,1-12-12A12,12,0,0,1,96,172Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,140,172Zm44,0a12,12,0,1,1-12-12A12,12,0,0,1,184,172Z"/></svg>`;
const SVG_CLOCK = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor"><path d="M128,40a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,40Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,216ZM173.66,90.34a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32l40-40A8,8,0,0,1,173.66,90.34ZM96,16a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,16Z"/></svg>`;
const SVG_ALBUM = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm0-144a56.06,56.06,0,0,0-56,56,8,8,0,0,1-16,0,72.08,72.08,0,0,1,72-72,8,8,0,0,1,0,16Zm72,56a72.08,72.08,0,0,1-72,72,8,8,0,0,1,0-16,56.06,56.06,0,0,0,56-56,8,8,0,0,1,16,0Zm-40,0a32,32,0,1,0-32,32A32,32,0,0,0,160,128Zm-48,0a16,16,0,1,1,16,16A16,16,0,0,1,112,128Z"/></svg>`;
const SVG_MUSIC_NOTE = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor"><path d="M212.92,25.69a8,8,0,0,0-6.86-1.45l-128,32A8,8,0,0,0,72,64V174.08A36,36,0,1,0,88,204V110.25l112-28v69.83A36,36,0,1,0,216,180V32A8,8,0,0,0,212.92,25.69ZM52,224a20,20,0,1,1,20-20A20,20,0,0,1,52,224Zm128-24a20,20,0,1,1,20-20A20,20,0,0,1,180,200ZM88,93.75V70.25l112-28v23.5Z"/></svg>`;
const SVG_FILM = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 256 256" fill="currentColor"><path d="M164.44,105.34l-48-32A8,8,0,0,0,104,80v64a8,8,0,0,0,12.44,6.66l48-32a8,8,0,0,0,0-13.32ZM120,129.05V95l25.58,17ZM216,40H40A16,16,0,0,0,24,56V168a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,128H40V56H216V168Zm16,40a8,8,0,0,1-8,8H32a8,8,0,0,1,0-16H224A8,8,0,0,1,232,208Z"/></svg>`;

// Phosphor: Moon (shown when in light mode → switch to dark)
const SVG_MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z"/></svg>`;

// Phosphor: Sun (shown when in dark mode → switch to light)
const SVG_SUN = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 256 256" fill="currentColor"><path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z"/></svg>`;

// ── Theme ─────────────────────────────────────────────────────
let isDark = true;

function updateThemeUI() {
    if (isDark) {
        themeIconWrap.innerHTML = SVG_SUN;
        themeLabel.textContent  = 'Light mode';
        document.documentElement.classList.add('dark');
    } else {
        themeIconWrap.innerHTML = SVG_MOON;
        themeLabel.textContent  = 'Dark mode';
        document.documentElement.classList.remove('dark');
    }
}

themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    updateThemeUI();
    closeSettingsPopover();
});

// ── Default save path ─────────────────────────────────────────
let defaultSavePath = null;

defaultLocationBtn.addEventListener('click', async () => {
    const selected = await window.api.selectFolder();
    if (selected) {
        defaultSavePath = selected;
        const parts = selected.split(/[\\/]/).filter(Boolean);
        const short = parts.length > 2 ? `.../${parts.slice(-2).join('/')}` : selected;
        defaultLocationLabel.textContent = short;
    }
    closeSettingsPopover();
});

// ── Clear list ────────────────────────────────────────────────
clearListBtn.addEventListener('click', () => {
    [...cardsList.querySelectorAll('.dl-card')].forEach(card => {
        const state = card.dataset.state;
        if (state === 'downloading') {
            const id = card.dataset.activeId;
            if (id) { window.api.cancelDownload(id); activeUI.delete(id); }
        } else if (state === 'error' && card.dataset.outPath) {
            window.api.deleteFile(card.dataset.outPath);
        }
        card.closest('li').remove();
    });
    emptyState.style.display = '';
    closeSettingsPopover();
});

// ── Settings popover ──────────────────────────────────────────
function openSettingsPopover() {
    settingsPopover.style.display = 'block';
    settingsBtn.classList.add('active');

    const rect = settingsBtn.getBoundingClientRect();
    const pop  = settingsPopover.getBoundingClientRect();
    const top  = rect.bottom + 4;
    const left = Math.min(rect.right - pop.width, window.innerWidth - pop.width - 8);
    settingsPopover.style.top  = `${top}px`;
    settingsPopover.style.left = `${Math.max(8, left)}px`;
}

function closeSettingsPopover() {
    settingsPopover.style.display = 'none';
    settingsBtn.classList.remove('active');
}

settingsBtn.addEventListener('click', e => {
    e.stopPropagation();
    settingsPopover.style.display === 'none' ? openSettingsPopover() : closeSettingsPopover();
});

document.addEventListener('click', e => {
    if (!settingsPopover.contains(e.target) && e.target !== settingsBtn) closeSettingsPopover();
    if (!ctxMenu.contains(e.target)) ctxMenu.style.display = 'none';
    if (_openQualityClose) _openQualityClose();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeSettingsPopover(); ctxMenu.style.display = 'none'; if (_openQualityClose) _openQualityClose();
        if (discardConfirmModal.style.display !== 'none') { discardConfirmModal.style.display = 'none'; }
        else if (playlistModal.style.display !== 'none') requestClosePlaylistModal();
    }
});

// ── Version ───────────────────────────────────────────────────
window.api.getAppVersion().then(v => {
    document.querySelectorAll('.app-version').forEach(el => {
        el.textContent = `MZ Video Downloader V${v}`;
    });
    document.title = `MZ Video Downloader V${v}`;
});

// ── yt-dlp update check ─────────────────────────────────────────
window.api.checkYtdlpUpdate().then(info => {
    if (!info?.updateAvailable) return;
    updateBannerText.textContent = `yt-dlp update available: ${info.current || 'unknown'} → ${info.latest}`;
    updateBanner.dataset.downloadUrl = info.downloadUrl;
    updateBanner.style.display = 'flex';
}).catch(() => {});

updateBannerDismiss.addEventListener('click', () => { updateBanner.style.display = 'none'; });

updateBannerBtn.addEventListener('click', async () => {
    const url = updateBanner.dataset.downloadUrl;
    if (!url) return;

    updateBannerBtn.disabled = true;
    updateBannerDismiss.style.display = 'none';
    updateBannerText.textContent = 'Downloading update… 0%';

    window.api.onYtdlpUpdateProgress(pct => {
        updateBannerText.textContent = `Downloading update… ${pct}%`;
    });

    try {
        await window.api.downloadYtdlpUpdate(url);
        updateBannerText.textContent = 'yt-dlp updated — no restart needed';
        setTimeout(() => { updateBanner.style.display = 'none'; }, 3000);
    } catch (_) {
        updateBannerText.textContent = 'Update failed — try again later';
        updateBannerBtn.disabled = false;
        updateBannerDismiss.style.display = '';
    }
});

// ── Auto-paste on focus ───────────────────────────────────────
urlEl.addEventListener('focus', async () => {
    if (urlEl.value.trim()) return;
    try {
        const text = await window.api.readClipboard();
        if (/^https?:\/\//i.test(text)) { urlEl.value = text; updateUrlClear(); }
    } catch (_) {}
});

// ── Auto-fetch on paste ───────────────────────────────────────
urlEl.addEventListener('paste', () => {
    setTimeout(() => {
        if (/^https?:\/\//i.test(urlEl.value.trim())) doFetch();
    }, 50);
});

urlEl.addEventListener('keydown', e => { if (e.key === 'Enter') doFetch(); });
fetchBtn.addEventListener('click', doFetch);

// ── Context menu ──────────────────────────────────────────────
urlEl.addEventListener('contextmenu', e => {
    e.preventDefault();
    ctxMenu.style.display = 'block';
    const rect = ctxMenu.getBoundingClientRect();
    const x = Math.min(e.clientX, window.innerWidth  - rect.width  - 8);
    const y = Math.min(e.clientY, window.innerHeight - rect.height - 8);
    ctxMenu.style.left = `${x}px`;
    ctxMenu.style.top  = `${y}px`;
});

document.getElementById('ctxPaste').addEventListener('click', async () => {
    ctxMenu.style.display = 'none';
    try {
        const text = await window.api.readClipboard();
        urlEl.value = text;
        urlEl.focus();
        if (/^https?:\/\//i.test(text)) doFetch();
    } catch (_) {}
});

document.getElementById('ctxClear').addEventListener('click', () => {
    ctxMenu.style.display = 'none';
    urlEl.value = '';
    fetchStatus.textContent = '';
    urlEl.focus();
});

// ── Fetch metadata ────────────────────────────────────────────
async function doFetch() {
    const url = urlEl.value.trim();
    if (!url) return;

    fetchStatus.textContent = '';
    fetchBtn.disabled = true;
    fetchBtn.innerHTML = `${SVG_LOADER} Fetching...`;

    try {
        if (/[?&]list=/i.test(url)) {
            const playlist = await window.api.fetchPlaylist(url);
            if (playlist && playlist._type === 'playlist' && playlist.entries?.length) {
                openPlaylistModal(playlist, url);
                urlEl.value = '';
                updateUrlClear();
                return;
            }
        }

        const meta = await window.api.fetchMetadata(url);
        if (!meta) throw new Error('No metadata returned');
        createCard(url, meta);
        urlEl.value = '';
        updateUrlClear();
    } catch (err) {
        const d = err?.details || '';
        let msg = 'Error fetching video';
        if      (/private video/i.test(d))                 msg = 'Video is private';
        else if (/video unavailable/i.test(d))             msg = 'Video unavailable';
        else if (/confirm your age/i.test(d))              msg = 'Age-restricted — sign in required';
        else if (/not available in your country/i.test(d)) msg = 'Geo-blocked in your region';
        else if (/unable to extract/i.test(d))             msg = 'Could not extract video info';
        else if (/unsupported url/i.test(d))               msg = 'Unsupported URL';
        fetchStatus.textContent = msg;
    } finally {
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = `${SVG_SEARCH} Fetch Video`;
    }
}

// ── Playlist modal ──────────────────────────────────────────────
let playlistCheckboxes = [];
let playlistIsAdding   = false;
let playlistAbort      = false;
let playlistAddedCards = [];

function stripTopicSuffix(name) {
    return (name || '').replace(/\s*-\s*Topic$/i, '').trim();
}

function classifyPlaylist(playlist, sourceUrl) {
    const isYTMusic = /music\.youtube\.com/i.test(playlist.original_url || sourceUrl || '');
    const isAlbum   = /^OLAK5uy_/.test(playlist.id || '');
    if (isAlbum)   return { label: 'Album',           icon: SVG_ALBUM };
    if (isYTMusic) return { label: 'Music playlist',  icon: SVG_MUSIC_NOTE };
    return { label: 'Playlist', icon: SVG_FILM };
}

function updatePlaylistCount() {
    const checked = playlistCheckboxes.filter(cb => cb.checked && !cb.disabled).length;
    playlistSelectedCount.textContent = `${checked} of ${playlistCheckboxes.length} selected`;
    playlistAddBtn.disabled = checked === 0;
}

function syncTileSelected(check) {
    const li = check.closest('.playlist-tile');
    if (li) li.classList.toggle('selected', check.checked);
}

function openPlaylistModal(playlist, sourceUrl) {
    const entries = playlist.entries || [];
    const type = classifyPlaylist(playlist, sourceUrl);
    const owner = playlist.uploader || playlist.channel
        || stripTopicSuffix(entries[0]?.channel || entries[0]?.uploader) || 'Unknown';

    playlistModalTitle.textContent = playlist.title || 'Playlist';
    playlistModalSub.innerHTML = [
        `<span class="meta-item">${type.icon}<span>${type.label}</span></span>`,
        `<span class="meta-item">${SVG_USER}<span>${escapeHtml(owner)}</span></span>`,
        `<span class="meta-item">${SVG_FILM}<span>${entries.length} item${entries.length === 1 ? '' : 's'}</span></span>`,
    ].join('<span class="meta-sep">·</span>');

    playlistModalStatus.textContent = '';
    playlistTrackList.innerHTML = '';
    playlistTrackList.classList.remove('adding');
    playlistCheckboxes = [];
    playlistIsAdding   = false;
    playlistAbort      = false;
    playlistAddedCards = [];
    playlistAddBtn.textContent = 'Add selected';
    playlistCancelBtn.textContent = 'Cancel';

    entries.forEach(entry => {
        const unavailable = !entry.id || /^\[(private|deleted|unavailable)/i.test(entry.title || '');
        const clone = playlistTrackTemplate.content.cloneNode(true);
        const li        = clone.querySelector('.playlist-tile');
        const thumb     = clone.querySelector('.playlist-tile-thumb');
        const check     = clone.querySelector('.playlist-track-check');
        const checkmark = clone.querySelector('.playlist-tile-checkmark');
        const title     = clone.querySelector('.playlist-tile-title');
        const artist    = clone.querySelector('.playlist-tile-artist');
        const dur       = clone.querySelector('.playlist-tile-dur');

        checkmark.innerHTML = SVG_CHECK;

        const thumbUrl = entry.thumbnails?.length ? entry.thumbnails[entry.thumbnails.length - 1].url : '';
        const fallbackThumb = entry.id ? `https://i.ytimg.com/vi/${entry.id}/hqdefault.jpg` : '';
        thumb.src = thumbUrl || fallbackThumb;
        thumb.addEventListener('error', () => {
            if (fallbackThumb && thumb.src !== fallbackThumb) thumb.src = fallbackThumb;
            else thumb.style.visibility = 'hidden';
        }, { once: false });

        title.textContent  = entry.title || 'Unavailable';
        title.title        = entry.title || '';
        artist.textContent = stripTopicSuffix(entry.artist || entry.channel || entry.uploader || '');
        dur.textContent    = entry.duration ? formatDuration(entry.duration) : '';
        check.checked  = !unavailable;
        check.disabled = unavailable;
        li.dataset.unavailable = String(unavailable);
        li.dataset.entryId = entry.id || '';
        li.classList.toggle('selected', check.checked);
        check.addEventListener('change', () => { syncTileSelected(check); updatePlaylistCount(); });

        playlistTrackList.appendChild(clone);
        playlistCheckboxes.push(check);
    });

    updatePlaylistCount();
    playlistModal.style.display = 'flex';
    playlistModal._entries = entries;
}

function closePlaylistModal() {
    playlistModal.style.display = 'none';
    playlistModal._entries = null;
}

function requestClosePlaylistModal() {
    if (!playlistIsAdding) { closePlaylistModal(); return; }
    discardConfirmText.textContent = playlistAddedCards.length
        ? `${playlistAddedCards.length} track${playlistAddedCards.length === 1 ? '' : 's'} already added. Stopping now will remove them from your list.`
        : 'This will stop adding the remaining tracks.';
    discardConfirmModal.style.display = 'flex';
}

playlistModalClose.addEventListener('click', requestClosePlaylistModal);
playlistCancelBtn.addEventListener('click', requestClosePlaylistModal);
playlistModal.addEventListener('click', e => { if (e.target === playlistModal) requestClosePlaylistModal(); });

discardKeepGoing.addEventListener('click', () => { discardConfirmModal.style.display = 'none'; });
discardConfirmBtn.addEventListener('click', () => {
    playlistAbort = true;
    playlistAddedCards.forEach(card => card.remove());
    playlistAddedCards = [];
    discardConfirmModal.style.display = 'none';
    closePlaylistModal();
});

playlistSelectAll.addEventListener('click', () => {
    playlistCheckboxes.forEach(cb => { if (!cb.disabled) { cb.checked = true; syncTileSelected(cb); } });
    updatePlaylistCount();
});
playlistSelectNone.addEventListener('click', () => {
    playlistCheckboxes.forEach(cb => { cb.checked = false; syncTileSelected(cb); });
    updatePlaylistCount();
});

playlistAddBtn.addEventListener('click', async () => {
    const entries = playlistModal._entries || [];
    const items = [...playlistTrackList.querySelectorAll('.playlist-tile')]
        .map((li, i) => ({ li, entry: entries[i] }))
        .filter(({ li }) => li.querySelector('.playlist-track-check').checked && !li.querySelector('.playlist-track-check').disabled);

    if (!items.length) return;

    playlistIsAdding   = true;
    playlistAbort      = false;
    playlistAddedCards = [];
    playlistAddBtn.disabled      = true;
    playlistSelectAll.disabled   = true;
    playlistSelectNone.disabled  = true;
    playlistTrackList.classList.add('adding');

    let added = 0, failed = 0;
    for (const { entry } of items) {
        if (playlistAbort) break;
        playlistModalStatus.textContent = `Adding ${added + failed + 1} of ${items.length}…`;
        const watchUrl = entry.url || `https://www.youtube.com/watch?v=${entry.id}`;
        try {
            const meta = await window.api.fetchMetadata(watchUrl);
            if (!meta) throw new Error('No metadata returned');
            const card = createCard(watchUrl, meta);
            playlistAddedCards.push(card);
            added++;
        } catch (_) {
            failed++;
        }
    }

    playlistIsAdding = false;
    if (playlistAbort) return;

    playlistModalStatus.textContent = failed
        ? `Added ${added} track${added === 1 ? '' : 's'}, ${failed} failed`
        : `Added ${added} track${added === 1 ? '' : 's'}`;
    playlistAddBtn.disabled      = false;
    playlistSelectAll.disabled   = false;
    playlistSelectNone.disabled  = false;
    playlistTrackList.classList.remove('adding');
    playlistCancelBtn.textContent = 'Close';

    setTimeout(closePlaylistModal, failed ? 2000 : 800);
});

// ── Quality dropdown ──────────────────────────────────────────
const QUALITY_OPTIONS = [
    { value: '1080', label: 'HD 1080p' },
    { value: '720',  label: 'HD 720p'  },
    { value: '480',  label: 'SD 480p'  },
    { value: '360',  label: 'SD 360p'  },
    { value: 'audio',label: 'MP3 Audio'},
];

const SVG_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-64-64a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>`;
const SVG_CARET = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 256 256" fill="currentColor"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"/></svg>`;

let _openQualityClose = null;

function makeQualitySelect(wrap) {
    let currentValue = '1080';
    let isDisabled   = false;

    // Trigger button
    const trigger = document.createElement('button');
    trigger.type  = 'button';
    trigger.className = 'quality-trigger';
    trigger.setAttribute('-webkit-app-region', 'no-drag');

    const labelSpan = document.createElement('span');
    labelSpan.className = 'quality-trigger-label';
    const caretSpan = document.createElement('span');
    caretSpan.className = 'quality-trigger-caret';
    caretSpan.innerHTML = SVG_CARET;
    trigger.appendChild(labelSpan);
    trigger.appendChild(caretSpan);

    // Dropdown panel
    const menu = document.createElement('div');
    menu.className = 'quality-menu';
    menu.style.display = 'none';

    function setLabel(val) {
        const opt = QUALITY_OPTIONS.find(o => o.value === val);
        labelSpan.textContent = opt ? opt.label : val;
    }

    function renderItems() {
        menu.innerHTML = '';
        QUALITY_OPTIONS.forEach(opt => {
            const item = document.createElement('button');
            item.type = 'button';
            item.className = 'quality-item' + (opt.value === currentValue ? ' quality-item-active' : '');
            item.dataset.value = opt.value;
            item.innerHTML = `<span class="quality-item-check">${opt.value === currentValue ? SVG_CHECK : ''}</span>${opt.label}`;
            item.addEventListener('click', () => {
                currentValue = opt.value;
                setLabel(currentValue);
                closeMenu();
                renderItems();
            });
            menu.appendChild(item);
        });
    }

    function openMenu() {
        if (_openQualityClose) _openQualityClose();
        menu.style.display = 'block';
        trigger.classList.add('quality-trigger-open');
        _openQualityClose = closeMenu;

        // Position: below trigger, left-aligned
        const rect = trigger.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top  = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.zIndex = '1000';

        // Flip up if not enough space below
        requestAnimationFrame(() => {
            const mRect = menu.getBoundingClientRect();
            if (mRect.bottom > window.innerHeight - 8) {
                menu.style.top = `${rect.top - mRect.height - 4}px`;
            }
        });
    }

    function closeMenu() {
        menu.style.display = 'none';
        trigger.classList.remove('quality-trigger-open');
        if (_openQualityClose === closeMenu) _openQualityClose = null;
    }

    trigger.addEventListener('click', e => {
        e.stopPropagation();
        if (isDisabled) return;
        menu.style.display === 'none' ? openMenu() : closeMenu();
    });

    setLabel(currentValue);
    renderItems();
    wrap.appendChild(trigger);
    document.body.appendChild(menu);

    // Close on outside click (reuse existing document listener)
    menu._closeMenu = closeMenu;

    return {
        get value()       { return currentValue; },
        set value(val) {
            currentValue = val;
            setLabel(currentValue);
            renderItems();
        },
        set disabled(val) {
            isDisabled = val;
            trigger.disabled = val;
            trigger.classList.toggle('quality-trigger-disabled', val);
            if (val) closeMenu();
        }
    };
}

// ── Create card ───────────────────────────────────────────────
function createCard(url, meta) {
    const clone          = cardTemplate.content.cloneNode(true);
    const card           = clone.querySelector('.dl-card');
    const dismissBtn     = clone.querySelector('.card-dismiss');
    const thumbEl        = clone.querySelector('.dl-thumb');
    const titleInput     = clone.querySelector('.item-title');
    const metaEl         = clone.querySelector('.item-meta');
    const qualitySel     = makeQualitySelect(clone.querySelector('.item-quality-wrap'));
    const locationBtn    = clone.querySelector('.item-location');
    const locationLbl    = clone.querySelector('.item-location-label');
    const etaEl          = clone.querySelector('.item-eta');
    const startBtn       = clone.querySelector('.item-start');
    const cancelBtn      = clone.querySelector('.item-cancel');
    const bar            = clone.querySelector('.item-progress');
    const pct            = clone.querySelector('.item-pct');
    const statusEl       = clone.querySelector('.item-status');
    const completionDiv  = clone.querySelector('.item-completion');
    const completionText = clone.querySelector('.item-completion-text');

    card.dataset.state = 'pending';

    // Thumbnail
    const thumbUrl = meta.thumbnail
        || (meta.thumbnails?.length && meta.thumbnails[meta.thumbnails.length - 1]?.url)
        || '';
    if (thumbUrl) { thumbEl.src = thumbUrl; } else { thumbEl.style.display = 'none'; }

    // Detect music track (YT Music / any extractor exposing song metadata)
    const isMusicTrack = Boolean(meta.track && meta.artist);
    if (isMusicTrack) qualitySel.value = 'audio';

    // Title
    titleInput.value = (isMusicTrack ? meta.track : meta.title) || meta.title || 'Unknown Video';

    // Meta: artist/uploader · release year/date · duration
    const uploader = isMusicTrack
        ? meta.artist
        : (meta.uploader || meta.channel || meta.creator || meta.uploader_id || '');
    const album = isMusicTrack ? (meta.album || '') : '';
    const rawDate  = meta.upload_date;
    const date     = isMusicTrack
        ? (meta.release_year ? String(meta.release_year) : '')
        : (rawDate ? `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}` : '');
    const dur = meta.duration ? formatDuration(meta.duration) : '';
    const metaParts = [];
    if (uploader) metaParts.push(`<span class="meta-item">${SVG_USER}<span>${escapeHtml(uploader)}</span></span>`);
    if (album)    metaParts.push(`<span class="meta-item">${SVG_ALBUM}<span>${escapeHtml(album)}</span></span>`);
    if (date)     metaParts.push(`<span class="meta-item">${SVG_DATE}<span>${escapeHtml(date)}</span></span>`);
    if (dur)      metaParts.push(`<span class="meta-item">${SVG_CLOCK}<span>${escapeHtml(dur)}</span></span>`);
    metaEl.innerHTML = metaParts.join('<span class="meta-sep">·</span>');

    // Per-card save path (inherits default if set)
    let cardSavePath = defaultSavePath;
    if (defaultSavePath) {
        const parts = defaultSavePath.split(/[\\/]/).filter(Boolean);
        locationLbl.textContent = parts.length > 2
            ? `.../${parts.slice(-2).join('/')}`
            : defaultSavePath;
    }

    locationBtn.addEventListener('click', async () => {
        const selected = await window.api.selectFolder();
        if (selected) {
            cardSavePath = selected;
            const parts = selected.split(/[\\/]/).filter(Boolean);
            locationLbl.textContent = parts.length > 2
                ? `.../${parts.slice(-2).join('/')}`
                : selected;
        }
    });

    // Dismiss — cancel if downloading, delete partial file if error
    dismissBtn.addEventListener('click', () => {
        const state = card.dataset.state;
        if (state === 'downloading') {
            const id = card.dataset.activeId;
            if (id) { window.api.cancelDownload(id); activeUI.delete(id); }
        } else if (state === 'error' && card.dataset.outPath) {
            window.api.deleteFile(card.dataset.outPath);
        }
        card.closest('li').remove();
        if (!cardsList.querySelector('li')) emptyState.style.display = '';
    });

    // Start download
    startBtn.addEventListener('click', async () => {
        const fmt = qualitySel.value;

        let outName = titleInput.value.trim() || meta.title || 'download';
        outName = outName
            .replace(/[\\/:"*?<>|]+/g, '')
            .replace(/[. ]+$/, '')
            .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, '_$1') || 'download';
        outName += fmt === 'audio' ? '.mp3' : '.mp4';

        card.dataset.state        = 'downloading';
        startBtn.textContent      = 'Start';
        startBtn.style.display    = 'none';
        cancelBtn.style.display   = '';
        locationBtn.style.display = 'none';
        qualitySel.disabled       = true;
        titleInput.readOnly       = true;
        etaEl.textContent         = 'Starting…';
        statusEl.textContent      = '';

        const res = await window.api.startDownload({
            url,
            formatTag: fmt,
            outputFilename: outName,
            savePath: cardSavePath,
            isMusic: isMusicTrack
        });

        if (res.success) {
            card.dataset.activeId = res.id;
            activeUI.set(res.id, { bar, etaEl, pct, startBtn, cancelBtn, locationBtn, card, statusEl, completionDiv, completionText, qualitySel, titleInput });
            cancelBtn.onclick = () => window.api.cancelDownload(res.id);
        } else if (res.error === 'already-downloading') {
            revertToIdle(card, startBtn, cancelBtn, locationBtn, qualitySel, titleInput, etaEl,
                'Already downloading this URL.');
        } else {
            card.dataset.state  = 'error';
            etaEl.textContent   = 'Failed to start download.';
        }
    });

    cardsList.prepend(clone);
    emptyState.style.display = 'none';
    return card;
}

function revertToIdle(card, startBtn, cancelBtn, locationBtn, qualitySel, titleInput, etaEl, msg) {
    card.dataset.state        = 'pending';
    startBtn.style.display    = '';
    cancelBtn.style.display   = 'none';
    locationBtn.style.display = '';
    qualitySel.disabled       = false;
    titleInput.readOnly       = false;
    etaEl.textContent         = msg || '';
}

// ── Progress updates ──────────────────────────────────────────
window.api.onYtOutput(({ id, text }) => {
    const u = activeUI.get(id);
    if (!u) return;

    if (text.includes('[Merger]') || text.includes('[ffmpeg]')) {
        u.bar.className     = 'dl-progress item-progress finalizing';
        u.etaEl.textContent = 'Merging streams…';
        return;
    }

    const m = text.match(
        /\[download\]\s+([0-9]{1,3}\.?[0-9]*)%(?:\s+of\s+([\S]+))?\s+at\s+([\S]+)\s+ETA\s+([\S]+)/i
    );
    if (m) {
        const p = parseFloat(m[1]);
        u.bar.value = p;
        u.pct.textContent = `${p.toFixed(0)}%`;
        if (m[2] && !u.fileSize) u.fileSize = m[2];
        const parts = [];
        if (u.fileSize) parts.push(u.fileSize);
        parts.push(m[3], `ETA ${m[4]}`);
        u.etaEl.textContent = parts.join(' · ');
        return;
    }

    const ms = text.match(/\[download\]\s+([0-9]{1,3}\.?[0-9]*)%/i);
    if (ms) {
        const p = parseFloat(ms[1]);
        u.bar.value = p;
        u.pct.textContent = `${p.toFixed(0)}%`;
    }
});

window.api.onDownloadFinished(({ id, success, exitCode, outPath }) => {
    const u = activeUI.get(id);
    if (!u) return;

    u.etaEl.textContent        = '';
    u.cancelBtn.style.display  = 'none';

    if (success) {
        u.bar.value          = 100;
        u.bar.className      = 'dl-progress item-progress done';
        u.pct.textContent    = '100%';
        u.card.dataset.state = 'done';

        u.completionText.textContent = u.fileSize ? `Completed · ${u.fileSize}` : 'Completed';
        const openBtn = document.createElement('button');
        openBtn.className = 'show-folder-btn';
        openBtn.innerHTML = `${SVG_FOLDER} Show in folder`;
        openBtn.onclick   = () => window.api.openFolder(outPath);
        u.completionDiv.appendChild(openBtn);

        const playBtn = document.createElement('button');
        playBtn.className = 'show-folder-btn';
        playBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.43A15.86,15.86,0,0,0,64,39.87V216.13A15.94,15.94,0,0,0,80,232a16.07,16.07,0,0,0,8.36-2.35L232.4,141.51a15.81,15.81,0,0,0,0-27ZM80,215.94V40l143.83,88Z"/></svg> Play`;
        playBtn.onclick   = () => window.api.openFile(outPath);
        u.completionDiv.appendChild(playBtn);
        u.completionDiv.style.display = '';
    } else {
        u.bar.className          = 'dl-progress item-progress failed';
        u.card.dataset.state     = 'error';
        u.card.dataset.outPath   = outPath;
        delete u.card.dataset.activeId;
        u.etaEl.textContent      = exitCode === null ? 'Cancelled' : `Failed (exit ${exitCode})`;
        u.startBtn.textContent   = exitCode === null ? 'Resume' : 'Retry';
        u.startBtn.style.display    = '';
        u.locationBtn.style.display = '';
        u.qualitySel.disabled       = false;
        u.titleInput.readOnly       = false;
    }

    activeUI.delete(id);
});

// ── Helpers ───────────────────────────────────────────────────
function formatDuration(secs) {
    const s  = Math.floor(secs);
    const h  = Math.floor(s / 3600);
    const m  = Math.floor((s % 3600) / 60);
    const ss = String(s % 60).padStart(2, '0');
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${ss}`
        : `${m}:${ss}`;
}
