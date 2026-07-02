document.addEventListener('contextmenu', e => {
    if (!e.target.matches('input, textarea')) e.preventDefault();
});

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
    if (e.key === 'Escape') { closeSettingsPopover(); ctxMenu.style.display = 'none'; if (_openQualityClose) _openQualityClose(); }
});

// ── Version ───────────────────────────────────────────────────
window.api.getAppVersion().then(v => {
    document.querySelectorAll('.app-version').forEach(el => {
        el.textContent = `MZ Video Downloader V${v}`;
    });
    document.title = `MZ Video Downloader V${v}`;
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

    // Title
    titleInput.value = meta.title || 'Unknown Video';

    // Meta: uploader · date · duration
    const uploader = meta.uploader || meta.channel || meta.creator || meta.uploader_id || '';
    const rawDate  = meta.upload_date;
    const date     = rawDate
        ? `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}`
        : '';
    const dur = meta.duration ? formatDuration(meta.duration) : '';
    const metaParts = [];
    if (uploader) metaParts.push(`<span class="meta-item">${SVG_USER}<span>${uploader}</span></span>`);
    if (date)     metaParts.push(`<span class="meta-item">${SVG_DATE}<span>${date}</span></span>`);
    if (dur)      metaParts.push(`<span class="meta-item">${SVG_CLOCK}<span>${dur}</span></span>`);
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
            savePath: cardSavePath
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
