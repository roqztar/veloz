# Eyedance - AI Agent Documentation

## Project Overview

Eyedance is a **cyberpunk-themed RSVP (Rapid Serial Visual Presentation) speed reading application** built with React, TypeScript, and Vite. Words are displayed one at a time at a fixed position, with the Optimal Recognition Point (ORP) highlighted in a customizable neon color to minimize eye movement.

The project consists of two main parts:
1. **Web Application** (`src/`) - A standalone PWA built with Vite + React for reading pasted or uploaded text
2. **Browser Extension** (`extension/`) - A Chrome/Edge extension for speed-reading selected text on any webpage

### Key Features
- **ORP Highlighting**: Neon-colored character marks the optimal reading focus point (position varies by word length)
- **Smart Delays**: Words display longer based on length, punctuation, and type (numbers, URLs, code, etc.)
- **WPM Control**: Adjustable reading speed from 50 to 1000 words per minute
- **Cyberpunk UI**: Dark terminal aesthetic with customizable neon accent colors, grid backgrounds, and glow effects
- **Text Cleaning Pipeline**: URL shortening, number formatting, abbreviation expansion, markup removal
- **File Support**: Upload PDF, DOC, DOCX, PPT, PPTX, and TXT files for reading
- **Keyboard Shortcuts**: Space (play/pause), Arrows (navigate), F (fullscreen), E (editor), +/- (font size)
- **Touch Gestures**: Swipe left/right to navigate, tap to play/pause (mobile)
- **PWA Support**: Can be installed as a Progressive Web App with offline capability

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19.2.0 |
| Language | TypeScript | 5.9.3 |
| Build Tool | Vite | 7.3.1 |
| Styling | Tailwind CSS | 4.2.0 |
| PostCSS | @tailwindcss/postcss | 4.2.0 |
| Linting | ESLint | 9.39.1 |
| PDF Parsing | pdfjs-dist | 4.10.38 |
| DOC/DOCX Parsing | mammoth | 1.9.0 |
| ZIP/PPTX Parsing | jszip | 3.10.1 |
| Browser Extension | Manifest V3 | - |

---

## Project Structure

```
eyedance/
├── src/                          # Main web application
│   ├── components/               # React components
│   │   ├── Reader.tsx           # Main reader component (~1300 lines)
│   │   ├── SettingsModal.tsx    # Settings dialog (typography, effects)
│   │   ├── WordDisplay.tsx      # Single word display with ORP (~260 lines)
│   │   ├── ProgressBar.tsx      # Reading progress bar with seek
│   │   ├── CyberEye.tsx         # Time saved display component
│   │   ├── Controls.tsx         # Legacy playback controls (unused)
│   │   └── PixelIcons.tsx       # SVG icon components
│   ├── hooks/                    # Custom React hooks
│   │   ├── useSpritz.ts         # Core reading logic hook (~240 lines)
│   │   └── useDynamicFontSize.ts # Responsive font sizing (~80 lines)
│   ├── core/                     # Core business logic
│   │   ├── textCleaner.ts       # Text parsing and cleaning pipeline (~510 lines)
│   │   └── fileParser.ts        # Secure file upload parser (~640 lines)
│   ├── utils/                    # Utility functions
│   │   └── orp.ts               # Legacy ORP exports (re-exports from textCleaner)
│   ├── types/                    # TypeScript declarations
│   │   └── external.d.ts        # Types for pdfjs-dist, mammoth, jszip
│   ├── assets/                   # Static assets (react.svg)
│   ├── App.tsx                  # Root app component (renders Reader)
│   ├── main.tsx                 # Entry point
│   ├── index.css                # Global styles + Tailwind (~730 lines)
│   └── App.css                  # Component styles (minimal)
├── extension/                    # Browser extension (Manifest V3)
│   ├── manifest.json            # Extension manifest
│   ├── background.js            # Service worker (~75 lines)
│   ├── content/
│   │   ├── content.js           # Content script injected to pages (~540 lines)
│   │   └── content.css          # Content script styles (~520 lines)
│   ├── popup/
│   │   ├── popup.html           # Extension popup UI
│   │   └── popup.js             # Popup logic (~200 lines)
│   └── icons/                   # Extension icons (16/48/128px PNG + SVG)
├── dist/                         # Build output (gitignored)
├── public/                       # Public assets (eyedance.svg, manifest.json, sw.js)
├── index.html                    # HTML entry point (with CSP headers)
├── package.json                  # NPM dependencies
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # TypeScript app config (ES2020, strict)
├── tsconfig.node.json           # TypeScript node config (ES2023)
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── eslint.config.js             # ESLint configuration (flat config)
├── vercel.json                  # Vercel deployment configuration
├── README.md                    # Human-readable README
├── DEPLOY.md                    # Deployment instructions
└── MAINTENANCE.md               # Maintenance guidelines
```

