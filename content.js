class NameReplacer {
  constructor() {
    this.names = [];
    this.isEnabled = true;
    this.isReady = false;
    console.log('🔧 Name Replacer: Constructor called, document.readyState:', document.readyState);
    console.log('🔧 Name Replacer: document.body exists:', !!document.body);
    this.init();
  }

  async init() {
    console.log('🚀 Name Replacer: init() called');
    // フォーカス問題を回避するため、非同期で処理を開始
    await this.safeInit();
  }

  async safeInit() {
    console.log('⚙️ Name Replacer: safeInit() started');
    try {
      if (document.body) {
        document.body.classList.add('name-replacer-loading');
        console.log('✅ Name Replacer: Added loading class to body');
      } else {
        console.log('⚠️ Name Replacer: document.body not available');
      }
      
      console.log('📥 Name Replacer: Loading names...');
      await this.loadNames();
      console.log('📦 Name Replacer: Names loaded. isEnabled:', this.isEnabled, 'names count:', this.names.length);
      
      // 機能が無効の場合は即座に表示
      if (!this.isEnabled) {
        console.log('🔴 Name Replacer: Feature disabled, showing page immediately');
        this.showPageImmediately();
        return;
      }
      
      // 名前が設定されていない場合も即座に表示
      if (!this.names || this.names.length === 0) {
        console.log('📝 Name Replacer: No names configured, showing page immediately');
        this.showPageImmediately();
        return;
      }
      
      console.log('⏳ Name Replacer: Waiting for stable DOM...');
      // フォーカスが安定してから処理を実行
      await this.waitForStableDOM();
      console.log('🔄 Name Replacer: Starting immediate replacement...');
      this.immediateReplace();
      
      if (document.readyState === 'loading') {
        console.log('⏳ Name Replacer: DOM still loading, waiting for DOMContentLoaded');
        document.addEventListener('DOMContentLoaded', () => {
          console.log('📄 Name Replacer: DOMContentLoaded fired, processing page');
          this.processPage();
        });
      } else {
        console.log('✅ Name Replacer: DOM ready, processing page in 50ms');
        // 少し遅延させてフォーカス処理を回避
        setTimeout(() => this.processPage(), 50);
      }
    } catch (error) {
      console.error('❌ Name Replacer: Initialization error:', error);
      // エラー時は即座に表示
      this.showPageImmediately();
    }
  }

  showPageImmediately() {
    if (document.body) {
      document.body.classList.remove('name-replacer-loading');
      document.body.classList.add('name-replacer-ready');
    }
    document.documentElement.classList.add('name-replacer-ready');
    this.isReady = true;
    console.log('Name Replacer: Page shown immediately');
  }

  async waitForStableDOM() {
    // DOM安定まで少し待機
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        const checkStable = () => {
          if (document.readyState === 'complete' || document.readyState === 'interactive') {
            resolve();
          } else {
            setTimeout(checkStable, 10);
          }
        };
        checkStable();
      }
    });
  }

  immediateReplace() {
    if (!this.isEnabled || this.names.length === 0) return;
    
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
      this.replaceInElement(element);
    });
  }

  processPage() {
    console.log('🎯 Name Replacer: processPage() called');
    try {
      console.log('🔄 Name Replacer: Starting name replacement...');
      this.replaceNames();
      console.log('👀 Name Replacer: Setting up change observer...');
      this.observeChanges();
      
      // フォーカス状態を保存
      const activeElement = document.activeElement;
      console.log('🎯 Name Replacer: Active element:', activeElement?.tagName || 'none');
      
      if (document.body) {
        document.body.classList.remove('name-replacer-loading');
        document.body.classList.add('name-replacer-ready');
        console.log('✅ Name Replacer: Updated body classes');
      }
      document.documentElement.classList.add('name-replacer-ready');
      console.log('✅ Name Replacer: Added name-replacer-ready to html');
      
      // 確実に表示されるよう追加チェック
      setTimeout(() => {
        if (document.documentElement.classList.contains('name-replacer-ready')) {
          const computedStyle = window.getComputedStyle(document.documentElement);
          console.log('🔍 Name Replacer: Checking visibility after 100ms:', computedStyle.visibility);
          if (computedStyle.visibility === 'hidden') {
            console.log('🚨 Name Replacer: Still hidden! Forcing visibility...');
            document.documentElement.style.setProperty('visibility', 'visible', 'important');
          }
        }
      }, 100);
      
      // フォーカスを復元（autofocus競合を防ぐ）
      if (activeElement && activeElement !== document.body && activeElement !== document.documentElement) {
        try {
          activeElement.focus();
          console.log('🎯 Name Replacer: Focus restored to:', activeElement.tagName);
        } catch (e) {
          console.log('⚠️ Name Replacer: Focus restoration failed:', e.message);
        }
      }
      
      this.isReady = true;
      console.log('🎉 Name Replacer: processPage() completed successfully');
    } catch (error) {
      console.error('❌ Name Replacer: Processing error:', error);
      // エラー時でも表示を戻す
      this.forceShowPage();
    }
  }

  forceShowPage() {
    try {
      if (document.body) {
        document.body.classList.remove('name-replacer-loading');
        document.body.classList.add('name-replacer-ready');
      }
      document.documentElement.classList.add('name-replacer-ready');
      this.isReady = true;
    } catch (e) {
      // 最終手段として強制表示
      document.documentElement.style.visibility = 'visible !important';
      document.documentElement.style.setProperty('visibility', 'visible', 'important');
    }
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

// 遅延初期化でautofocus競合を回避
const initializeReplacer = () => {
  if (!nameReplacer) {
    console.log('🔧 Name Replacer: Initializing replacer...');
    nameReplacer = new NameReplacer();
  } else {
    console.log('⚠️ Name Replacer: Replacer already exists');
  }
};

console.log('🌐 Name Replacer: Script loaded, document.body exists:', !!document.body);

if (document.body) {
  console.log('⏰ Name Replacer: DOM ready, initializing in 10ms...');
  // 既にDOM準備済みの場合は少し遅延
  setTimeout(initializeReplacer, 10);
} else {
  console.log('⏳ Name Replacer: Waiting for DOMContentLoaded...');
  // DOMContentLoaded待ち
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Name Replacer: DOMContentLoaded received, initializing in 10ms...');
    setTimeout(initializeReplacer, 10);
  });
}

