// Popup script

document.addEventListener('DOMContentLoaded', () => {
  const wpmSlider = document.getElementById('wpm-slider');
  const wpmDisplay = document.getElementById('wpm-display');
  const readSelectionBtn = document.getElementById('read-selection');
  const pasteTextBtn = document.getElementById('paste-text');

  // Load saved WPM
  chrome.storage.local.get(['wpm'], (result) => {
    if (result.wpm) {
      wpmSlider.value = result.wpm;
      wpmDisplay.textContent = result.wpm + ' WPM';
    }
  });

  // Save WPM on change
  wpmSlider.addEventListener('input', () => {
    const wpm = wpmSlider.value;
    wpmDisplay.textContent = wpm + ' WPM';
    chrome.storage.local.set({ wpm: parseInt(wpm) });
  });

  // Read selected text
  readSelectionBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
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
        readSelectionBtn.textContent = '⚠️ No text selected';
        setTimeout(() => {
          readSelectionBtn.innerHTML = '<span>▶</span> Read Selected Text';
        }, 2000);
      }
    } catch (error) {
      // Content script not loaded, inject it
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      
      readSelectionBtn.textContent = '🔄 Refresh and try again';
      setTimeout(() => {
        readSelectionBtn.innerHTML = '<span>▶</span> Read Selected Text';
      }, 2000);
    }
  });

  // Paste and read
  pasteTextBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'readText',
            text: text
          });
        } catch {
          // Inject content script first
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/content.js']
          });
          
          setTimeout(async () => {
            await chrome.tabs.sendMessage(tab.id, {
              action: 'readText',
              text: text
            });
          }, 100);
        }
        
        window.close();
      } else {
        pasteTextBtn.textContent = '⚠️ Clipboard empty';
        setTimeout(() => {
          pasteTextBtn.innerHTML = '<span>📋</span> Paste & Read';
        }, 2000);
      }
    } catch (error) {
      pasteTextBtn.textContent = '⚠️ No clipboard access';
      setTimeout(() => {
        pasteTextBtn.innerHTML = '<span>📋</span> Paste & Read';
      }, 2000);
    }
  });
});
