# Veloz - AI Agent Documentation

## Project Overview

Veloz is a **React-based speed reading application** that uses RSVP (Rapid Serial Visual Presentation) technology to help users read faster. Words are displayed one at a time at a fixed position, with the Optimal Recognition Point (ORP) highlighted in red to minimize eye movement.

The project consists of two main parts:
1. **Web Application** (`src/`) - A standalone Vite + React app for reading pasted or uploaded text
2. **Browser Extension** (`extension/`) - A Chrome/Edge extension for speed-reading selected text on any webpage

### Key Features
- **ORP Highlighting**: Red letter marks the optimal reading focus point
- **Smart Delays**: Words display longer based on length, punctuation, and type (numbers, URLs, etc.)
- **WPM Control**: Adjustable reading speed from 200 to 1000 words per minute
- **Text Cleaning Pipeline**: URL shortening, number formatting, abbreviation expansion, markup removal
- **Dark/Light Mode**: Theme switching with glassmorphism UI
- **Focus Mode**: Distraction-free reading with hidden controls
- **Keyboard Shortcuts**: Space (play/pause), Arrows (navigate), F (focus mode), E (editor)
- **File Support**: Upload `.txt` files for reading

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2.0 |
| Language | TypeScript 5.9.3 |
| Build Tool | Vite 7.3.1 |
| Styling | Tailwind CSS 4.2.0 + PostCSS |
| Linting | ESLint 9 + typescript-eslint |
| Browser Extension | Manifest V3 |

---

## Project Structure

```
spritz-reader/
├── src/                          # Main web application
│   ├── components/               # React components
│   │   ├── Reader.tsx           # Main reader component (794 lines)
│   │   ├── WordDisplay.tsx      # Single word display with ORP
│   │   ├── Controls.tsx         # Playback controls (legacy)
│   │   └── ProgressBar.tsx      # Reading progress bar
│   ├── hooks/                    # Custom React hooks
│   │   ├── useSpritz.ts         # Core reading logic hook
│   │   └── useDynamicFontSize.ts # Responsive font sizing
│   ├── core/                     # Core utilities
│   │   └── textCleaner.ts       # Text parsing and cleaning pipeline
│   ├── utils/                    # Utility functions
│   │   └── orp.ts               # ORP calculations (legacy exports)
│   ├── assets/                   # Static assets
│   ├── App.tsx                  # Root app component
│   ├── main.tsx                 # Entry point
│   ├── App.css                  # Component styles
│   └── index.css                # Global styles + Tailwind
├── extension/                    # Browser extension (Manifest V3)
│   ├── manifest.json            # Extension manifest
│   ├── background.js            # Service worker
│   ├── content/
│   │   ├── content.js           # Content script injected to pages
│   │   └── content.css          # Content script styles
│   ├── popup/
│   │   ├── popup.html           # Extension popup UI
│   │   └── popup.js             # Popup logic
│   └── icons/                   # Extension icons (not in repo)
├── dist/                         # Build output (gitignored)
├── public/                       # Public assets
├── index.html                    # HTML entry point
├── package.json                  # NPM dependencies
├── vite.config.ts               # Vite configuration
├── tsconfig.*.json              # TypeScript configurations
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
└── eslint.config.js             # ESLint configuration
```

---

## Build and Development Commands

```bash
# Development server (Vite dev server)
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint
```

### Build Output
- The web app builds to `dist/` directory
- The extension files are in `extension/` and don't require building
- Extension icons should be placed in `extension/icons/` (icon16.png, icon48.png, icon128.png)

---

## Code Organization

### Component Architecture

**Reader.tsx** (Main Component)
- Manages all UI state (settings, scrubber, editor, focus mode, theme)
- Handles keyboard shortcuts and pointer events
- Integrates `useSpritz` hook for reading logic
- Contains modals for Settings, Scrubber (position selector), and Text Editor

**WordDisplay.tsx**
- Displays a single word with ORP highlighting
- Calculates dynamic font size based on longest word in text
- Supports 3 font families (sans, serif, mono) and 3 weights (light, normal, bold)
- Font size adjustable from -5 to +5 levels

### Core Logic

**useSpritz.ts** (Custom Hook)
- Manages reading state (current word, playing status, WPM)
- Implements the main reading loop with `setTimeout`
- Calculates smart delays based on word metadata
- Provides text navigation (next, prev, goTo, reset)

