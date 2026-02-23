// Veloz Popup Script - Simplified & Fixed

document.addEventListener('DOMContentLoaded', () => {
  const wpmSlider = document.getElementById('wpm-slider');
  const wpmDisplay = document.getElementById('wpm-display');
  const readSelectionBtn = document.getElementById('read-selection');
  const pasteTextBtn = document.getElementById('paste-text');
  const directTextInput = document.getElementById('direct-text');
  const readDirectBtn = document.getElementById('read-direct');
  const clearTextBtn = document.getElementById('clear-text');

  // Store original button HTML
  const originalReadDirect = readDirectBtn.innerHTML;
  const originalReadSelection = readSelectionBtn.innerHTML;
  const originalPaste = pasteTextBtn.innerHTML;

  // Update slider progress
  function updateSliderProgress() {
    const min = parseInt(wpmSlider.min);
    const max = parseInt(wpmSlider.max);
    const value = parseInt(wpmSlider.value);
    const progress = ((value - min) / (max - min)) * 100;
    wpmSlider.style.setProperty('--progress', progress + '%');
  }

  // Load saved WPM
  chrome.storage.local.get(['wpm'], (result) => {
    if (result.wpm && typeof result.wpm === 'number') {
      wpmSlider.value = result.wpm;
      wpmDisplay.textContent = result.wpm + ' WPM';
      updateSliderProgress();
    }
  });

  // Save WPM
  wpmSlider.addEventListener('input', () => {
    const wpm = parseInt(wpmSlider.value);
    wpmDisplay.textContent = wpm + ' WPM';
    updateSliderProgress();
    chrome.storage.local.set({ wpm });
  });

  updateSliderProgress();

  // Helper: Get active tab
  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  // Helper: Check if URL is accessible
  function isAccessibleUrl(url) {
    return !url.startsWith('chrome://') && 
           !url.startsWith('edge://') && 
           !url.startsWith('about:') && 
           !url.startsWith('chrome-extension://') &&
           !url.startsWith('file://');
  }

  // Helper: Show error on button temporarily
  function showButtonError(button, message, originalHtml, duration = 2500) {
    button.innerHTML = `<span>${message}</span>`;
    button.disabled = true;
    setTimeout(() => {
      button.innerHTML = originalHtml;
      button.disabled = false;
    }, duration);
  }

  // Helper: Send text to reader
  async function sendTextToReader(text) {
    const tab = await getActiveTab();
    
    if (!isAccessibleUrl(tab.url)) {
      throw new Error('Auf diese Seite kann nicht zugegriffen werden');
    }

    // Save WPM first
    const wpm = parseInt(wpmSlider.value);
    await chrome.storage.local.set({ wpm });

    try {
      // Try direct message
      await chrome.tabs.sendMessage(tab.id, { action: 'readText', text });
    } catch {
      // Inject content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      
      // Wait and retry
      await new Promise(r => setTimeout(r, 300));
      await chrome.tabs.sendMessage(tab.id, { action: 'readText', text });
    }
    
    window.close();
  }

  // Read direct text
  readDirectBtn.addEventListener('click', async () => {
    const text = directTextInput.value.trim();
    
    if (!text) {
      directTextInput.focus();
      directTextInput.style.borderColor = '#ef4444';
      setTimeout(() => {
        directTextInput.style.borderColor = '';
      }, 1500);
      return;
    }

    readDirectBtn.disabled = true;
    readDirectBtn.innerHTML = '<span>Starte...</span>';

    try {
      await sendTextToReader(text);
    } catch (err) {
      showButtonError(readDirectBtn, 'Fehler: ' + err.message, originalReadDirect, 3000);
    }
  });

  // Read selected text
  readSelectionBtn.addEventListener('click', async () => {
    readSelectionBtn.disabled = true;
    readSelectionBtn.innerHTML = '<span>Lese...</span>';

    try {
      const tab = await getActiveTab();
      
      if (!isAccessibleUrl(tab.url)) {
        throw new Error('Seite nicht zugänglich');
      }

      let response;
      
      try {
        response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
      } catch {
        // Inject and retry
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        await new Promise(r => setTimeout(r, 300));
        response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
      }

      if (response?.text?.trim()) {
        await sendTextToReader(response.text);
      } else {
        throw new Error('Kein Text ausgewählt');
      }
    } catch (err) {
      showButtonError(readSelectionBtn, err.message, originalReadSelection);
    }
  });

  // Paste from clipboard - einfacher: direkt einlesen und ins Textfeld einfügen
  pasteTextBtn.addEventListener('click', async () => {
    pasteTextBtn.disabled = true;
    pasteTextBtn.innerHTML = '<span>Füge ein...</span>';

    try {
      // Use execCommand as fallback for clipboard
      directTextInput.focus();
      
      // Try navigator.clipboard first
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text?.trim()) {
          directTextInput.value = text.trim();
          pasteTextBtn.innerHTML = '<span>✓ Eingefügt</span>';
          setTimeout(() => {
            pasteTextBtn.innerHTML = originalPaste;
            pasteTextBtn.disabled = false;
          }, 1000);
        } else {
          throw new Error('Zwischenablage leer');
        }
      } else {
        // Fallback: tell user to use Ctrl+V
        directTextInput.placeholder = 'Strg+V zum Einfügen...';
        directTextInput.focus();
        throw new Error('Strg+V zum Einfügen');
      }
    } catch (err) {
      showButtonError(pasteTextBtn, err.message, originalPaste);
    }
  });

  // Clear text button
  clearTextBtn.addEventListener('click', () => {
    directTextInput.value = '';
    directTextInput.focus();
  });

  // Allow Ctrl+Enter to read
  directTextInput.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      readDirectBtn.click();
    }
  });
});
