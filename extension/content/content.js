// Veloz Speed Reader - Content Script
// Injected into all pages for RSVP reading

(function() {
  'use strict';

  // Prevent double injection
  if (window.velozReaderInjected) return;
  window.velozReaderInjected = true;

  // Create the reader overlay
  let readerOverlay = null;
  let isReading = false;
  let savedWpm = 300; // Default WPM

  // Load WPM from storage on init
  loadSavedWpm();

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'readText') {
      startReading(request.text);
      sendResponse({ success: true });
    } else if (request.action === 'getSelection') {
      const selection = window.getSelection().toString();
      sendResponse({ text: selection });
    } else if (request.action === 'closeReader') {
      closeReader();
      sendResponse({ success: true });
    }
    return true;
  });

  // Handle context menu - read selected text
  document.addEventListener('contextmenu', (e) => {
    const selection = window.getSelection().toString().trim();
    if (selection.length > 0) {
      chrome.runtime.sendMessage({
        action: 'contextMenuClick',
        text: selection
      });
    }
  });

  // Keyboard shortcut handler
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + R to read selection
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
      e.preventDefault();
      const selection = window.getSelection().toString().trim();
      if (selection) {
        startReading(selection);
      }
    }
    
    // ESC to close reader
    if (e.key === 'Escape' && readerOverlay) {
      closeReader();
    }
  });

  // Load saved WPM from chrome.storage
  function loadSavedWpm() {
    try {
      chrome.storage.local.get(['wpm'], (result) => {
        if (result.wpm && typeof result.wpm === 'number') {
          savedWpm = result.wpm;
        }
      });
    } catch (e) {
      console.log('Veloz: Could not load WPM from storage');
    }
  }

  function createReaderOverlay() {
    if (readerOverlay) return readerOverlay;

    const overlay = document.createElement('div');
    overlay.id = 'veloz-reader-overlay';
    overlay.innerHTML = `
      <div id="veloz-reader-container">
        <div id="veloz-reader-header">
          <div id="veloz-reader-logo">Veloz</div>
          <span id="veloz-reader-progress">0%</span>
          <button id="veloz-reader-close" aria-label="Schließen">×</button>
        </div>
        <div id="veloz-reader-word-container">
          <div id="veloz-touch-left" aria-label="Zurück"></div>
          <div id="veloz-touch-right" aria-label="Weiter"></div>
          
          <!-- Context words (previous) -->
          <div id="veloz-context-prev" class="veloz-context"></div>
          
          <!-- Main word display -->
          <div id="veloz-reader-word">
            <span id="veloz-left"></span>
            <span id="veloz-orp"></span>
            <span id="veloz-right"></span>
          </div>
          
          <!-- Context words (next) -->
          <div id="veloz-context-next" class="veloz-context"></div>
        </div>
        <div id="veloz-reader-controls">
          <button id="veloz-reset" aria-label="Zurück zum Anfang">⏮</button>
          <button id="veloz-prev" aria-label="Zurück">‹</button>
          <button id="veloz-play" aria-label="Wiedergabe">▶</button>
          <button id="veloz-next" aria-label="Weiter">›</button>
        </div>
        <div id="veloz-reader-wpm">
          <input type="range" id="veloz-wpm-slider" min="100" max="1000" value="${savedWpm}" step="10" aria-label="Lesegeschwindigkeit">
          <span id="veloz-wpm-value">${savedWpm} WPM</span>
        </div>
        <div id="veloz-keyboard-hint">
          <kbd>Leertaste</kbd> Play/Pause <kbd>←</kbd> <kbd>→</kbd> Navigation <kbd>ESC</kbd> Schließen
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    readerOverlay = overlay;

    // Event listeners
    overlay.querySelector('#veloz-reader-close').addEventListener('click', closeReader);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeReader();
    });

    // Touch support
    const touchLeft = overlay.querySelector('#veloz-touch-left');
    const touchRight = overlay.querySelector('#veloz-touch-right');
    
    let touchStartX = 0;
    let touchStartY = 0;
    
    overlay.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    overlay.addEventListener('touchend', (e) => {
      if (!window.velozReaderControls) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Swipe detection (horizontal)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          window.velozReaderControls.prev();
        } else {
          window.velozReaderControls.next();
        }
      }
      
      // Tap detection
      const rect = overlay.getBoundingClientRect();
      const tapX = touchEndX - rect.left;
      
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        if (tapX < rect.width * 0.25) {
          window.velozReaderControls.prev();
        } else if (tapX > rect.width * 0.75) {
          window.velozReaderControls.next();
        } else {
          window.velozReaderControls.toggle();
        }
      }
    }, { passive: true });

    return overlay;
  }

  function startReading(text) {
    if (!text || text.trim().length === 0) return;

    const overlay = createReaderOverlay();
    overlay.classList.remove('closing');
    overlay.style.display = 'flex';
    
    // Parse words - improved tokenizer
    const words = tokenizeText(text);
    if (words.length === 0) return;

    // Store reading state
    overlay.dataset.words = JSON.stringify(words);
    overlay.dataset.currentIndex = '0';
    overlay.dataset.isPlaying = 'false';

    // Display first word (initially paused, so context is visible)
    displayWord(words[0], words, 0);
    
    // Ensure context is visible initially
    overlay.querySelector('#veloz-reader-word-container').classList.remove('playing');

    // Setup controls
    setupControls(words);
    
    // Focus for keyboard
    overlay.tabIndex = 0;
    overlay.focus();
  }

  function tokenizeText(text) {
    // Improved tokenization that handles punctuation better
    // Split by whitespace but keep punctuation attached to words
    return text
      .replace(/[\r\n]+/g, ' ')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);
  }

  function displayWord(word, allWords, currentIdx) {
    const overlay = readerOverlay;
    if (!overlay || !word) return;

    // Calculate ORP (Optimal Recognition Point)
    // Based on Spritz algorithm - position varies by word length
    const orpIndex = calculateORP(word);

    const left = word.slice(0, orpIndex);
    const orp = word[orpIndex] || '';
    const right = word.slice(orpIndex + 1);

    overlay.querySelector('#veloz-left').textContent = left;
    overlay.querySelector('#veloz-orp').textContent = orp;
    overlay.querySelector('#veloz-right').textContent = right;

    // Update context words (previous and next)
    updateContextWords(allWords, currentIdx);

    // Calculate dynamic font size
    adjustFontSize(word);
  }

  function updateContextWords(allWords, currentIdx) {
    const overlay = readerOverlay;
    if (!overlay) return;

    const contextSize = 8;
    const prevContainer = overlay.querySelector('#veloz-context-prev');
    const nextContainer = overlay.querySelector('#veloz-context-next');

    // Get previous words (reverse order for display)
    const prevWords = [];
    for (let i = 1; i <= contextSize; i++) {
      const idx = currentIdx - i;
      if (idx >= 0) {
        prevWords.unshift(allWords[idx]);
      }
    }

    // Get next words
    const nextWords = [];
    for (let i = 1; i <= contextSize; i++) {
      const idx = currentIdx + i;
      if (idx < allWords.length) {
        nextWords.push(allWords[idx]);
      }
    }

    // Render previous words
    prevContainer.innerHTML = prevWords.map((w, i) => 
      `<span class="veloz-context-word" data-offset="-${prevWords.length - i}" title="Klicken zum Springen">${escapeHtml(w)}</span>`
    ).join('');

    // Render next words
    nextContainer.innerHTML = nextWords.map((w, i) => 
      `<span class="veloz-context-word" data-offset="${i + 1}" title="Klicken zum Springen">${escapeHtml(w)}</span>`
    ).join('');

    // Add click handlers for context words
    prevContainer.querySelectorAll('.veloz-context-word').forEach(el => {
      el.addEventListener('click', () => {
        const offset = parseInt(el.dataset.offset);
        if (window.velozReaderControls && window.velozReaderControls.goToOffset) {
          window.velozReaderControls.goToOffset(offset);
        }
      });
    });

    nextContainer.querySelectorAll('.veloz-context-word').forEach(el => {
      el.addEventListener('click', () => {
        const offset = parseInt(el.dataset.offset);
        if (window.velozReaderControls && window.velozReaderControls.goToOffset) {
          window.velozReaderControls.goToOffset(offset);
        }
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function calculateORP(word) {
    const length = word.length;
    
    // Skip leading punctuation
    let startIdx = 0;
    while (startIdx < length && /[^a-zA-Z0-9äöüÄÖÜß]/.test(word[startIdx])) {
      startIdx++;
    }
    
    const effectiveLength = length - startIdx;
    
    // Calculate ORP based on effective word length
    let orpOffset;
    if (effectiveLength <= 1) orpOffset = 0;
    else if (effectiveLength <= 4) orpOffset = 1;
    else if (effectiveLength <= 8) orpOffset = 2;
    else if (effectiveLength <= 11) orpOffset = 3;
    else orpOffset = 4;
    
    return Math.min(startIdx + orpOffset, length - 1);
  }

  function adjustFontSize(word) {
    const container = readerOverlay.querySelector('#veloz-reader-word');
    const wordContainer = readerOverlay.querySelector('#veloz-reader-word-container');
    const maxWidth = wordContainer.clientWidth * 0.85;
    
    // Start with default font size
    let fontSize = window.innerWidth < 640 ? 42 : 72;
    container.style.fontSize = fontSize + 'px';
    
    // Reduce until it fits
    while (container.scrollWidth > maxWidth && fontSize > 20) {
      fontSize -= 2;
      container.style.fontSize = fontSize + 'px';
    }
  }

  function setupControls(words) {
    const overlay = readerOverlay;
    let currentIndex = 0;
    let isPlaying = false;
    let timer = null;

    const wpmSlider = overlay.querySelector('#veloz-wpm-slider');
    const wpmValue = overlay.querySelector('#veloz-wpm-value');
    const playBtn = overlay.querySelector('#veloz-play');
    const progressSpan = overlay.querySelector('#veloz-reader-progress');

    function getDelay() {
      const wpm = parseInt(wpmSlider.value);
      let baseDelay = (60 / wpm) * 1000;
      
      const word = words[currentIndex];
      
      // Adjust for word characteristics
      // Longer words need more time
      if (word.length > 12) baseDelay *= 1.5;
      else if (word.length > 9) baseDelay *= 1.3;
      else if (word.length > 6) baseDelay *= 1.1;
      
      // Adjust for word complexity (contains numbers or special chars)
      if (/\d/.test(word)) baseDelay *= 1.2;
      
      // Punctuation pauses
      if (/[.!?]+$/.test(word)) baseDelay *= 2.0;
      else if (/[,;:]/.test(word)) baseDelay *= 1.4;
      else if (/[-–—]/.test(word)) baseDelay *= 1.3;
      
      // Paragraph breaks (double newline in original)
      if (word.endsWith('\n\n')) baseDelay *= 2.5;
      
      return baseDelay;
    }

    function updateDisplay() {
      displayWord(words[currentIndex], words, currentIndex);
      const progress = Math.round(((currentIndex + 1) / words.length) * 100);
      progressSpan.textContent = progress + '%';
    }

    function next() {
      if (currentIndex < words.length - 1) {
        currentIndex++;
        updateDisplay();
        return true;
      } else {
        pause();
        return false;
      }
    }

    function prev() {
      if (currentIndex > 0) {
        currentIndex--;
        updateDisplay();
      }
    }

    function play() {
      if (isPlaying) return;
      isPlaying = true;
      playBtn.textContent = '⏸';
      playBtn.setAttribute('aria-label', 'Pause');
      overlay.querySelector('#veloz-reader-word-container').classList.add('playing');
      
      function tick() {
        if (!isPlaying) return;
        const hasMore = next();
        if (hasMore) {
          timer = setTimeout(tick, getDelay());
        }
      }
      
      timer = setTimeout(tick, getDelay());
    }

    function pause() {
      isPlaying = false;
      playBtn.textContent = '▶';
      playBtn.setAttribute('aria-label', 'Wiedergabe');
      overlay.querySelector('#veloz-reader-word-container').classList.remove('playing');
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function toggle() {
      if (isPlaying) pause();
      else play();
    }

    function goToOffset(offset) {
      pause();
      const newIndex = currentIndex + offset;
      if (newIndex >= 0 && newIndex < words.length) {
        currentIndex = newIndex;
        updateDisplay();
      }
    }

    // Expose controls for touch/swipe handling
    window.velozReaderControls = { play, pause, toggle, next, prev, goToOffset, reset: () => {
      pause();
      currentIndex = 0;
      updateDisplay();
    }};

    // Control event listeners
    playBtn.addEventListener('click', toggle);
    overlay.querySelector('#veloz-next').addEventListener('click', () => {
      pause();
      next();
    });
    overlay.querySelector('#veloz-prev').addEventListener('click', () => {
      pause();
      prev();
    });
    overlay.querySelector('#veloz-reset').addEventListener('click', () => {
      pause();
      currentIndex = 0;
      updateDisplay();
    });

    // WPM slider
    wpmSlider.addEventListener('input', () => {
      const wpm = wpmSlider.value;
      wpmValue.textContent = wpm + ' WPM';
      
      // Save to storage
      try {
        chrome.storage.local.set({ wpm: parseInt(wpm) });
      } catch (e) {
        // Ignore storage errors
      }
    });

    // Keyboard controls
    overlay.addEventListener('keydown', (e) => {
      switch(e.key) {
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowRight':
          e.preventDefault();
          pause();
          next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          pause();
          prev();
          break;
        case 'Home':
          e.preventDefault();
          pause();
          currentIndex = 0;
          updateDisplay();
          break;
        case 'End':
          e.preventDefault();
          pause();
          currentIndex = words.length - 1;
          updateDisplay();
          break;
      }
    });

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (words[currentIndex]) {
          adjustFontSize(words[currentIndex]);
        }
      }, 100);
    });
  }

  function closeReader() {
    if (readerOverlay) {
      readerOverlay.classList.add('closing');
      setTimeout(() => {
        readerOverlay.style.display = 'none';
        readerOverlay.classList.remove('closing');
        
        // Clean up controls
        if (window.velozReaderControls) {
          window.velozReaderControls.pause();
          delete window.velozReaderControls;
        }
      }, 200);
    }
  }
})();
