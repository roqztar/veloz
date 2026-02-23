// Veloz Popup Script

document.addEventListener('DOMContentLoaded', () => {
  const wpmSlider = document.getElementById('wpm-slider');
  const wpmDisplay = document.getElementById('wpm-display');
  const readSelectionBtn = document.getElementById('read-selection');
  const pasteTextBtn = document.getElementById('paste-text');

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

  // Read selected text
  readSelectionBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Show loading state
    const originalText = readSelectionBtn.innerHTML;
    readSelectionBtn.innerHTML = '<span class="btn-icon">⏳</span><span>Lade...</span>';
    readSelectionBtn.disabled = true;
    
    try {
      // Try to get selection from content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getSelection' });
      
      if (response && response.text && response.text.trim()) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'readText',
          text: response.text
        });
        window.close();
      } else {
        showError(readSelectionBtn, '⚠️ Kein Text ausgewählt');
        setTimeout(() => {
          readSelectionBtn.innerHTML = originalText;
          readSelectionBtn.disabled = false;
        }, 2000);
      }
    } catch (error) {
      // Content script not loaded, inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        });
        
        showError(readSelectionBtn, '🔄 Seite neu laden und erneut versuchen');
        setTimeout(() => {
          readSelectionBtn.innerHTML = originalText;
          readSelectionBtn.disabled = false;
        }, 2500);
      } catch (injectError) {
        showError(readSelectionBtn, '⚠️ Kann nicht auf Seite zugreifen');
        setTimeout(() => {
          readSelectionBtn.innerHTML = originalText;
          readSelectionBtn.disabled = false;
        }, 2000);
      }
    }
  });

  // Paste and read
  pasteTextBtn.addEventListener('click', async () => {
    const originalText = pasteTextBtn.innerHTML;
    
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'readText',
            text: text
          });
          window.close();
        } catch (msgError) {
          // Inject content script first
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/content.js']
          });
          
          setTimeout(async () => {
            try {
              await chrome.tabs.sendMessage(tab.id, {
                action: 'readText',
                text: text
              });
              window.close();
            } catch (e) {
              showError(pasteTextBtn, '🔄 Bitte erneut versuchen');
              setTimeout(() => {
                pasteTextBtn.innerHTML = originalText;
              }, 2000);
            }
          }, 150);
        }
      } else {
        showError(pasteTextBtn, '⚠️ Zwischenablage leer');
        setTimeout(() => {
          pasteTextBtn.innerHTML = originalText;
        }, 2000);
      }
    } catch (error) {
      showError(pasteTextBtn, '⚠️ Kein Zugriff auf Zwischenablage');
      setTimeout(() => {
        pasteTextBtn.innerHTML = originalText;
      }, 2000);
    }
  });

  function showError(button, message) {
    button.innerHTML = `<span class="btn-icon">${message.charAt(0)}</span><span>${message.slice(3)}</span>`;
    button.style.background = 'rgba(239, 68, 68, 0.2)';
    button.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    button.style.color = '#ef4444';
  }
});
