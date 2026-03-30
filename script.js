// State Management
const state = {
    tasks: [
        { id: '1', title: 'Research WebMCP', description: 'Read documentation and understand core concepts.', priority: 'high', column: 'todo' },
        { id: '2', title: 'Design UI Mockups', description: 'Create Figma designs for the Kanban board.', priority: 'medium', column: 'in-progress' },
        { id: '3', title: 'Setup GitHub Repo', description: 'Initialize repository and add collaborators.', priority: 'low', column: 'done' }
    ],
    columns: ['todo', 'in-progress', 'done']
};

// DOM Elements
const columns = {
    todo: document.getElementById('todo-list'),
    'in-progress': document.getElementById('in-progress-list'),
    done: document.getElementById('done-list')
};

const counts = {
    todo: document.getElementById('todo-count'),
    'in-progress': document.getElementById('in-progress-count'),
    done: document.getElementById('done-count')
};

const modal = document.getElementById('task-modal');
const form = document.getElementById('task-form');
const addBtn = document.getElementById('add-task-btn');
const closeBtn = document.querySelector('.close');

// Render Logic
function renderBoard() {
    // Clear all columns
    Object.values(columns).forEach(col => col.innerHTML = '');

    // Sort tasks by priority? Or just render
    state.tasks.forEach(task => {
        const taskEl = createTaskElement(task);
        if (columns[task.column]) {
            columns[task.column].appendChild(taskEl);
        }
    });

    // Update counts
    state.columns.forEach(col => {
        const count = state.tasks.filter(t => t.column === col).length;
        if (counts[col]) counts[col].textContent = count;
    });
}

function createTaskElement(task) {
    const el = document.createElement('div');
    el.className = 'task-card';
    el.draggable = true;
    el.id = task.id;
    el.dataset.priority = task.priority;

    el.innerHTML = `
        <div class="task-header">
            <div class="task-title">${escapeHtml(task.title)}</div>
            <div class="task-options" onclick="deleteTask('${task.id}')">
                <i class="fas fa-trash-alt"></i>
            </div>
        </div>
        <div class="task-desc">${escapeHtml(task.description)}</div>
        <div class="task-footer">
            <span class="priority-badge priority-${task.priority}">${capitalize(task.priority)}</span>
        </div>
    `;

    // Drag Events
    el.addEventListener('dragstart', dragStart);
    el.addEventListener('dragend', dragEnd);

    return el;
}

// Drag & Drop Logic
let draggedItem = null;

function dragStart(e) {
    draggedItem = this;
    setTimeout(() => this.classList.add('dragging'), 0);
    // DataTransfer
    e.dataTransfer.setData('text/plain', this.id);
    e.dataTransfer.effectAllowed = 'move';
}

function dragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
    // Remove drag-over class from all columns
    document.querySelectorAll('.column').forEach(col => col.classList.remove('drag-over'));
}

function allowDrop(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const columnEl = e.target.closest('.column');
    if (!columnEl) return;

    const columnId = columnEl.id; // 'todo', 'in-progress', 'done'
    const taskId = e.dataTransfer.getData('text/plain');

    moveTask(taskId, columnId);
    columnEl.classList.remove('drag-over');
}

// Column Highlight on Drag Over
document.querySelectorAll('.column').forEach(col => {
    col.addEventListener('dragover', () => col.classList.add('drag-over'));
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
});

// Task Management Functions
function addTask(title, description, priority) {
    const newTask = {
        id: Date.now().toString(),
        title,
        description,
        priority,
        column: 'todo'
    };
    state.tasks.push(newTask);
    renderBoard();
}

function moveTask(taskId, targetColumn) {
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1 && state.columns.includes(targetColumn)) {
        state.tasks[taskIndex].column = targetColumn;
        renderBoard();
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        renderBoard();
    }
}

// Modal Logic
addBtn.onclick = () => modal.classList.add('show');
closeBtn.onclick = () => modal.classList.remove('show');
window.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('show');
};

form.onsubmit = (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const desc = document.getElementById('task-desc').value;
    const priority = document.getElementById('task-priority').value;

    addTask(title, desc, priority);

    form.reset();
    modal.classList.remove('show');
};

// Utilities
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

// Initialization
document.addEventListener('DOMContentLoaded', renderBoard);

// --- WebMCP Integration (native Chrome support) ---

if ('modelContext' in navigator) {
    // console.log("WebMCP supported, registering tools... v3");

    // Tool: create_task
    navigator.modelContext.registerTool({
        name: 'create_task',
        description: 'Create a new task on the Kanban board',
        inputSchema: {
            type: 'object',
            properties: {
                title: { type: 'string', description: 'Title of the task' },
                description: { type: 'string', description: 'Detailed description of the task' },
                priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level of the task' }
            },
            required: ['title', 'description']
        },
        execute: async ({ title, description, priority = 'medium' }) => {
            addTask(title, description, priority);
            return {
                content: [{ type: 'text', text: `Task "${title}" created successfully.` }]
            };
        }
    });

    // Tool: move_task
    navigator.modelContext.registerTool({
        name: 'move_task',
        description: 'Move a task to a different column',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'ID of the task to move' },
                column: { type: 'string', enum: ['todo', 'in-progress', 'done'], description: 'Target column ID' }
            },
            required: ['id', 'column']
        },
        execute: async ({ id, column }) => {
            const task = state.tasks.find(t => t.id === id);
            if (!task) {
                throw new Error(`Task with ID ${id} not found.`);
            }
            moveTask(id, column);
            return {
                content: [{ type: 'text', text: `Task "${task.title}" moved to ${column}.` }]
            };
        }
    });

    // Tool: delete_task
    navigator.modelContext.registerTool({
        name: 'delete_task',
        description: 'Delete a task from the board',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string', description: 'ID of the task to delete' }
            },
            required: ['id']
        },
        execute: async ({ id }) => {
            const task = state.tasks.find(t => t.id === id);
            if (!task) {
                throw new Error(`Task with ID ${id} not found.`);
            }
            // Direct manipulation to bypass confirm dialog
            state.tasks = state.tasks.filter(t => t.id !== id);
            renderBoard();
            return {
                content: [{ type: 'text', text: `Task "${task.title}" deleted.` }]
            };
        }
    });

    // Tool: get_board_state
    navigator.modelContext.registerTool({
        name: 'get_board_state',
        description: 'Get the current state of all tasks and columns',
        inputSchema: {
            type: 'object',
            properties: {},
        },
        execute: async () => {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        columns: state.columns,
                        tasks: state.tasks
                    }, null, 2)
                }]
            };
        }
    });

} else {
    console.error("❌ navigator.modelContext not available - Polyfill failed to load?");
}



