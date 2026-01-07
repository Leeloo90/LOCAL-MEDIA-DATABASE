# Story Graph: Local Bridge - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

This will automatically rebuild native modules (like better-sqlite3) for Electron via the `postinstall` script.

### 2. Run Development Mode
```bash
npm run dev
```

This will:
- Build the main and preload processes
- Start the Vite dev server for the renderer
- Launch the Electron app with hot reload

### 3. Build for Production
```bash
npm run build
npm run preview
```

---

## Troubleshooting

### Issue: "NODE_MODULE_VERSION mismatch" Error

**Symptom:**
```
Error: The module 'better_sqlite3.node' was compiled against a different Node.js version
```

**Solution:**
```bash
npx electron-rebuild
```

This rebuilds native modules to match Electron's Node.js version.

---

### Issue: "Unable to load preload script"

**Symptom:**
```
Error: ENOENT: no such file or directory, open '.../preload/preload.js'
```

**Cause:** The preload script is built as `.mjs` but main process looks for `.js`

**Solution:** Already fixed in [src/main/main.ts:23](src/main/main.ts#L23) - preload path uses `.mjs` extension.

---

### Issue: ffprobe not found

**Symptom:**
```
Error: ffprobe error: command not found
```

**Solution:**

**macOS (via Homebrew):**
```bash
brew install ffmpeg
```

**Windows:**
1. Download ffmpeg from https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to PATH

**Linux (Ubuntu/Debian):**
```bash
sudo apt install ffmpeg
```

**Verify installation:**
```bash
ffprobe -version
```

---

## Project Structure

```
story-graph-local-bridge/
├── src/
│   ├── main/              # Main process (Node.js)
│   │   ├── main.ts        # Window management, IPC handlers
│   │   └── database.ts    # SQLite operations
│   ├── preload/           # IPC Bridge (secure tunnel)
│   │   └── preload.ts     # Context isolation bridge
│   └── renderer/          # Renderer process (React UI)
│       ├── App.tsx        # Main React component
│       ├── components/    # UI components
│       ├── services/      # Database service, parser
│       └── types.ts       # TypeScript types
├── out/                   # Build output (dev & prod)
├── package.json
├── electron-vite.config.ts
└── tsconfig.json
```

---

## Development Workflow

### 1. Start Development Server
```bash
npm run dev
```
- Main/Preload: Auto-rebuild on file changes
- Renderer: Hot module reload (HMR) via Vite
- DevTools: Opens automatically in development mode

### 2. Database Location
The SQLite database is created at:
- **macOS**: `~/Library/Application Support/story-graph-local-bridge/story_graph.db`
- **Windows**: `%APPDATA%\story-graph-local-bridge\story_graph.db`
- **Linux**: `~/.config/story-graph-local-bridge/story_graph.db`

### 3. Testing Media Ingest

**Prepare Test Files:**
1. Create a folder with sample media files:
   - `.mp4` or `.mov` (video)
   - `.wav` or `.mp3` (audio)
2. Optionally, add transcript files (`.txt`):
   ```
   00:00:10:15  Speaker Name
   This is the dialogue content.

   00:00:15:20  Another Speaker
   More dialogue here.
   ```

**Test Workflow:**
1. Click "Import Media" in the app
2. Select your test folder
3. Wait for ffprobe to extract metadata
4. Assets appear in Media Pool with BROLL type
5. Click "Import Transcripts"
6. Select transcript `.txt` files
7. Matching assets are promoted to DIALOGUE type
8. Click an asset to view transcript segments

---

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development mode with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Run built production app |
| `npm install` | Install dependencies & rebuild native modules |
| `npx electron-rebuild` | Manually rebuild native modules |

---

## Native Modules

This project uses **better-sqlite3**, which is a native Node.js module. Native modules must be rebuilt for Electron because:
- Electron uses a different version of Node.js than your system
- Native modules are compiled against specific Node.js versions

**Automatic Rebuild:**
The `postinstall` script automatically runs `electron-rebuild` after `npm install`.

**Manual Rebuild:**
If you encounter issues, manually rebuild:
```bash
npx electron-rebuild
```

---

## Common Commands

### View SQLite Database
```bash
# macOS/Linux
sqlite3 ~/Library/Application\ Support/story-graph-local-bridge/story_graph.db

# Inside SQLite shell:
.tables                    # List tables
SELECT * FROM projects;    # View projects
SELECT * FROM media_assets; # View assets
.quit                      # Exit
```

### Clear Database
```bash
# macOS
rm ~/Library/Application\ Support/story-graph-local-bridge/story_graph.db

# Windows
del %APPDATA%\story-graph-local-bridge\story_graph.db
```

The database will be recreated on next launch with a default project.

---

## Environment Variables

### Development Mode Detection
The app automatically detects development mode via:
```typescript
const isDev = process.env.NODE_ENV === 'development';
```

In dev mode:
- Loads renderer from `http://localhost:5173`
- Opens DevTools automatically
- Hot module reload enabled

In production:
- Loads renderer from built files
- No DevTools
- Optimized bundle

---

## Known Limitations

1. **ffprobe Dependency**: Requires ffmpeg installed on system
2. **Transcript Format**: Currently supports DaVinci Resolve format only
3. **File Types**: Limited to `.mp4`, `.mov`, `.wav`, `.mp3`
4. **Matcher Logic**: Basic filename prefix matching (e.g., `C0043_SAT.txt` → `C0043*.mp4`)

---

## Next Steps

1. ✅ Run `npm run dev`
2. ✅ Test folder selection and media scanning
3. ✅ Verify ffprobe extracts metadata correctly
4. ✅ Test transcript matching and segment parsing
5. ✅ Check SQLite database file is created
6. ✅ Inspect segments in the UI

---

## Support

For issues or questions:
1. Check this troubleshooting guide
2. Review [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
3. Check Electron/Vite documentation
4. Verify ffmpeg installation: `ffprobe -version`

---

## Build Output Structure

```
out/
├── main/
│   └── main.js           # Bundled main process
├── preload/
│   └── preload.mjs       # Bundled preload script
└── renderer/
    ├── index.html        # Entry HTML
    └── assets/           # JS/CSS chunks
```

The `package.json` `main` field points to `out/main/main.js`.