---

## Build and Development Commands

```bash
# Install dependencies
npm install

# Development server (Vite dev server)
npm run dev

# Production build (TypeScript compile + Vite build)
npm run build

# Preview production build locally
npm run preview

# Lint code with ESLint
npm run lint
```

### Build Output
- The web app builds to `dist/` directory
- The extension files are in `extension/` and don't require building
- Extension icons are included in the repository (icon16.png, icon48.png, icon128.png, icon.svg)

---

## Code Organization

### Component Architecture

**Reader.tsx** (Main Component - ~1300 lines)
- Manages all UI state (settings, scrubber, editor, neon color picker)
- Implements cyberpunk dark theme with customizable neon accent color
- Handles keyboard shortcuts AND touch/swipe gestures for mobile
- Visual effects: spotlight sweep, ORP scan animation, grid background
- Integrates `useSpritz` hook for reading logic
- Contains inline modals for Color Picker, Scrubber, and Text Editor
- Auto-hiding controls based on mouse inactivity (2 seconds)
- Default text is cyberpunk-themed English welcome message

**WordDisplay.tsx** (~260 lines)
- Displays a single word with ORP highlighting
- Responsive font sizing: Adapts to mobile screens (<768px)
- Supports 3 font families (sans, serif, mono) and 3 weights (light, normal, bold)
- Font size adjustable from -5 to +5 levels (20% per step)
- Type-based coloring (URL: amber, number: cyan, parenthetical: dim)
- Optional nav buffer showing previous/next words
- Calculates dynamic padding for ORP centering based on longest word

**ProgressBar.tsx**
- Draggable progress indicator with word preview tooltip
- Shows current position and allows seeking to any word
- Accessibility attributes (role, aria values)

**SettingsModal.tsx** (~220 lines)
- Extracted from Reader.tsx for maintainability
- Typography settings: font family, weight, size
- Visual effects: grid background, glow effect
- Cyberpunk terminal styling with neon accents

**CyberEye.tsx**
- Displays time saved statistic
- Animated cyberpunk-style visual indicator

### Core Logic

**useSpritz.ts** (Custom Hook - ~240 lines)
- Manages reading state (current word, playing status, WPM)
- Implements the main reading loop with `setTimeout`
- Calculates smart delays based on word metadata
- Provides text navigation (next, prev, goTo, reset)
- Context buffer for previous/next words
- Code block detection and optional skipping
- German comments mixed with English code

**textCleaner.ts** (Text Processing - ~510 lines)
- `CleanOptions` interface for text processing configuration
- `DisplayWord` interface with type and delay multiplier
- `parseToDisplayWords()` - Main parsing function
- `calculateSmartDelay()` - Delay calculation based on word characteristics
- Abbreviation dictionary (German and English)
- URL, number, markup cleaning functions
- PDF line break fixing, footnote removal

