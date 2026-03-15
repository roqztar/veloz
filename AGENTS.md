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
- **File Support**: Upload PDF, DOC, DOCX, PPT, PPTX, and TXT files for reading
- **Touch Gestures**: Swipe left/right to navigate, tap to play/pause (mobile)

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
spritz-reader/
├── src/                          # Main web application
│   ├── components/               # React components
│   │   ├── Reader.tsx           # Main reader component (~844 lines)
│   │   ├── SettingsModal.tsx    # Settings dialog (extracted for maintainability)
│   │   ├── WordDisplay.tsx      # Single word display with ORP (~197 lines)
│   │   ├── Controls.tsx         # Playback controls (legacy, unused)
│   │   └── ProgressBar.tsx      # Reading progress bar (~22 lines)
│   ├── hooks/                    # Custom React hooks
│   │   ├── useSpritz.ts         # Core reading logic hook (~246 lines)
│   │   └── useDynamicFontSize.ts # Responsive font sizing (~83 lines)
│   ├── core/                     # Core utilities
│   │   ├── textCleaner.ts       # Text parsing and cleaning pipeline (~458 lines)
│   │   └── fileParser.ts        # Secure file upload parser (~516 lines)
│   ├── utils/                    # Utility functions
│   │   └── orp.ts               # ORP calculations (legacy exports)
│   ├── types/                    # TypeScript declarations
│   │   └── external.d.ts        # Types for pdfjs-dist, mammoth, jszip
│   ├── assets/                   # Static assets
│   ├── App.tsx                  # Root app component (renders Reader)
│   ├── main.tsx                 # Entry point
│   ├── App.css                  # Component styles (minimal)
│   └── index.css                # Global styles + Tailwind (~388 lines)
├── extension/                    # Browser extension (Manifest V3)
│   ├── manifest.json            # Extension manifest (v3)
│   ├── background.js            # Service worker (~77 lines)
│   ├── content/
│   │   ├── content.js           # Content script injected to pages (~540 lines)
│   │   └── content.css          # Content script styles (~523 lines)
│   ├── popup/
│   │   ├── popup.html           # Extension popup UI (~475 lines inline styles)
│   │   └── popup.js             # Popup logic (~204 lines)
│   └── icons/                   # Extension icons (16/48/128px PNG + SVG)
├── dist/                         # Build output (gitignored)
├── public/                       # Public assets
├── index.html                    # HTML entry point (with CSP headers)
├── package.json                  # NPM dependencies
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript project references
├── tsconfig.app.json            # TypeScript app config (ES2022, strict)
├── tsconfig.node.json           # TypeScript node config (ES2023)
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── eslint.config.js             # ESLint configuration (flat config)
├── vercel.json                  # Vercel deployment configuration
├── README.md                    # Human-readable README
├── DEPLOY.md                    # Deployment instructions
└── MAINTENANCE.md               # Maintenance guidelines for developers
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

**Reader.tsx** (Main Component)
- Manages all UI state (settings, scrubber, editor, focus mode, theme)
- Handles keyboard shortcuts AND touch/swipe gestures for mobile
- Mobile Features:
  - Swipe left/right on word display to navigate
  - Tap word display to play/pause
  - Touch-optimized buttons (min 44px)
  - Responsive layout adapts to screen size
- Integrates `useSpritz` hook for reading logic
- Contains modals for Settings, Scrubber, and Text Editor
- Default text is in German

**WordDisplay.tsx**
- Displays a single word with ORP highlighting
- Responsive font sizing: Adapts to mobile screens (<768px)
- Mobile: smaller padding (25% vs 35%), adjusted min/max sizes
- Supports 3 font families (sans, serif, mono) and 3 weights (light, normal, bold)
- Font size adjustable from -5 to +5 levels (15% per step)
- Type-based coloring (URL: amber, number: cyan, parenthetical: dim)

**ProgressBar.tsx** (22 lines)
- Simple progress indicator with gradient fill
- Accessibility attributes (role, aria values)

**SettingsModal.tsx** (206 lines)
- Extracted from Reader.tsx to maintain component size
- Typography settings: font family, weight, size
- Text cleaning options: URLs, numbers, abbreviations, line breaks, markup
- Parentheses handling modes: keep, dim, shorten, remove

### Core Logic

