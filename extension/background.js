// Background Service Worker for Manifest V3

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'spritz-read-selection',
    title: 'Speed Read Selection',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'spritz-read-selection' && info.selectionText) {
    // Send message to content script to start reading
    chrome.tabs.sendMessage(tab.id, {
      action: 'readText',
      text: info.selectionText
    }).catch(() => {
      // Content script not loaded, inject it first
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      }).then(() => {
        // Wait a bit for script to initialize
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'readText',
            text: info.selectionText
          });
        }, 100);
      });
    });
  }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'spritz-selection') {
    // Get selected text from active tab
    chrome.tabs.sendMessage(tab.id, { action: 'getSelection' })
      .then(response => {
        if (response && response.text) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'readText',
            text: response.text
          });
        }
      })
      .catch(() => {
        // Content script not ready
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/content.js']
        }).then(() => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, { action: 'getSelection' })
              .then(response => {
                if (response && response.text) {
                  chrome.tabs.sendMessage(tab.id, {
                    action: 'readText',
                    text: response.text
                  });
                }
              });
          }, 100);
        });
      });
  }
});

// Store WPM setting
chrome.storage.local.get(['wpm'], (result) => {
  if (!result.wpm) {
    chrome.storage.local.set({ wpm: 300 });
  }
});