// フォールバック: 一定時間後に強制初期化
setTimeout(() => {
  if (!nameReplacer) {
    console.warn('🔄 Name Replacer: Fallback initialization (500ms)');
    nameReplacer = new NameReplacer();
  }
}, 500);

// 緊急フォールバック: htmlが隠蔽されたままの場合は強制表示
setTimeout(() => {
  if (!document.documentElement.classList.contains('name-replacer-ready')) {
    console.error('🚨 Name Replacer: Emergency fallback - forcing page visibility (1000ms)');
    console.log('🚨 Current html classes:', document.documentElement.className);
    document.documentElement.classList.add('name-replacer-ready');
    document.documentElement.style.setProperty('visibility', 'visible', 'important');
  } else {
    console.log('✅ Name Replacer: Page is ready after 1000ms');
  }
}, 1000);

// SPA対応: pushStateとpopstateの監視
const handleSPANavigation = () => {
  console.log('🔄 Name Replacer: SPA navigation detected');
  
  // 即座に表示を強制（隠蔽を解除）
  document.documentElement.classList.remove('name-replacer-ready');
  document.documentElement.classList.add('name-replacer-skip');
  document.documentElement.style.setProperty('visibility', 'visible', 'important');
  
  console.log('✅ Name Replacer: Forced visibility for SPA navigation');
  
  // 新しいコンテンツの置換を実行
  if (nameReplacer && nameReplacer.isEnabled && nameReplacer.names.length > 0) {
    console.log('🔄 Name Replacer: Re-processing page after navigation');
    setTimeout(() => {
      // skipクラスを削除してready状態に戻す
      document.documentElement.classList.remove('name-replacer-skip');
      document.documentElement.classList.add('name-replacer-ready');
      nameReplacer.replaceNames();
    }, 50);
  } else {
    // 名前置換不要の場合はskip状態を維持
    console.log('📝 Name Replacer: No replacement needed, keeping skip state');
  }
};

// pushState/replaceStateの監視
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  console.log('📍 Name Replacer: pushState detected');
  originalPushState.apply(history, args);
  setTimeout(handleSPANavigation, 50);
};

history.replaceState = function(...args) {
  console.log('📍 Name Replacer: replaceState detected');
  originalReplaceState.apply(history, args);
  setTimeout(handleSPANavigation, 50);
};

// popstateイベントの監視（戻る/進むボタン）
window.addEventListener('popstate', () => {
  console.log('🔙 Name Replacer: popstate detected');
  setTimeout(handleSPANavigation, 50);
});

// DOMの大幅変更を監視（GitHubのコンテンツ更新）
const observePageChanges = () => {
  const observer = new MutationObserver((mutations) => {
    let hasSignificantChange = false;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && 
              (node.id === 'repo-content-pjax-container' || 
               node.id === 'js-repo-pjax-container' ||
               node.classList?.contains('application-main') ||
               node.classList?.contains('js-repo-pjax-container') ||
               node.classList?.contains('container-lg') ||
               node.tagName === 'MAIN')) {
            hasSignificantChange = true;
            console.log('🔍 Name Replacer: Detected significant DOM change:', node.tagName, node.id, node.className);
            break;
          }
        }
      }
    });
    
    if (hasSignificantChange) {
      console.log('🔄 Name Replacer: Major DOM change detected');
      setTimeout(handleSPANavigation, 50);
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
};

// URL変更の直接監視
let currentURL = window.location.href;
const checkURLChange = () => {
  if (window.location.href !== currentURL) {
    console.log('🌐 Name Replacer: URL changed from', currentURL, 'to', window.location.href);
    currentURL = window.location.href;
    handleSPANavigation();
  }
};

// 定期的なURL変更チェック
setInterval(checkURLChange, 250);

// ページ変更監視を開始
if (document.body) {
  observePageChanges();
} else {
  document.addEventListener('DOMContentLoaded', observePageChanges);
}