**textCleaner.ts** (Text Processing)
- `CleanOptions` interface for text processing configuration
- `DisplayWord` interface with type and delay multiplier
- `parseToDisplayWords()` - Main parsing function
- `calculateSmartDelay()` - Delay calculation based on word characteristics
- Abbreviation dictionary (German and English)

### Smart Delay Algorithm
The delay for each word is calculated as:
```
delay = baseDelay * delayMultiplier
```

Where `delayMultiplier` is affected by:
- Word length: >12 chars (1.6x), >9 chars (1.4x), >6 chars (1.2x)
- Punctuation: `.!?` (+1.0), `,` (+0.2), `;:` (+0.3)
- Word type: URL (3x), Number (2.5x), Code (1.5x), Abbreviation (1.2x)
- Paragraph end: +50% pause

---

## Development Conventions

### TypeScript Configuration
- **App config**: `tsconfig.app.json` - ES2022, DOM libs, strict mode enabled
- **Node config**: `tsconfig.node.json` - ES2023, for Vite config
- Strict TypeScript with `noUnusedLocals`, `noUnusedParameters`
- Module resolution: `bundler`

### Code Style
- Single quotes for strings
- Semicolons required
- 2-space indentation
- Component files use PascalCase (e.g., `Reader.tsx`)
- Hook files use camelCase with `use` prefix (e.g., `useSpritz.ts`)
- Type interfaces defined in the same file as usage

### CSS Conventions
- Tailwind CSS v4 with `@import "tailwindcss"` in index.css
- Custom animations defined in `index.css`
- Glassmorphism utilities: `.glass`, `.glass-light`
- Custom range input styling in `index.css`
- Color scheme uses red (`#ef4444`) as accent color

### Language
- UI language is **German** (e.g., "Einstellungen", "Schriftart", "Speichern & Lesen")
- Code comments mix German and English
- Variable names in English

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` (Arrow Left) | Previous word |
| `→` (Arrow Right) | Next word |
| `F` | Toggle focus mode |
| `E` | Open text editor |
| `+` / `=` | Increase font size |
| `-` / `_` | Decrease font size |
| `Escape` | Close modals / Exit focus mode |

### Extension Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+Shift+S` | Open extension popup |
| `Ctrl+Shift+R` | Speed read selected text |

---

## Browser Extension

### Manifest V3 Structure
- **Permissions**: `activeTab`, `storage`, `contextMenus`
- **Host Permissions**: `<all_urls>`
- **Content Script**: Injected into all URLs, runs at `document_idle`

### Extension Features
- Right-click context menu: "Speed Read Selection"
- Keyboard shortcut: `Ctrl+Shift+R` to read selection
- Paste & read from clipboard
- WPM setting persisted in chrome.storage

### Extension Development
- Extension files are in plain JavaScript (no build step required)
- Content script creates an overlay on the current page
- Background service worker handles context menu and keyboard commands
- Icons must be added to `extension/icons/` directory

---

## Testing Strategy

**No automated tests are currently implemented.** The project relies on:
- TypeScript for type checking
- ESLint for code quality
- Manual testing via `npm run dev`
- Extension testing via Chrome's developer mode

---

## Deployment

### Web Application
1. Run `npm run build` to create production build in `dist/`
2. Deploy `dist/` contents to any static hosting (GitHub Pages, Vercel, Netlify, etc.)

### Browser Extension
1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Extension will be loaded and active

---

## Security Considerations

- Content script runs on all URLs with access to page DOM
- Extension requires `activeTab` permission for content injection
- File upload limited to `.txt` files via `accept` attribute
- No user data is sent to external servers (local-only processing)

---

## Known Limitations

- No test suite implemented
- Extension icons not included in repository
- No internationalization framework (hardcoded German UI strings)
- No persistent storage for web app (text lost on refresh)

---

## Useful References

- **ORP Calculation**: Based on word length - position 1 for short words (≤5), position 2 for medium (≤9), position 3 for longer
- **WPM Range**: 200-1000 (default 300)
- **Font Size Levels**: -5 to +5, each step is 15% change
- **Context Buffer**: Shows previous/next words (currently buffer size 1)
