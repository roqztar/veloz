// Veloz Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const wpmSlider = document.getElementById('wpm-slider');
  const wpmDisplay = document.getElementById('wpm-display');
  const readSelectionBtn = document.getElementById('read-selection');
  const pasteTextBtn = document.getElementById('paste-text');
  const directTextInput = document.getElementById('direct-text');
  const readDirectBtn = document.getElementById('read-direct');

  // Update slider progress background
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

  // Save WPM on change
  wpmSlider.addEventListener('input', () => {
    const wpm = wpmSlider.value;
    wpmDisplay.textContent = wpm + ' WPM';
    updateSliderProgress();
    chrome.storage.local.set({ wpm: parseInt(wpm) });
  });

  // Initialize slider progress
  updateSliderProgress();

  // Helper: Get active tab
  async function getActiveTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  // Helper: Send text to content script
  async function sendTextToReader(text) {
    if (!text || !text.trim()) {
      throw new Error('Kein Text vorhanden');
    }

    const tab = await getActiveTab();
    
    // Check if it's a restricted URL
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
        tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      throw new Error('Auf diese Seite kann nicht zugegriffen werden. Bitte öffne eine normale Website.');
    }

    try {
      // Try to send message directly
      await chrome.tabs.sendMessage(tab.id, {
        action: 'readText',
        text: text
      });
      window.close();
    } catch (error) {
      // Content script not loaded, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        
        // Wait a moment for script to initialize
        setTimeout(async () => {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              action: 'readText',
              text: text
            });
            window.close();
          } catch (e) {
            alert('Konnte Reader nicht starten. Bitte lade die Seite neu und versuche es erneut.');
          }
        }, 200);
      } catch (injectError) {
        throw new Error('Konnte nicht auf die Seite zugreifen. Manche Seiten (z.B. Chrome-Einstellungen) sind aus Sicherheitsgründen geschützt.');
      }
    }
  }

  // Read direct text input
  readDirectBtn.addEventListener('click', async () => {
    const text = directTextInput.value;
    const originalText = readDirectBtn.innerHTML;
    
    if (!text.trim()) {
      showError(readDirectBtn, '⚠️ Bitte Text eingeben');
      setTimeout(() => {
        readDirectBtn.innerHTML = originalText;
        readDirectBtn.style.background = '';
        readDirectBtn.style.borderColor = '';
        readDirectBtn.style.color = '';
      }, 2000);
      return;
    }

    readDirectBtn.innerHTML = '<span class="btn-icon">⏳</span><span>Starte...</span>';
    readDirectBtn.disabled = true;

    try {
      await sendTextToReader(text);
    } catch (error) {
      showError(readDirectBtn, '⚠️ ' + error.message);
      setTimeout(() => {
        readDirectBtn.innerHTML = originalText;
        readDirectBtn.disabled = false;
        readDirectBtn.style.background = '';
        readDirectBtn.style.borderColor = '';
        readDirectBtn.style.color = '';
      }, 3000);
    }
  });

  // Read selected text
  readSelectionBtn.addEventListener('click', async () => {
    const originalText = readSelectionBtn.innerHTML;
    readSelectionBtn.innerHTML = '<span class="btn-icon">⏳</span><span>Lade...</span>';
    readSelectionBtn.disabled = true;
    
    try {
      const tab = await getActiveTab();
      
      // Check restricted URLs
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
          tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
        throw new Error('Auf diese Seite kann nicht zugegriffen werden');
      }

      // Try to get selection from content script
      let response;
      try {
        response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
      } catch (e) {
        // Content script not loaded, inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        
        // Try again after injection
        await new Promise(resolve => setTimeout(resolve, 200));
        response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
      }
      
      if (response && response.text && response.text.trim()) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'readText',
          text: response.text
        });
        window.close();
      } else {
        throw new Error('Kein Text ausgewählt. Markiere zuerst Text auf der Seite.');
      }
    } catch (error) {
      showError(readSelectionBtn, '⚠️ ' + error.message);
      setTimeout(() => {
        readSelectionBtn.innerHTML = originalText;
        readSelectionBtn.disabled = false;
      }, 2500);
    }
  });

  // Paste from clipboard
  pasteTextBtn.addEventListener('click', async () => {
    const originalText = pasteTextBtn.innerHTML;
    
    try {
      // Try modern clipboard API first
      let text = '';
      
      if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      } else {
        // Fallback: focus textarea and let user paste manually
        directTextInput.focus();
        showError(pasteTextBtn, '⚠️ Strg+V zum Einfügen');
        setTimeout(() => {
          pasteTextBtn.innerHTML = originalText;
        }, 2000);
        return;
      }
      
      if (text && text.trim()) {
        // Insert into textarea
        const currentValue = directTextInput.value;
        const cursorPos = directTextInput.selectionStart;
        directTextInput.value = currentValue.slice(0, cursorPos) + text + currentValue.slice(cursorPos);
        
        // Visual feedback
        pasteTextBtn.innerHTML = '<span class="btn-icon">✓</span><span>Eingefügt</span>';
        pasteTextBtn.style.background = 'rgba(34, 197, 94, 0.2)';
        pasteTextBtn.style.color = '#22c55e';
        
        setTimeout(() => {
          pasteTextBtn.innerHTML = originalText;
          pasteTextBtn.style.background = '';
          pasteTextBtn.style.color = '';
        }, 1500);
      } else {
        throw new Error('Zwischenablage ist leer');
      }
    } catch (error) {
      showError(pasteTextBtn, '⚠️ ' + error.message);
      setTimeout(() => {
        pasteTextBtn.innerHTML = originalText;
      }, 2000);
    }
  });

  // Auto-paste if user presses Ctrl+V in popup
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      // Let the default paste happen in the textarea if focused
      if (document.activeElement !== directTextInput) {
        directTextInput.focus();
      }
    }
  });

  function showError(button, message) {
    button.innerHTML = `<span>${message}</span>`;
    button.style.background = 'rgba(239, 68, 68, 0.2)';
    button.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    button.style.color = '#ef4444';
  }
});
