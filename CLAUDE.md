# TodoToday

Electron + React + Vite desktop todo app. Renderer in `src/`, Electron main process in `main.js`, IPC bridge in `preload.js`.

## Storage

`main.js` hardcodes the data directory to `/Users/Crisafulli/Developer/TodoToday/data` (`PROJECT_DIR`), deliberately — a packaged build launched from `/Applications` would otherwise resolve `__dirname` inside `app.asar`. Consequences:

- **`data/` holds the user's real todo content.** It's gitignored and must never be committed.
- **Moving the repo breaks storage until `PROJECT_DIR` is updated and the app rebuilt.** If the folder is missing, the app shows an error and quits (or refuses writes, if moved while running) rather than recreating it empty — quit the app before moving the repo.
- **Two running instances share those JSON files** and will fight over them via the `fs.watch` external-change listener. Quit one before starting another.

## Versioning

`npm version --no-git-tag-version <patch|minor|major>`. There is no `bump:*` script here. Bare `npm version` would create its own commit *and* tag — always pass the flag.

The version names the artifact (`TodoToday-<version>-arm64.dmg`) and sets `CFBundleShortVersionString` in the installed app, so it only becomes visible after a rebuild and reinstall.

## Committing does not update the running app

`/Applications/TodoToday.app` executes a copy of `dist/` baked into its own bundle. Changes to `src/**`, `main.js`, or `preload.js` are only live after a rebuild and reinstall:

```bash
npm run dist:dir && ditto "$HOME/Library/Caches/todotoday-build/mac-arm64/TodoToday.app" /Applications/TodoToday.app
```

- Quit the running app first (shared `data/`, see above).
- Use `ditto`, not `cp -R` — it preserves the code signature.
- `killall Dock` if a stale icon lingers; macOS caches Dock icons aggressively.

## Two build gotchas already fixed in the npm scripts

`dist` and `dist:dir` pass `--arm64` and redirect output to `$HOME/Library/Caches/todotoday-build`. Both flags are load-bearing:

- **`--arm64`** — `node` on this machine is x64 under Rosetta, so electron-builder otherwise defaults to an x64 build on an arm64 Mac.
- **Output outside `~/Documents`** — that directory is iCloud-synced, and sync stamps `com.apple.FinderInfo` / `com.apple.fileprovider.fpfs#P` onto the output. `codesign` rejects those with *"resource fork, Finder information, or similar detritus not allowed."* `xattr -cr` doesn't help; the attributes come back during packaging. Note this is **not** the `com.apple.provenance` attribute — that one is present on the signed output and is harmless.

## App identity

The Dock icon is 🧘, rendered from Apple Color Emoji via AppKit into `assets/icons/icon.icns` (10 sizes). `assets/icons/` is tracked on purpose — `build.mac.icon` and `setDockIcon()` in `main.js` both depend on it.

Unpackaged runs need `app.dock.setIcon()` because `package.json` alone doesn't apply; and the Dock *tooltip* can't be changed when running from source at all — it comes from the `Electron.app` bundle. Only a packaged build shows "TodoToday" there.

## Running from an agent or extension-host shell

If `npm start` dies with `Cannot read properties of undefined (reading 'setName')`, the environment has `ELECTRON_RUN_AS_NODE=1` set (VSCode's extension host does). That makes the Electron binary run as plain Node, so `require('electron')` resolves to the npm path shim instead of the real module. Workaround:

```bash
env -u ELECTRON_RUN_AS_NODE npm start
```

VSCode's integrated terminal strips the variable, so normal use is unaffected. Launching via `open -a` also inherits it from the calling shell.
