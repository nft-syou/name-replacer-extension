chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['names', 'enabled'], (result) => {
    const updates = {};
    if (!result.names) {
      updates.names = [];
    }
    if (result.enabled === undefined) {
      updates.enabled = true;
    }
    if (Object.keys(updates).length > 0) {
      chrome.storage.sync.set(updates);
    }
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});