**fileParser.ts** (Secure File Upload - ~640 lines)
- `parseFile()` - Main entry point for file parsing
- `validateFile()` - Security validation (size, type, path traversal check)
- `sanitizeText()` - XSS prevention, control character removal
- `parsePDF()` - PDF text extraction using pdfjs-dist with Unicode fixes
- `parseDOCX()` - DOCX parsing using mammoth
- `parseDOC()` - Legacy DOC support (limited via mammoth)
- `parsePPTX()` - PowerPoint text extraction using JSZip
- `parsePPT()` - Legacy PPT not supported (shows helpful error)
- `parseTXT()` - Plain text with encoding detection
- Security features:
  - Max file size: 10MB
  - Max text length: 500KB (truncates with warning)
  - MIME type and extension validation
  - Path traversal protection
  - Control character sanitization
  - Null byte removal

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
- **App config**: `tsconfig.app.json` - ES2020, DOM libs, strict mode enabled
- **Node config**: `tsconfig.node.json` - ES2023, for Vite config
- Strict TypeScript with `noUnusedLocals`, `noUnusedParameters`
- Module resolution: `bundler`
- JSX: `react-jsx` transform

### Code Style
- Single quotes for strings
- Semicolons required
- 2-space indentation
- Component files use PascalCase (e.g., `Reader.tsx`)
- Hook files use camelCase with `use` prefix (e.g., `useSpritz.ts`)
- Type interfaces defined in the same file as usage
- Comments mix German and English (legacy from development)

### CSS Conventions
- Tailwind CSS v4 with `@import "tailwindcss"` in index.css
- Custom animations defined in `index.css` (fade, zoom, slide, pulse, spotlight)
- Glassmorphism utilities: `.glass`, `.glass-light`
- Custom range input styling in `index.css`
- Neon glow effects using CSS variables (`--neon-color`)
- Responsive breakpoints at 640px (sm), 768px (md), and custom mobile queries
- Mobile-first approach with touch-optimized targets (min 44px)

### Theme System
- Always dark mode (cyberpunk aesthetic)
- Customizable neon accent color via HSL color picker
- Default neon color is random on each visit (prevents hydration mismatch)
- Color applied via CSS custom property `--neon-color`

---

## Controls

