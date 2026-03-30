// ================================================
//  FLOOR PLAN EDITOR — Canvas Engine + WebMCP
// ================================================

// --- Furniture Catalog ---
const CATALOG = [
    { type: 'sofa',        label: 'Sofa',        icon: '\uf4b8', w: 180, h: 70,  color: '#f59e0b' },
    { type: 'bed',         label: 'Bed',         icon: '\uf236', w: 140, h: 180, color: '#a78bfa' },
    { type: 'table',       label: 'Table',       icon: '\uf0ce', w: 120, h: 80,  color: '#2dd4bf' },
    { type: 'chair',       label: 'Chair',       icon: '\uf007', w: 50,  h: 50,  color: '#fb923c' },
    { type: 'desk',        label: 'Desk',        icon: '\uf109', w: 140, h: 60,  color: '#38bdf8' },
    { type: 'wardrobe',    label: 'Wardrobe',    icon: '\uf51c', w: 120, h: 50,  color: '#c084fc' },
    { type: 'bookshelf',   label: 'Bookshelf',   icon: '\uf518', w: 100, h: 35,  color: '#f472b6' },
    { type: 'plant',       label: 'Plant',       icon: '\uf4d8', w: 40,  h: 40,  color: '#4ade80' },
    { type: 'tv',          label: 'TV Stand',    icon: '\uf26c', w: 130, h: 35,  color: '#60a5fa' },
    { type: 'rug',         label: 'Rug',         icon: '\uf2d2', w: 160, h: 120, color: '#fbbf24', fill: true },
];

// --- State ---
const state = {
    items: [],
    nextId: 1,
    selectedId: null,
    showGrid: true,
    showLabels: true,
};

// Room dimensions in "virtual" pixels (canvas coordinates)
const ROOM = { w: 800, h: 600 };
const GRID_SIZE = 20; // snap grid
const WALL = 4; // wall inset so items don't overlap wall stroke

// --- Canvas Setup ---
const canvas = document.getElementById('floor-canvas');
const ctx = canvas.getContext('2d');
canvas.width = ROOM.w;
canvas.height = ROOM.h;

// --- DOM refs ---
const coordDisplay = document.getElementById('coord-display');
const objCountEl = document.getElementById('obj-count');
const propsPanel = document.getElementById('properties-panel');
const paletteContainer = document.getElementById('palette-items');

// ================================================
//  RENDERING
// ================================================

function render() {
    ctx.clearRect(0, 0, ROOM.w, ROOM.h);

    // Background
    ctx.fillStyle = '#0c1220';
    ctx.fillRect(0, 0, ROOM.w, ROOM.h);

    // Grid
    if (state.showGrid) drawGrid();

    // Room walls
    drawWalls();

    // Furniture items (rugs first, then the rest)
    const rugs = state.items.filter(i => i.fill);
    const others = state.items.filter(i => !i.fill);
    rugs.forEach(drawItem);
    others.forEach(drawItem);

    // Update count
    objCountEl.textContent = state.items.length;
}

function drawGrid() {
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.06)';
    ctx.lineWidth = 0.5;

    for (let x = GRID_SIZE; x < ROOM.w; x += GRID_SIZE) {
        const isMajor = x % (GRID_SIZE * 5) === 0;
        ctx.strokeStyle = isMajor
            ? 'rgba(45, 212, 191, 0.12)'
            : 'rgba(45, 212, 191, 0.06)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ROOM.h);
        ctx.stroke();
    }
    for (let y = GRID_SIZE; y < ROOM.h; y += GRID_SIZE) {
        const isMajor = y % (GRID_SIZE * 5) === 0;
        ctx.strokeStyle = isMajor
            ? 'rgba(45, 212, 191, 0.12)'
            : 'rgba(45, 212, 191, 0.06)';
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(ROOM.w, y);
        ctx.stroke();
    }
}

