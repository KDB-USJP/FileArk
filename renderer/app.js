/**
 * File Ark - App Logic
 */

const SETTINGS_KEY = 'fileark_settings';

const CATEGORIES = {
    images: {
        name: 'Images',
        extensions: ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'tif', 'webp', 'heic', 'heif', 'raw', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf'],
        defaultMinSize: 50 * 1024,
        checked: true
    },
    vector: {
        name: 'Vector',
        extensions: ['ai', 'eps', 'svg', 'pdf'],
        defaultMinSize: 1024,
        checked: true
    },
    design: {
        name: 'Design',
        extensions: ['psd', 'psb', 'indd', 'indt', 'xd', 'fig', 'sketch', 'afdesign', 'afphoto'],
        defaultMinSize: 10 * 1024,
        checked: true
    },
    threeD: {
        name: '3D',
        extensions: ['blend', 'c4d', 'ma', 'mb', '3ds', 'skp', 'obj', 'fbx', 'dae', 'stl', 'gltf', 'glb'],
        defaultMinSize: 100 * 1024,
        checked: true
    },
    video: {
        name: 'Video',
        extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'prproj', 'aep', 'drp'],
        defaultMinSize: 1024 * 1024,
        checked: false
    },
    audio: {
        name: 'Audio',
        extensions: ['mp3', 'wav', 'aiff', 'flac', 'ogg', 'm4a', 'aac'],
        defaultMinSize: 50 * 1024,
        checked: false
    },
    documents: {
        name: 'Documents',
        extensions: ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'rtf'],
        defaultMinSize: 1024,
        checked: false
    }
};

const SIZE_OPTIONS = [
    { label: '0 KB', value: 0 },
    { label: '1 KB', value: 1024 },
    { label: '10 KB', value: 10 * 1024 },
    { label: '50 KB', value: 50 * 1024 },
    { label: '100 KB', value: 100 * 1024 },
    { label: '500 KB', value: 500 * 1024 },
    { label: '1 MB', value: 1024 * 1024 },
    { label: '5 MB', value: 5 * 1024 * 1024 }
];

const ANIMALS = ['🐘', '🦁', '🐻', '🦊', '🐺', '🦌', '🐰', '🦢', '🐦', '🦋', '🐢', '🦔'];

// DOM Elements
const elements = {
    sourcePath: document.getElementById('sourcePath'),
    destPath: document.getElementById('destPath'),
    btnSelectSource: document.getElementById('btnSelectSource'),
    btnSelectDest: document.getElementById('btnSelectDest'),
    categoryGrid: document.getElementById('categoryGrid'),
    customExt: document.getElementById('customExt'),
    btnStart: document.getElementById('btnStart'),
    btnCancel: document.getElementById('btnCancel'),
    progressAnimals: document.getElementById('progressAnimals'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    version: document.getElementById('version'),
    // Settings
    btnSettings: document.getElementById('btnSettings'),
    settingsModal: document.getElementById('settingsModal'),
    btnCloseSettings: document.getElementById('btnCloseSettings'),
    subfolderByExt: document.getElementById('subfolderByExt'),
    embedOriginalPath: document.getElementById('embedOriginalPath'),
    excludeTempCache: document.getElementById('excludeTempCache'),
    excludeSystem: document.getElementById('excludeSystem'),
    customExcludeFolders: document.getElementById('customExcludeFolders'),
    btnResetSettings: document.getElementById('btnResetSettings'),
    btnSaveSettings: document.getElementById('btnSaveSettings')
};

// State
let sourcePath = '';
let destPath = '';
let categorySettings = {};
let extensionSettings = {};
let isRunning = false;
let settings = {
    subfolderByExt: false,
    embedOriginalPath: false,
    excludeTempCache: true,
    excludeSystem: true,
    customExcludeFolders: ''
};

// Initialize
async function init() {
    const version = await window.ark.getVersion();
    elements.version.textContent = `v${version}`;

    loadSettings();
    buildCategoryGrid();

    elements.btnSelectSource.addEventListener('click', selectSource);
    elements.btnSelectDest.addEventListener('click', selectDest);
    elements.btnStart.addEventListener('click', startHarvest);
    elements.btnCancel.addEventListener('click', cancelHarvest);

    elements.btnSettings.addEventListener('click', openSettings);
    elements.btnCloseSettings.addEventListener('click', closeSettings);
    elements.btnSaveSettings.addEventListener('click', saveSettings);
    elements.btnResetSettings.addEventListener('click', resetSettings);
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) closeSettings();
    });

    window.ark.onCopyProgress((data) => {
        updateProgress(data.current, data.total, data.filename);
    });

    updateStartButton();
}

