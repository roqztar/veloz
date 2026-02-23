// Content Script - Injected into all pages
// Allows selecting text and speed-reading it

(function() {
  'use strict';

  // Prevent double injection
  if (window.spritzReaderInjected) return;
  window.spritzReaderInjected = true;

  // Create the reader overlay
  let readerOverlay = null;
  let isReading = false;

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
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
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

  function createReaderOverlay() {
    if (readerOverlay) return readerOverlay;

    const overlay = document.createElement('div');
    overlay.id = 'spritz-reader-overlay';
    overlay.innerHTML = `
      <div id="spritz-reader-container">
        <div id="spritz-reader-header">
          <span id="spritz-reader-progress">0%</span>
          <button id="spritz-reader-close">×</button>
        </div>
        <div id="spritz-reader-word-container">
          <div id="spritz-reader-word">
            <span id="spritz-left"></span>
            <span id="spritz-orp"></span>
            <span id="spritz-right"></span>
          </div>
          <div id="spritz-reader-marker"></div>
        </div>
        <div id="spritz-reader-controls">
          <button id="spritz-prev">‹</button>
          <button id="spritz-play">▶</button>
          <button id="spritz-next">›</button>
        </div>
        <div id="spritz-reader-wpm">
          <input type="range" id="spritz-wpm-slider" min="200" max="1000" value="300" step="10">
          <span id="spritz-wpm-value">300 WPM</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    readerOverlay = overlay;

    // Event listeners
    overlay.querySelector('#spritz-reader-close').addEventListener('click', closeReader);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeReader();
    });

    return overlay;
  }

  function startReading(text) {
    if (!text || text.trim().length === 0) return;

    const overlay = createReaderOverlay();
    overlay.style.display = 'flex';
    
    // Parse words
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 0) return;

    // Store reading state
    overlay.dataset.words = JSON.stringify(words);
    overlay.dataset.currentIndex = '0';
    overlay.dataset.isPlaying = 'false';

    // Display first word
    displayWord(words[0]);

    // Setup controls
    setupControls(words);
  }

  function displayWord(word) {
    const overlay = readerOverlay;
    if (!overlay || !word) return;

    // Calculate ORP
    const orpIndex = Math.min(
      word.length <= 1 ? 0 :
      word.length <= 5 ? 1 :
      word.length <= 9 ? 2 : 3,
      word.length - 1
    );

    const left = word.slice(0, orpIndex);
    const orp = word[orpIndex] || '';
    const right = word.slice(orpIndex + 1);

    overlay.querySelector('#spritz-left').textContent = left;
    overlay.querySelector('#spritz-orp').textContent = orp;
    overlay.querySelector('#spritz-right').textContent = right;

    // Calculate dynamic font size
    adjustFontSize(word);
  }

  function adjustFontSize(word) {
    const container = readerOverlay.querySelector('#spritz-reader-word');
    const maxWidth = window.innerWidth * 0.8;
    
    // Start with large font
    let fontSize = 80;
    container.style.fontSize = fontSize + 'px';
    
    // Reduce until it fits
    while (container.scrollWidth > maxWidth && fontSize > 20) {
      fontSize -= 4;
      container.style.fontSize = fontSize + 'px';
    }
  }

  function setupControls(words) {
    const overlay = readerOverlay;
    let currentIndex = 0;
    let isPlaying = false;
    let timer = null;

    const wpmSlider = overlay.querySelector('#spritz-wpm-slider');
    const wpmValue = overlay.querySelector('#spritz-wpm-value');
    const playBtn = overlay.querySelector('#spritz-play');
    const progressSpan = overlay.querySelector('#spritz-reader-progress');

    function getDelay() {
      const wpm = parseInt(wpmSlider.value);
      let delay = (60 / wpm) * 1000;
      
      // Adjust for word length and punctuation
      const word = words[currentIndex];
      if (word.length > 12) delay *= 1.6;
      else if (word.length > 9) delay *= 1.4;
      else if (word.length > 6) delay *= 1.2;
      
      if (/[.!?]$/.test(word)) delay *= 2;
      else if (/,;:]/.test(word)) delay *= 1.3;
      
      return delay;
    }

    function updateDisplay() {
      displayWord(words[currentIndex]);
      const progress = Math.round((currentIndex / words.length) * 100);
      progressSpan.textContent = progress + '%';
    }

    function next() {
      if (currentIndex < words.length - 1) {
        currentIndex++;
        updateDisplay();
      } else {
        pause();
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
      
      function tick() {
        if (!isPlaying) return;
        next();
        if (currentIndex < words.length - 1) {
          timer = setTimeout(tick, getDelay());
        }
      }
      
      timer = setTimeout(tick, getDelay());
    }

    function pause() {
      isPlaying = false;
      playBtn.textContent = '▶';
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function toggle() {
      if (isPlaying) pause();
      else play();
    }

    // Control event listeners
    playBtn.addEventListener('click', toggle);
    overlay.querySelector('#spritz-next').addEventListener('click', () => {
      pause();
      next();
    });
    overlay.querySelector('#spritz-prev').addEventListener('click', () => {
      pause();
      prev();
    });

    wpmSlider.addEventListener('input', () => {
      wpmValue.textContent = wpmSlider.value + ' WPM';
    });

    // Keyboard controls
    overlay.addEventListener('keydown', (e) => {
      switch(e.key) {
        case ' ':
          e.preventDefault();
          toggle();
          break;
        case 'ArrowRight':
          next();
          break;
        case 'ArrowLeft':
          prev();
          break;
      }
    });

    overlay.tabIndex = 0;
    overlay.focus();
  }

  function closeReader() {
    if (readerOverlay) {
      readerOverlay.style.display = 'none';
    }
  }
})();