function drawWalls() {
    ctx.strokeStyle = '#2dd4bf';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = 'rgba(45, 212, 191, 0.3)';
    ctx.shadowBlur = 6;
    ctx.strokeRect(1, 1, ROOM.w - 2, ROOM.h - 2);
    ctx.shadowBlur = 0;

    // Door indication (bottom-left gap)
    ctx.fillStyle = '#0c1220';
    ctx.fillRect(60, ROOM.h - 3, 80, 5);
    // Door arc
    ctx.strokeStyle = 'rgba(45, 212, 191, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(60, ROOM.h - 1, 80, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Window indication (top wall)
    ctx.fillStyle = '#0c1220';
    ctx.fillRect(300, -1, 200, 4);
    ctx.strokeStyle = 'rgba(94, 234, 212, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(300, 1); ctx.lineTo(500, 1);
    ctx.stroke();
    // Window ticks
    ctx.beginPath();
    ctx.moveTo(300, 0); ctx.lineTo(300, 8);
    ctx.moveTo(500, 0); ctx.lineTo(500, 8);
    ctx.moveTo(400, 0); ctx.lineTo(400, 6);
    ctx.stroke();

    // Dimension labels
    ctx.fillStyle = 'rgba(45, 212, 191, 0.35)';
    ctx.font = '10px "DM Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('8.00 m', ROOM.w / 2, ROOM.h + 16 > ROOM.h ? ROOM.h - 8 : ROOM.h + 16);
    ctx.save();
    ctx.translate(ROOM.w - 8, ROOM.h / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('6.00 m', 0, 0);
    ctx.restore();
}

function drawItem(item) {
    const isSelected = item.id === state.selectedId;
    const x = item.x;
    const y = item.y;
    const w = item.w;
    const h = item.h;

    if (item.fill) {
        // Rug — filled rectangle with pattern
        ctx.fillStyle = hexToRgba(item.color, 0.12);
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = hexToRgba(item.color, 0.3);
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 3]);
        ctx.strokeRect(x, y, w, h);
        ctx.setLineDash([]);
    } else {
        // Standard furniture
        ctx.fillStyle = hexToRgba(item.color, 0.15);
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = hexToRgba(item.color, 0.7);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, w, h);

        // Direction indicator — colored edge shows "front" based on rotation
        ctx.fillStyle = hexToRgba(item.color, 0.5);
        const dir = ((item.rotation || 0) % 360 + 360) % 360;
        if (dir === 0)        ctx.fillRect(x, y, w, 3);           // top
        else if (dir === 90)  ctx.fillRect(x + w - 3, y, 3, h);   // right
        else if (dir === 180) ctx.fillRect(x, y + h - 3, w, 3);   // bottom
        else if (dir === 270) ctx.fillRect(x, y, 3, h);           // left
        else                  ctx.fillRect(x, y, w, 3);           // fallback top
    }

    // Label
    if (state.showLabels) {
        ctx.fillStyle = hexToRgba(item.color, 0.8);
        ctx.font = '10px "DM Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label, x + w / 2, y + h / 2);
    }

    // Selection ring
    if (isSelected) {
        ctx.strokeStyle = '#fb7185';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 3]);
        ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
        ctx.setLineDash([]);

        // Resize handle hint
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(x + w - 2, y + h - 2, 6, 6);
    }
}

// ================================================
//  HIT TESTING
// ================================================

function hitTest(mx, my) {
    // Reverse order so top-most item is checked first
    for (let i = state.items.length - 1; i >= 0; i--) {
        const item = state.items[i];
        if (isPointInItem(mx, my, item)) return item;
    }
    return null;
}

function isPointInItem(px, py, item) {
    return px >= item.x && px <= item.x + item.w &&
           py >= item.y && py <= item.y + item.h;
}

// ================================================
//  INTERACTION — Canvas Mouse
// ================================================

let isDragging = false;
let dragItem = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hit = hitTest(mx, my);
    if (hit) {
        selectItem(hit.id);
        isDragging = true;
        dragItem = hit;
        dragOffsetX = mx - hit.x;
        dragOffsetY = my - hit.y;
        canvas.style.cursor = 'grabbing';
    } else {
        selectItem(null);
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Coordinate display
    const meterX = (mx / ROOM.w * 8).toFixed(1);
    const meterY = (my / ROOM.h * 6).toFixed(1);
    coordDisplay.textContent = `x: ${meterX}m, y: ${meterY}m`;

    if (isDragging && dragItem) {
        let nx = mx - dragOffsetX;
        let ny = my - dragOffsetY;
        // Snap to grid
        nx = Math.round(nx / GRID_SIZE) * GRID_SIZE;
        ny = Math.round(ny / GRID_SIZE) * GRID_SIZE;
        // Clamp inside room
        nx = Math.max(WALL, Math.min(ROOM.w - WALL - dragItem.w, nx));
        ny = Math.max(WALL, Math.min(ROOM.h - WALL - dragItem.h, ny));
        dragItem.x = nx;
        dragItem.y = ny;
        render();
        updatePropertiesPanel();
    } else {
        const hit = hitTest(mx, my);
        canvas.style.cursor = hit ? 'grab' : 'crosshair';
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
    dragItem = null;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    dragItem = null;
});

