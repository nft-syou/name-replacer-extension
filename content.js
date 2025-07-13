class NameReplacer {
  constructor() {
    this.names = [];
    this.isEnabled = true;
    this.isReady = false;
    this.init();
  }

  async init() {
    if (document.body) {
      document.body.classList.add('name-replacer-loading');
    }
    
    await this.loadNames();
    
    if (this.isEnabled) {
      this.immediateReplace();
    }
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.processPage();
      });
    } else {
      this.processPage();
    }
  }

  immediateReplace() {
    if (!this.isEnabled || this.names.length === 0) return;
    
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      this.replaceInElement(element);
    });
  }

  processPage() {
    this.replaceNames();
    this.observeChanges();
    
    if (document.body) {
      document.body.classList.remove('name-replacer-loading');
      document.body.classList.add('name-replacer-ready');
    }
    document.documentElement.classList.add('name-replacer-ready');
    this.isReady = true;
  }

  async loadNames() {
    try {
      const result = await chrome.storage.sync.get(['names', 'enabled']);
      this.names = result.names || [];
      this.isEnabled = result.enabled !== false;
    } catch (error) {
      console.error('Failed to load names:', error);
    }
  }

  replaceNames() {
    if (!this.isEnabled || this.names.length === 0) return;

    const walker = document.createTreeWalker(
      document.body || document,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    textNodes.forEach(textNode => {
      this.replaceInTextNode(textNode);
    });
  }

  replaceInTextNode(textNode) {
    let text = textNode.textContent;
    let modified = false;

    this.names.forEach(nameSet => {
      if (nameSet.japaneseFirst && text.includes(nameSet.japaneseFirst)) {
        text = text.replace(new RegExp(nameSet.japaneseFirst, 'g'), '***');
        modified = true;
      }
      if (nameSet.japaneseLast && text.includes(nameSet.japaneseLast)) {
        text = text.replace(new RegExp(nameSet.japaneseLast, 'g'), '***');
        modified = true;
      }
      if (nameSet.romanFirst && text.toLowerCase().includes(nameSet.romanFirst.toLowerCase())) {
        text = text.replace(new RegExp(nameSet.romanFirst, 'gi'), '***');
        modified = true;
      }
      if (nameSet.romanLast && text.toLowerCase().includes(nameSet.romanLast.toLowerCase())) {
        text = text.replace(new RegExp(nameSet.romanLast, 'gi'), '***');
        modified = true;
      }
    });

    if (modified) {
      textNode.textContent = text;
    }
  }

  replaceInElement(element) {
    if (element.nodeType === Node.TEXT_NODE) {
      this.replaceInTextNode(element);
    } else if (element.nodeType === Node.ELEMENT_NODE) {
      for (let child of element.childNodes) {
        this.replaceInElement(child);
      }
    }
  }

  observeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (let node of mutation.addedNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
              this.replaceInTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              this.replaceInElement(node);
            }
          }
        } else if (mutation.type === 'characterData') {
          this.replaceInTextNode(mutation.target);
        }
      });
    });

    observer.observe(document.body || document, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

let nameReplacer = null;

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && (changes.names || changes.enabled)) {
    if (nameReplacer) {
      if (changes.names) {
        nameReplacer.names = changes.names.newValue || [];
      }
      if (changes.enabled !== undefined) {
        nameReplacer.isEnabled = changes.enabled.newValue !== false;
      }
      nameReplacer.replaceNames();
    }
  }
});

if (document.body) {
  nameReplacer = new NameReplacer();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    nameReplacer = new NameReplacer();
  });
}