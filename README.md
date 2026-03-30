# WebMCP Kanban Board Demo

This is a premium, dark-mode Kanban board application designed to demonstrate the **WebMCP (Web Model Context Protocol)** integration. It allows AI agents to programmatically control the board using standardized tools.

## Features

- **Premium UI**: Cyberpunk-inspired dark mode with glassmorphism effects.
- **Drag & Drop**: Native HTML5 drag-and-drop support for tasks.
- **WebMCP Integration**: Exposes a `navigator.modelContext` interface for AI agents.

## How to Run

1.  **Start a Local Server**:
    Because WebMCP requires a secure context (or localhost) and uses `postMessage`, you cannot simply open `index.html` as a file. You must serve it over HTTP.

    If you have Python installed:
    ```bash
    python3 -m http.server 8000
    ```

    Or using Node.js `http-server`:
    ```bash
    npx http-server .
    ```

2.  **Open in Browser**:
    Navigate to `http://localhost:8000` (or whatever port your server uses).

## WebMCP Tools

The application registers the following tools via `navigator.modelContext.registerTool`:

| Tool Name | Description | Parameters |
| :--- | :--- | :--- |
| `create_task` | Create a new task | `title` (string), `description` (string), `priority` (low/medium/high) |
| `move_task` | Move a task to a column | `id` (string), `column` (todo/in-progress/done) |
| `delete_task` | Delete a task | `id` (string) |
| `get_board_state` | Get all tasks & columns | None |

## Testing Without WebMCP Browser

If your browser does not support WebMCP yet, you can **simulate** it by pasting this code into your browser's Developer Console:

```javascript
// Mock WebMCP Environment
window.navigator.modelContext = {
    registerTool: (tool) => {
        console.log(`[WebMCP] Registered Tool: ${tool.name}`);
        // Expose tool to window for manual testing
        window[tool.name] = tool.handler;
    }
};

// Re-run the registration logic (simplest way is to reload the page after setting this, 
// but since reload clears console, you can just paste the script.js content or manually trigger it).
```