// Double-click to rotate
canvas.addEventListener('dblclick', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const hit = hitTest(mx, my);
    if (hit) {
        rotateFurniture(hit.id, 90);
    }
});

// ================================================
//  INTERACTION — Palette Drag-to-Canvas
// ================================================

let paletteDragType = null;
let ghostEl = null;

function buildPalette() {
    paletteContainer.innerHTML = '';
    CATALOG.forEach(cat => {
        const el = document.createElement('div');
        el.className = 'palette-item';
        el.dataset.type = cat.type;
        el.innerHTML = `
            <div class="item-icon"><i class="fas" style="color: ${cat.color}">&#x${cat.icon.codePointAt(0).toString(16)};</i></div>
            <div class="item-name">${cat.label}</div>
        `;

        el.addEventListener('mousedown', (e) => {
            paletteDragType = cat.type;
            // Create ghost
            ghostEl = document.createElement('div');
            ghostEl.className = 'drag-ghost';
            ghostEl.textContent = cat.label;
            document.body.appendChild(ghostEl);
            moveGhost(e);

            const onMove = (ev) => moveGhost(ev);
            const onUp = (ev) => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                if (ghostEl) { ghostEl.remove(); ghostEl = null; }

                // Check if dropped on canvas
                const cRect = canvas.getBoundingClientRect();
                const cx = ev.clientX - cRect.left;
                const cy = ev.clientY - cRect.top;
                if (cx >= 0 && cy >= 0 && cx <= ROOM.w && cy <= ROOM.h) {
                    const snappedX = Math.round(cx / GRID_SIZE) * GRID_SIZE;
                    const snappedY = Math.round(cy / GRID_SIZE) * GRID_SIZE;
                    addFurniture(paletteDragType, snappedX - cat.w / 2, snappedY - cat.h / 2);
                }
                paletteDragType = null;
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });

        paletteContainer.appendChild(el);
    });
}

function moveGhost(e) {
    if (ghostEl) {
        ghostEl.style.left = e.clientX + 'px';
        ghostEl.style.top = e.clientY + 'px';
    }
}

// ================================================
//  FURNITURE CRUD
// ================================================

function addFurniture(type, x, y, rotation) {
    const cat = CATALOG.find(c => c.type === type);
    if (!cat) return null;

    // Clamp position
    x = Math.max(WALL, Math.min(ROOM.w - WALL - cat.w, Math.round((x ?? 100) / GRID_SIZE) * GRID_SIZE));
    y = Math.max(WALL, Math.min(ROOM.h - WALL - cat.h, Math.round((y ?? 100) / GRID_SIZE) * GRID_SIZE));

    const item = {
        id: String(state.nextId++),
        type: cat.type,
        label: cat.label,
        x,
        y,
        w: cat.w,
        h: cat.h,
        rotation: rotation || 0,
        color: cat.color,
        fill: cat.fill || false,
    };
    state.items.push(item);
    selectItem(item.id);
    render();
    return item;
}

function moveFurniture(id, x, y) {
    const item = state.items.find(i => i.id === id);
    if (!item) return false;
    item.x = Math.max(WALL, Math.min(ROOM.w - WALL - item.w, Math.round(x / GRID_SIZE) * GRID_SIZE));
    item.y = Math.max(WALL, Math.min(ROOM.h - WALL - item.h, Math.round(y / GRID_SIZE) * GRID_SIZE));
    render();
    if (item.id === state.selectedId) updatePropertiesPanel();
    return true;
}

function rotateFurniture(id, angle) {
    const item = state.items.find(i => i.id === id);
    if (!item) return false;
    item.rotation = ((item.rotation || 0) + angle) % 360;
    // Swap w/h for 90° increments so the shape actually rotates
    if (angle === 90 || angle === 270 || angle === -90) {
        const cx = item.x + item.w / 2;
        const cy = item.y + item.h / 2;
        const tmp = item.w;
        item.w = item.h;
        item.h = tmp;
        // Re-center so it rotates around its midpoint
        item.x = Math.round((cx - item.w / 2) / GRID_SIZE) * GRID_SIZE;
        item.y = Math.round((cy - item.h / 2) / GRID_SIZE) * GRID_SIZE;
        // Clamp inside room
        item.x = Math.max(WALL, Math.min(ROOM.w - WALL - item.w, item.x));
        item.y = Math.max(WALL, Math.min(ROOM.h - WALL - item.h, item.y));
    }
    render();
    if (item.id === state.selectedId) updatePropertiesPanel();
    return true;
}

function removeFurniture(id) {
    const idx = state.items.findIndex(i => i.id === id);
    if (idx === -1) return false;
    const removed = state.items.splice(idx, 1)[0];
    if (state.selectedId === id) selectItem(null);
    render();
    return removed;
}