**useSpritz.ts** (Custom Hook - 246 lines)
- Manages reading state (current word, playing status, WPM)
- Implements the main reading loop with `setTimeout`
- Calculates smart delays based on word metadata
- Provides text navigation (next, prev, goTo, reset)
- Context buffer for previous/next words
- Code block detection and optional skipping

**textCleaner.ts** (Text Processing - 458 lines)
- `CleanOptions` interface for text processing configuration
- `DisplayWord` interface with type and delay multiplier
- `parseToDisplayWords()` - Main parsing function
- `calculateSmartDelay()` - Delay calculation based on word characteristics
- Abbreviation dictionary (German and English)
- URL, number, markup cleaning functions

**fileParser.ts** (Secure File Upload - 516 lines)
- `parseFile()` - Main entry point for file parsing
- `validateFile()` - Security validation (size, type, path traversal check)
- `sanitizeText()` - XSS prevention, control character removal
- `parsePDF()` - PDF text extraction using pdfjs-dist
- `parseDOCX()` - DOCX parsing using mammoth
- `parseDOC()` - Legacy DOC support (limited)
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

### Component Architecture Best Practices

To ensure maintainability, follow these principles when modifying components:

**1. Extract Large Modals into Separate Components**
- Settings modal moved to `SettingsModal.tsx` (was inline in Reader.tsx)
- Keeps parent components under 400 lines
- Props interface clearly defines all dependencies
- Example pattern for future modals

**2. Props Interface Pattern**
```typescript
interface ComponentProps {
  isOpen: boolean;
  onClose: () => void;
  // Typed callbacks with specific values
  setFontFamily: (f: 'sans' | 'serif' | 'mono') => void;
  // ...
}
```

**3. State Management Hierarchy**
- `Reader.tsx`: Top-level UI state (modals, theme, font settings)
- `useSpritz.ts`: Reading logic state (current word, WPM, playback)
- Individual modals: Local form state only

**4. Styling Consistency**
- Use `glassClass` and `accentBgClass` variables from parent
- Never hardcode colors - use theme-aware variables
- Animation durations: 200ms for quick feedback, 300ms for transitions

**5. When Adding New Features**
- If >100 lines of JSX: Consider extraction
- If reused >2 times: Make it a component
- If modal content: Create separate file in `components/`

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
- Custom animations defined in `index.css` (fade, zoom, slide, pulse)
- Glassmorphism utilities: `.glass`, `.glass-light`
- Custom range input styling in `index.css`
- Color scheme uses red (`#ef4444`) as accent color
- Responsive breakpoints at 768px (tablet) and 480px (mobile)
- Dark mode classes applied conditionally

### Language
- UI language is **German** (e.g., "Einstellungen", "Schriftart", "Speichern & Lesen")
- Code comments mix German and English
- Variable names in English

---

## Controls

### Desktop (Keyboard)
| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` / `→` | Previous / Next word |
| `F` | Toggle focus mode |
| `E` | Open text editor |
| `+` / `-` | Increase / Decrease font size |
| `Escape` | Close modals / Exit focus mode |
| `Home` / `End` | Jump to beginning / end |

### Mobile (Touch)
| Gesture | Action |
|---------|--------|
| **Tap** word display | Play/Pause |
| **Swipe Left** | Next word |
| **Swipe Right** | Previous word |
| **Long press** navigation buttons | Fast forward/rewind |
| **Touch buttons** | All buttons min 44px for easy tapping |

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

### tsconfig.app.json
- Target: ES2022
- Libs: ES2022, DOM, DOM.Iterable
- Strict mode enabled
- Module resolution: bundler

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
- No internationalization framework (hardcoded German UI strings)
- No persistent storage for web app (text lost on refresh)
- Extension popup has inline styles (not using shared CSS)
- Legacy `.doc` format has limited support (best effort via mammoth)
- Legacy `.ppt` format not supported (requires server-side conversion)
- PDF parsing requires CDN worker (privacy: loaded from cdnjs.cloudflare.com)

---

## Useful References

- **ORP Calculation**: Based on word length - position 1 for short words (≤5), position 2 for medium (≤9), position 3 for longer
- **WPM Range**: 200-1000 (default 300)
- **Font Size Levels**: -5 to +5, each step is 15% change
- **Context Buffer**: Shows previous/next words (buffer size 1 in web app, 8 in extension)
- **Abbreviations**: German and English abbreviations supported (z.B., e.g., etc.)

---

Last updated: 2026-03-15
