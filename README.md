# Eyedance

A modern, blazing-fast RSVP (Rapid Serial Visual Presentation) speed reading application built with React and TypeScript.

🌐 **Live Demo**: [eyedance-kappa.vercel.app](https://eyedance-kappa.vercel.app)

![Eyedance](https://img.shields.io/badge/Eyedance-Speed%20Reader-ef4444)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)

## Features

- **⚡ RSVP Technology** - Words displayed one at a time with ORP (Optimal Recognition Point) highlighting
- **🎯 Smart Delays** - Words display longer based on length, punctuation, and type
- **🎚️ WPM Control** - Adjustable reading speed from 200 to 1000 words per minute
- **🔊 Text-to-Speech** - Male/Female voice synthesis with adjustable rate
- **💡 Neon Spotlight** - Atmospheric sweep effect on page load and text changes
- **🔍 ORP Scan** - Periodic scan animation every 45 seconds
- **🎨 Cyberpunk UI** - Glassmorphism design with customizable neon accents
- **⌨️ Keyboard Shortcuts** - Space (play/pause), Arrows (navigate), F (focus mode), E (editor), S (speech)
- **📱 Mobile Optimized** - Touch gestures (swipe to navigate, tap to play/pause), PWA support
- **📄 File Support** - Upload PDF, DOCX, TXT, and more for reading
- **🔌 Browser Extension** - Speed read selected text on any webpage

## Quick Start

### Online
Visit [eyedance-kappa.vercel.app](https://eyedance-kappa.vercel.app) to use Eyedance instantly in your browser.

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### PWA Installation
Eyedance can be installed as a Progressive Web App:
- **Desktop**: Click the install icon in your browser's address bar
- **Mobile**: Tap "Add to Home Screen" from the browser menu

## Deploy

See [DEPLOY.md](./DEPLOY.md) for deployment instructions.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` / `→` | Previous/Next word |
| `F` | Toggle focus mode |
| `E` | Open text editor |
| `S` | Toggle speech synthesis |
| `+` / `-` | Increase/Decrease font size |
| `Escape` | Close modals |

## Mobile Controls

| Gesture | Action |
|---------|--------|
| **Tap** | Play/Pause |
| **Swipe Left** | Next word |
| **Swipe Right** | Previous word |
| **Long Press** buttons | Fast forward/rewind |

## Browser Extension

The `extension/` folder contains a Chrome/Edge extension for speed-reading selected text on any webpage.

### Install Extension
1. Open Chrome/Edge → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` folder

## License

MIT