function clearAll() {
    state.items = [];
    state.selectedId = null;
    state.nextId = 1;
    render();
    updatePropertiesPanel();
}

// ================================================
//  SELECTION & PROPERTIES
// ================================================

function selectItem(id) {
    state.selectedId = id;
    render();
    updatePropertiesPanel();
}

function updatePropertiesPanel() {
    const item = state.items.find(i => i.id === state.selectedId);
    if (!item) {
        propsPanel.innerHTML = '<div class="no-selection">Click an object on the canvas</div>';
        return;
    }

    const mx = (item.x / ROOM.w * 8).toFixed(1);
    const my = (item.y / ROOM.h * 6).toFixed(1);
    const mw = (item.w / ROOM.w * 8).toFixed(1);
    const mh = (item.h / ROOM.h * 6).toFixed(1);

    propsPanel.innerHTML = `
        <div class="prop-row">
            <span class="prop-label">Name</span>
            <span class="prop-value">${escapeHtml(item.label)}</span>
        </div>
        <div class="prop-row">
            <span class="prop-label">ID</span>
            <span class="prop-value">#${item.id}</span>
        </div>
        <div class="prop-row">
            <span class="prop-label">Position</span>
            <span class="prop-value">${mx}, ${my} m</span>
        </div>
        <div class="prop-row">
            <span class="prop-label">Size</span>
            <span class="prop-value">${mw} &times; ${mh} m</span>
        </div>
        <div class="prop-row">
            <span class="prop-label">Rotation</span>
            <span class="prop-value">${item.rotation || 0}&deg;</span>
        </div>
        <div class="prop-actions">
            <button class="prop-btn" onclick="rotateFurniture('${item.id}', 90)">
                <i class="fas fa-redo"></i> Rotate
            </button>
            <button class="prop-btn danger" onclick="removeFurniture('${item.id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
}

// ================================================
//  TOOLBAR BUTTONS
// ================================================

document.getElementById('grid-toggle').addEventListener('click', function () {
    state.showGrid = !state.showGrid;
    this.classList.toggle('active', state.showGrid);
    render();
});

document.getElementById('labels-toggle').addEventListener('click', function () {
    state.showLabels = !state.showLabels;
    this.classList.toggle('active', state.showLabels);
    render();
});

document.getElementById('clear-btn').addEventListener('click', () => {
    if (state.items.length === 0) return;
    if (confirm('Remove all furniture from the floor plan?')) {
        clearAll();
    }
});

// Initialize toggles as active
document.getElementById('grid-toggle').classList.add('active');
document.getElementById('labels-toggle').classList.add('active');

// ================================================
//  UTILITIES
// ================================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Convert canvas pixel coords to meters
function pxToMeters(px, py) {
    return {
        x: parseFloat((px / ROOM.w * 8).toFixed(2)),
        y: parseFloat((py / ROOM.h * 6).toFixed(2)),
    };
}

// Convert meters to canvas pixel coords
function metersToPx(mx, my) {
    return {
        x: Math.round(mx / 8 * ROOM.w),
        y: Math.round(my / 6 * ROOM.h),
    };
}

// ================================================
//  INIT
// ================================================

buildPalette();

// Place some starter furniture for demo
addFurniture('sofa', 300, 420);
addFurniture('table', 340, 280);
addFurniture('bed', 600, 60);
addFurniture('plant', 20, 20);
addFurniture('rug', 280, 250);
selectItem(null);

render();

// ================================================
//  WebMCP INTEGRATION
// ================================================

if (!('modelContext' in navigator)) {
    console.log("⚠️ WebMCP Native API not found. Initializing Polyfill...");

    window.webmcpTools = {};

    const mockModelContext = {
        registerTool: (tool) => {
            console.log(`[Polyfill] Registered tool: ${tool.name}`);
            window.webmcpTools[tool.name] = tool;
        }
    };

    try {
        Object.defineProperty(navigator, 'modelContext', {
            value: mockModelContext,
            writable: false,
            configurable: true
        });
    } catch (e) {
        console.warn("Could not patch navigator.modelContext.");
    }
}

if ('modelContext' in navigator) {

    // --- add_furniture ---
    navigator.modelContext.registerTool({
        name: 'add_furniture',
        description: 'Add a piece of furniture to the floor plan. Coordinates are in meters (room is 8m x 6m). Available types: sofa, bed, table, chair, desk, wardrobe, bookshelf, plant, tv, rug.',
        inputSchema: {
            type: 'object',
            properties: {
                type: { type: 'string', description: 'Furniture type (sofa, bed, table, chair, desk, wardrobe, bookshelf, plant, tv, rug)' },
                x: { type: 'number', description: 'X position in meters from left wall (0-8)' },
                y: { type: 'number', description: 'Y position in meters from top wall (0-6)' },
                rotation: { type: 'number', description: 'Rotation angle in degrees (0, 90, 180, 270). Optional.' },
            },
            required: ['type', 'x', 'y'],
        },
        execute: async ({ type, x, y, rotation }) => {
            const px = metersToPx(x, y);
            const item = addFurniture(type, px.x, px.y, rotation);
            if (!item) {
                throw new Error(`Unknown furniture type: "${type}". Available: ${CATALOG.map(c => c.type).join(', ')}`);
            }
            const pos = pxToMeters(item.x, item.y);
            return {
                content: [{ type: 'text', text: `Added ${item.label} (id: ${item.id}) at (${pos.x}m, ${pos.y}m).` }]
            };
        }
    });

    // --- move_furniture ---
    navigator.modelContext.registerTool({
        name: 'move_furniture',
        description: 'Move a furniture item to a new position. Coordinates in meters (room is 8m x 6m).',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'ID of the furniture item to move' },
                x: { type: 'number', description: 'New X position in meters (0-8)' },
                y: { type: 'number', description: 'New Y position in meters (0-6)' },
            },
            required: ['id', 'x', 'y'],
        },
        execute: async ({ id, x, y }) => {
            const item = state.items.find(i => i.id === id);
            if (!item) throw new Error(`Furniture with ID ${id} not found.`);
            const px = metersToPx(x, y);
            moveFurniture(id, px.x, px.y);
            const pos = pxToMeters(item.x, item.y);
            return {
                content: [{ type: 'text', text: `Moved ${item.label} (id: ${id}) to (${pos.x}m, ${pos.y}m).` }]
            };
        }
    });

    // --- rotate_furniture ---
    navigator.modelContext.registerTool({
        name: 'rotate_furniture',
        description: 'Rotate a furniture item by a given angle.',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'ID of the furniture item' },
                angle: { type: 'number', description: 'Rotation angle in degrees (positive = clockwise). Common: 90, 180, 270.' },
            },
            required: ['id', 'angle'],
        },
        execute: async ({ id, angle }) => {
            const item = state.items.find(i => i.id === id);
            if (!item) throw new Error(`Furniture with ID ${id} not found.`);
            rotateFurniture(id, angle);
            return {
                content: [{ type: 'text', text: `Rotated ${item.label} (id: ${id}) by ${angle}°. Current rotation: ${item.rotation}°.` }]
            };
        }
    });

    // --- remove_furniture ---
    navigator.modelContext.registerTool({
        name: 'remove_furniture',
        description: 'Remove a furniture item from the floor plan.',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'ID of the furniture item to remove' },
            },
            required: ['id'],
        },
        execute: async ({ id }) => {
            const removed = removeFurniture(id);
            if (!removed) throw new Error(`Furniture with ID ${id} not found.`);
            return {
                content: [{ type: 'text', text: `Removed ${removed.label} (id: ${id}) from the floor plan.` }]
            };
        }
    });

    // --- get_floor_state ---
    navigator.modelContext.registerTool({
        name: 'get_floor_state',
        description: 'Get the current state of the floor plan, including all furniture items with their positions (in meters), sizes, and rotations. Room is 8m x 6m. The canvas is purely visual — this tool is the ONLY way to know what is on the floor plan.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            const items = state.items.map(item => {
                const pos = pxToMeters(item.x, item.y);
                const size = {
                    w: parseFloat((item.w / ROOM.w * 8).toFixed(2)),
                    h: parseFloat((item.h / ROOM.h * 6).toFixed(2)),
                };
                return {
                    id: item.id,
                    type: item.type,
                    label: item.label,
                    position: pos,
                    size,
                    rotation: item.rotation || 0,
                };
            });
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        room: { width: 8, height: 6, unit: 'meters' },
                        furniture: items,
                        totalItems: items.length,
                    }, null, 2)
                }]
            };
        }
    });

    // --- clear_floor ---
    navigator.modelContext.registerTool({
        name: 'clear_floor',
        description: 'Remove ALL furniture from the floor plan.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            const count = state.items.length;
            clearAll();
            return {
                content: [{ type: 'text', text: `Cleared floor plan. Removed ${count} items.` }]
            };
        }
    });

} else {
    console.error("❌ navigator.modelContext not available.");
}