// Settings functions
function loadSettings() {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        if (saved) {
            settings = { ...settings, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Failed to load settings', e);
    }
}

function openSettings() {
    elements.subfolderByExt.checked = settings.subfolderByExt;
    elements.embedOriginalPath.checked = settings.embedOriginalPath;
    elements.excludeTempCache.checked = settings.excludeTempCache;
    elements.excludeSystem.checked = settings.excludeSystem;
    elements.customExcludeFolders.value = settings.customExcludeFolders;
    elements.settingsModal.classList.remove('hidden');
}

function closeSettings() {
    elements.settingsModal.classList.add('hidden');
}

function saveSettings() {
    settings.subfolderByExt = elements.subfolderByExt.checked;
    settings.embedOriginalPath = elements.embedOriginalPath.checked;
    settings.excludeTempCache = elements.excludeTempCache.checked;
    settings.excludeSystem = elements.excludeSystem.checked;
    settings.customExcludeFolders = elements.customExcludeFolders.value;

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    closeSettings();
}

function resetSettings() {
    settings = {
        subfolderByExt: false,
        embedOriginalPath: false,
        excludeTempCache: true,
        excludeSystem: true,
        customExcludeFolders: ''
    };
    elements.subfolderByExt.checked = false;
    elements.embedOriginalPath.checked = false;
    elements.excludeTempCache.checked = true;
    elements.excludeSystem.checked = true;
    elements.customExcludeFolders.value = '';
}

function getExcludeDirs() {
    const excludes = [];

    if (settings.excludeTempCache) {
        excludes.push('Temp', 'tmp', 'Cache', 'Caches', '.cache');
    }

    if (settings.excludeSystem) {
        excludes.push('Windows', 'Program Files', 'Program Files (x86)',
            'AppData', '$RECYCLE.BIN', 'System Volume Information',
            'node_modules', '.git', '.Trash', 'Library');
    }

    if (settings.customExcludeFolders) {
        const custom = settings.customExcludeFolders.split(',')
            .map(f => f.trim())
            .filter(f => f);
        excludes.push(...custom);
    }

    return excludes;
}

function buildCategoryGrid() {
    let html = '';

    for (const [key, cat] of Object.entries(CATEGORIES)) {
        const extCount = cat.extensions.length;

        const sizeOptions = SIZE_OPTIONS.map(opt => {
            const selected = opt.value === cat.defaultMinSize ? 'selected' : '';
            return `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
        }).join('');

        let extHtml = '';
        for (const ext of cat.extensions) {
            extHtml += `
                <label class="ext-checkbox">
                    <input type="checkbox" data-category="${key}" data-ext="${ext}" checked>
                    <span>.${ext}</span>
                </label>
            `;
            if (!extensionSettings[key]) extensionSettings[key] = {};
            extensionSettings[key][ext] = true;
        }

        html += `
            <div class="category-accordion" data-category="${key}">
                <div class="category-header">
                    <label class="category-toggle">
                        <input type="checkbox" id="cat_${key}" ${cat.checked ? 'checked' : ''}>
                        <span class="category-name">${cat.name}</span>
                        <span class="category-count">(${extCount} types)</span>
                    </label>
                    <select id="size_${key}" class="size-select">${sizeOptions}</select>
                    <button class="btn-expand" data-category="${key}" title="Expand">▶</button>
                </div>
                <div class="category-extensions hidden" id="exts_${key}">
                    ${extHtml}
                </div>
            </div>
        `;

        categorySettings[key] = {
            checked: cat.checked,
            minSize: cat.defaultMinSize
        };
    }

    elements.categoryGrid.innerHTML = html;

    for (const key of Object.keys(CATEGORIES)) {
        document.getElementById(`cat_${key}`).addEventListener('change', (e) => {
            categorySettings[key].checked = e.target.checked;
            const extCheckboxes = document.querySelectorAll(`input[data-category="${key}"]`);
            extCheckboxes.forEach(cb => {
                cb.checked = e.target.checked;
                extensionSettings[key][cb.dataset.ext] = e.target.checked;
            });
        });

        document.getElementById(`size_${key}`).addEventListener('change', (e) => {
            categorySettings[key].minSize = parseInt(e.target.value, 10);
        });

        document.querySelector(`.btn-expand[data-category="${key}"]`).addEventListener('click', (e) => {
            const btn = e.target;
            const extsDiv = document.getElementById(`exts_${key}`);
            const isHidden = extsDiv.classList.contains('hidden');

            extsDiv.classList.toggle('hidden');
            btn.textContent = isHidden ? '▼' : '▶';
        });
    }

    document.querySelectorAll('.ext-checkbox input').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const cat = e.target.dataset.category;
            const ext = e.target.dataset.ext;
            extensionSettings[cat][ext] = e.target.checked;
        });
    });
}

async function selectSource() {
    const path = await window.ark.selectFolder('Select folder to scan');
    if (path) {
        sourcePath = path;
        elements.sourcePath.value = path;
        updateStartButton();
    }
}

async function selectDest() {
    const path = await window.ark.selectFolder('Select destination folder');
    if (path) {
        destPath = path;
        elements.destPath.value = path;
        updateStartButton();
    }
}

function updateStartButton() {
    elements.btnStart.disabled = !sourcePath || !destPath || isRunning;
}

async function cancelHarvest() {
    await window.ark.cancelCopy();
    elements.btnCancel.textContent = '⏳ Stopping...';
    elements.btnCancel.disabled = true;
}

async function startHarvest() {
    isRunning = true;
    elements.btnStart.classList.add('hidden');
    elements.btnCancel.classList.remove('hidden');
    elements.btnCancel.disabled = false;
    elements.btnCancel.textContent = '✕ Abandon Ship!';

    const extensions = [];
    const minSizes = {};
    const extToCategory = {};

    for (const [key, cat] of Object.entries(CATEGORIES)) {
        if (categorySettings[key].checked) {
            for (const ext of cat.extensions) {
                if (extensionSettings[key]?.[ext]) {
                    extensions.push(ext);
                    minSizes[ext] = categorySettings[key].minSize;
                    extToCategory[ext] = cat.name;
                }
            }
        }
    }

    const customInput = elements.customExt.value;
    if (customInput) {
        const customExts = customInput.split(',').map(e => e.trim().replace(/^\./, '').toLowerCase()).filter(e => e);
        for (const ext of customExts) {
            extensions.push(ext);
            minSizes[ext] = 0;
            extToCategory[ext] = 'Custom';
        }
    }

    if (extensions.length === 0) {
        alert('Please select at least one file type.');
        resetButtons();
        return;
    }

    try {
        updateProgress(0, 0, 'Scanning files...');
        const files = await window.ark.scanDirectory(sourcePath, {
            extensions,
            minSizes,
            extToCategory,
            excludeDirs: getExcludeDirs()
        });

        if (files.length === 0) {
            updateProgress(0, 0, 'No matching files found');
            resetButtons();
            return;
        }

        updateProgress(0, files.length, `Found ${files.length} files, copying...`);

        const result = await window.ark.copyFiles(files, destPath, {
            subfolderByExt: settings.subfolderByExt,
            embedOriginalPath: settings.embedOriginalPath
        });

        if (result.cancelled) {
            updateProgress(result.copied, files.length, `Cancelled. ${result.copied} files copied.`);
        } else {
            updateProgress(files.length, files.length, `Done! ${result.copied} files copied`);
        }

    } catch (e) {
        console.error(e);
        updateProgress(0, 0, 'Error: ' + e.message);
    } finally {
        resetButtons();
    }
}

function resetButtons() {
    isRunning = false;
    elements.btnStart.classList.remove('hidden');
    elements.btnCancel.classList.add('hidden');
    updateStartButton();
}

function updateProgress(current, total, message) {
    const percent = total > 0 ? (current / total) * 100 : 0;
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = total > 0 ? `${current.toLocaleString()} / ${total.toLocaleString()} - ${message}` : message;

    const animalCount = Math.floor(percent / (100 / ANIMALS.length));
    let animalsHtml = '';
    for (let i = 0; i < animalCount && i < ANIMALS.length; i++) {
        animalsHtml += `<span class="animal-pair">${ANIMALS[i]}${ANIMALS[i]}</span> `;
    }
    elements.progressAnimals.innerHTML = animalsHtml;
}

init();
