# Neuro-Read

A modern, blazing-fast RSVP (Rapid Serial Visual Presentation) speed reading application built with React and TypeScript.

![Neuro-Read](https://img.shields.io/badge/Neuro--Read-Speed%20Reader-ef4444)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)

## Features

- **⚡ RSVP Technology** - Words displayed one at a time with ORP (Optimal Recognition Point) highlighting
- **🎯 Smart Delays** - Words display longer based on length, punctuation, and type
- **🎚️ WPM Control** - Adjustable reading speed from 200 to 1000 words per minute
- **🎨 Beautiful UI** - Glassmorphism design with dark/light mode support
- **⌨️ Keyboard Shortcuts** - Space (play/pause), Arrows (navigate), F (focus mode), E (editor)
- **📄 File Support** - Upload files for reading
- **🔌 Browser Extension** - Speed read selected text on any webpage

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Deploy

See [DEPLOY.md](./DEPLOY.md) for deployment instructions.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` / `→` | Previous/Next word |
| `F` | Toggle focus mode |
| `E` | Open text editor |
| `+` / `-` | Increase/Decrease font size |
| `Escape` | Close modals |

## Browser Extension

The `extension/` folder contains a Chrome/Edge extension for speed-reading selected text on any webpage.

### Install Extension
1. Open Chrome/Edge → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

## License

MIT