### Desktop (Keyboard)
| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` / `→` | Previous / Next word |
| `F` | Toggle fullscreen mode |
| `E` | Open text editor |
| `+` / `-` | Increase / Decrease font size |
| `Escape` | Close modals |

### Mobile (Touch)
| Gesture | Action |
|---------|--------|
| **Tap** word display | Toggle play/pause |
| **Swipe Left** | Next word |
| **Swipe Right** | Previous word |
| **Long press** navigation buttons | Fast forward/rewind (opens scrubber) |

### Extension Shortcuts
| Key | Action |
|-----|--------|
| `Ctrl+Shift+S` | Open extension popup |
| `Ctrl+Shift+R` | Speed read selected text |
| `ESC` | Close reader overlay |

---

## Browser Extension

### Manifest V3 Structure
- **Permissions**: `activeTab`, `storage`, `contextMenus`, `clipboardRead`, `clipboardWrite`, `scripting`
- **Host Permissions**: `<all_urls>`
- **Content Script**: Injected into all URLs, runs at `document_idle`

### Extension Features
- Right-click context menu: "Speed Read Selection"
- Keyboard shortcut: `Ctrl+Shift+R` to read selection
- Paste & read from clipboard
- WPM setting persisted in chrome.storage
- Direct text input in popup
- Touch/swipe support in reader overlay
- Context buffer showing previous/next words (8 words each side)

### Extension Development
- Extension files are in plain JavaScript (no build step required)
- Content script creates an overlay on the current page
- Background service worker handles context menu and keyboard commands
- Icons are included in `extension/icons/` directory

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
2. Deploy `dist/` contents to any static hosting (Vercel, Netlify, etc.)
3. Vercel configuration is provided in `vercel.json` with SPA rewrites

### Browser Extension
1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder
5. Extension will be loaded and active

---

## Security Considerations

### Web Application Security
- **Content Security Policy (CSP)**: Strict CSP in `index.html` headers:
  - `default-src 'self'` - Only same-origin content
  - `script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com` - Trusted scripts only
  - `style-src 'self' 'unsafe-inline'` - Inline styles allowed (required by Tailwind)
  - `font-src 'self' data:` - Fonts from same origin or data URIs
  - `img-src 'self' data: blob:` - Images from same origin or data/blob
  - `connect-src 'self'` - Network requests to same origin only
  - `worker-src 'self' blob:` - Workers from same origin or blob
  - `object-src 'none'` - No Flash/Java plugins
  - `frame-ancestors 'none'` - Prevents clickjacking
  - `upgrade-insecure-requests` - Forces HTTPS
- **X-Frame-Options: DENY** - Prevents embedding in iframes
- **X-Content-Type-Options: nosniff** - Prevents MIME sniffing
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restricts browser features (camera, mic, geolocation disabled)

### File Upload Security
- **File Validation** (`fileParser.ts`):
  - Size limit: 10MB maximum
  - Type whitelist: PDF, DOC, DOCX, PPT, PPTX, TXT only
  - Extension verification even when MIME type is generic
  - Path traversal detection (rejects `..`, `/`, `\` in filenames)
  - Empty file rejection
- **Text Sanitization**:
  - Null byte (`\x00`) removal
  - Control character filtering (keeps only common whitespace)
  - Length limit: 500KB maximum extracted text
  - Line ending normalization
- **Client-Side Only**: All parsing happens in browser, no server upload
- **Memory Safety**: PDF.js cleanup after extraction, ArrayBuffer handling
- **Unicode Support**: Proper handling of Umlaute (äöü) and special characters

### Extension Security
- Content script runs on all URLs with access to page DOM
- Extension requires `activeTab` permission for content injection
- No user data is sent to external servers (local-only processing)
- CSP compatible (no inline scripts in extension)

### Build Security
- Source maps disabled in production builds (`sourcemap: false` in vite.config.ts)
- Dependencies chunked separately for better cache control
- Security headers configured in `vite.config.ts` for dev/preview servers

---

## Configuration Files Reference

### vite.config.ts
- React plugin for Vite
- Manual chunking for PDF and DOC parsers (large dependencies)
- Security headers for dev/preview servers
- Optimized dependencies: pdfjs-dist, mammoth
- Target: ES2020

### tsconfig.app.json
- Target: ES2020
- Libs: ES2020, DOM, DOM.Iterable
- Strict mode enabled
- Module resolution: bundler
- JSX: react-jsx

### eslint.config.js
- Flat config format (ESLint 9.x)
- TypeScript ESLint recommended rules
- React Hooks and React Refresh plugins
- Ignores `dist/` directory

### tailwind.config.js
- Content: index.html, src/**/*.{js,ts,jsx,tsx}
- Dark mode: 'class' strategy
- No custom theme extensions

### postcss.config.js
- @tailwindcss/postcss plugin
- autoprefixer plugin

### vercel.json
- Framework: vite
- SPA rewrites: all routes to index.html
- Output directory: dist

---

## Known Limitations

- No automated test suite implemented
- No internationalization framework (UI is English with some German strings)
- No persistent storage for web app (text lost on refresh)
- Extension popup has inline styles (not using shared CSS)
- Legacy `.doc` format has limited support (best effort via mammoth)
- Legacy `.ppt` format not supported (requires server-side conversion)
- PDF parsing requires CDN worker (loaded from cdnjs.cloudflare.com)

---

## Useful References

- **ORP Calculation**: Based on word length - position 0 for single char, 1 for short (≤5), 2 for medium (≤9), 3 for longer
- **WPM Range**: 50-1000 (default 300)
- **Font Size Levels**: -5 to +5, each step is 20% change
- **Context Buffer**: Shows previous/next words (buffer size 1 in web app, 8 in extension)
- **Abbreviations**: German and English abbreviations supported (z.B., e.g., etc.)
- **Neon Color**: HSL value stored as CSS custom property, random on first visit

---

Last updated: 2026-03-16
