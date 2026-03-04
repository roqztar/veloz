# Veloz - Maintenance Guide

## Quick Reference for Future Development

### Project Structure
```
src/
├── components/          # React UI components
│   ├── Reader.tsx      # Main container (~400 lines)
│   ├── SettingsModal.tsx # Extracted settings dialog
│   ├── WordDisplay.tsx # Word rendering with ORP
│   └── ProgressBar.tsx # Progress indicator
├── hooks/              # Custom React hooks
│   ├── useSpritz.ts    # Core reading logic
│   └── useDynamicFontSize.ts # Responsive sizing
├── core/               # Business logic
│   ├── textCleaner.ts  # Text processing
│   └── fileParser.ts   # File upload & parsing
└── types/              # TypeScript declarations
    └── external.d.ts   # 3rd party lib types
```

### Key Principles

1. **Keep Reader.tsx lean** - Extract modals >100 lines
2. **No Emojis** - Use SVG icons only
3. **Theme-aware** - Use `isDarkMode` checks for colors
4. **Props interfaces** - Always define explicit prop types

### Responsive Design Guidelines

**Mobile-First Approach:**
- Use `sm:` (640px) and `md:` (768px) breakpoints
- Buttons minimum 44px for touch targets
- Test font sizes on small screens (320px width)
- Swipe gestures for main interactions

**Adding touch gestures:**
```tsx
const touchStartX = useRef<number | null>(null);

const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0].clientX;
};

const handleTouchEnd = (e: React.TouchEvent) => {
  const deltaX = e.changedTouches[0].clientX - (touchStartX.current || 0);
  if (Math.abs(deltaX) > 50) {
    deltaX > 0 ? prev() : next();
  }
};
```

**Common Tasks**

**Adding a new button:**
```tsx
<button
  onClick={handler}
  className={`w-11 h-11 rounded-full ${glassClass} ${textColorClass} 
    transition-all duration-300 ease-out 
    hover:scale-105 hover:-translate-y-0.5 
    active:scale-95 min-w-[44px] min-h-[44px]`}
>
  <svg>...</svg>
</button>
```

**Adding a new modal:**
1. Create `src/components/NewModal.tsx`
2. Define `NewModalProps` interface
3. Use in `Reader.tsx`: `<NewModal isOpen={...} onClose={...} />`
4. State stays in Reader, logic in modal

**Adding file support:**
1. Add MIME type to `ALLOWED_TYPES` in `fileParser.ts`
2. Add parser function (async)
3. Add to `parseFile()` switch statement
4. Update `getSupportedFileTypes()`

### Dependencies
- React 19, TypeScript 5.9, Vite 7.3
- pdfjs-dist (PDF), mammoth (DOCX), jszip (PPTX)
- Tailwind CSS v4

### Build Commands
```bash
npm run dev     # Development
npm run build   # Production
npm run lint    # Check code
```

### Security Checklist
- [ ] File upload validates type & size
- [ ] No `eval()` or `innerHTML` with user input
- [ ] CSP headers in `index.html` are preserved
- [ ] Path traversal check for filenames

---
Last updated: 2026-03-04
