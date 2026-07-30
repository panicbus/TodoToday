# TodoToday

A simple, beautiful desktop todo list app (in the vein of Todoist). Built with Electron and React. All data is stored locally on your machine.

## Features

- **Inbox** – Main list with draggable, re-orderable tasks
- **Up to 5 custom lists** – Rename in the sidebar (double-click list name)
- **Tasks** – Add, complete, rename (click title), remove, reorder (Inbox only)
- **Completed tasks** – Stored locally; restore any item back to its list
- **Persistence** – JSON files in this project's `data/` folder (no server)
- **Search** – Search box in the main header; searches across Inbox, all 5 lists, and completed tasks. Click a result to go to that list.
- **External change detection** – If data files change on disk, the app prompts you to reload

## Requirements

- Node.js 18+
- npm

## Setup and run

All project files live under `Documents/TodoToday`. No dependencies on any other project.

```bash
cd ~/Documents/TodoToday
npm install
```

### Development

1. Start the Vite dev server (in one terminal):

   ```bash
   npm run dev
   ```

2. In a second terminal, start Electron (it will load the dev server):

   ```bash
   ELECTRON_LOAD_VITE=1 npm run electron
   ```

   On Windows use: `set ELECTRON_LOAD_VITE=1 && npm run electron`

### Production

```bash
npm run build
npm start
```

Or in one step:

```bash
npm run app
```

### Build TodoToday.app (standalone, no terminal needed)

To create a **TodoToday.app** you can double-click and keep in your Dock or Applications:

```bash
cd ~/Documents/TodoToday
npm install
npm run dist
```

The app and a **TodoToday-1.0.0.dmg** installer are created in the `release/` folder. Open the DMG, drag TodoToday to Applications (or the Desktop), then run it like any other app. You can quit the terminal and the app keeps running.

- **Unpacked .app only** (faster build, no DMG): `npm run dist:dir` → `release/mac-arm64/TodoToday.app` (or `mac` on Intel).

Data always lives in `Documents/TodoToday/data/` on this machine — whether you run the app from source or as the packaged `.app`/DMG. The data path is hardcoded to this project folder in `main.js`, so the app is tied to this specific folder on this machine (it is not a portable/relocatable installer).

## Project layout

- `main.js` – Electron main process (window, IPC, file watcher)
- `preload.js` – Bridge for renderer (storage, dialog)
- `src/` – React app
  - `App.jsx` – Layout, list switching, persistence
  - `components/` – Sidebar, TaskArea, TaskList, TaskItem, TaskInput, CompletedSection, ExternalChangePrompt
  - `services/storage.js` – Read/write and external-change API
- `assets/images/` – Place your image assets here
- **Always:** Data is stored in the `data/` folder inside this project (`Documents/TodoToday/data/`), whether running from source or as the packaged `.app`. The `data/` folder is in `.gitignore` so your tasks are not committed.

## Future

- Tasks have unique IDs to support more search filters or tagging later.

## Tech stack

- Electron (desktop)
- React 18
- Vite (build)
- No paid or proprietary tools; all open source.
