class NameConfigUI {
  constructor() {
    this.names = [];
    this.isVisible = false;
    this.isEnabled = true;
    this.nameContainer = document.getElementById('nameContainer');
    this.addButton = document.getElementById('addName');
    this.saveButton = document.getElementById('saveNames');
    this.toggleButton = document.getElementById('toggleVisibility');
    this.enableToggle = document.getElementById('enableReplacement');
    
    this.init();
  }

  async init() {
    await this.loadNames();
    this.renderNames();
    this.setupEventListeners();
  }

  async loadNames() {
    try {
      const result = await chrome.storage.sync.get(['names', 'enabled']);
      this.names = result.names || [];
      this.isEnabled = result.enabled !== false;
      this.enableToggle.checked = this.isEnabled;
      if (this.names.length === 0) {
        this.addNewName();
      }
    } catch (error) {
      console.error('Failed to load names:', error);
      this.addNewName();
    }
  }

  addNewName() {
    this.names.push({
      id: Date.now(),
      japaneseFirst: '',
      japaneseLast: '',
      romanFirst: '',
      romanLast: ''
    });
  }

  renderNames() {
    this.nameContainer.innerHTML = '';
    
    if (this.names.length === 0) {
      this.nameContainer.innerHTML = '<div class="empty-state">名前が登録されていません</div>';
      return;
    }

    this.names.forEach((nameSet, index) => {
      const nameDiv = document.createElement('div');
      nameDiv.className = 'name-set';
      const inputType = this.isVisible ? 'text' : 'password';
      const displayValue = (value) => {
        if (!value) return '';
        return this.isVisible ? value : '*'.repeat(value.length);
      };
      
      nameDiv.innerHTML = `
        <div class="form-group">
          <label>日本語姓:</label>
          <input type="${inputType}" class="name-input" data-field="japaneseLast" data-index="${index}" value="${this.isVisible ? (nameSet.japaneseLast || '') : (nameSet.japaneseLast ? '***' : '')}" data-real-value="${nameSet.japaneseLast || ''}" placeholder="例: 田中">
        </div>
        <div class="form-group">
          <label>日本語名:</label>
          <input type="${inputType}" class="name-input" data-field="japaneseFirst" data-index="${index}" value="${this.isVisible ? (nameSet.japaneseFirst || '') : (nameSet.japaneseFirst ? '***' : '')}" data-real-value="${nameSet.japaneseFirst || ''}" placeholder="例: 太郎">
        </div>
        <div class="form-group">
          <label>ローマ字姓:</label>
          <input type="${inputType}" class="name-input" data-field="romanLast" data-index="${index}" value="${this.isVisible ? (nameSet.romanLast || '') : (nameSet.romanLast ? '***' : '')}" data-real-value="${nameSet.romanLast || ''}" placeholder="例: Tanaka">
        </div>
        <div class="form-group">
          <label>ローマ字名:</label>
          <input type="${inputType}" class="name-input" data-field="romanFirst" data-index="${index}" value="${this.isVisible ? (nameSet.romanFirst || '') : (nameSet.romanFirst ? '***' : '')}" data-real-value="${nameSet.romanFirst || ''}" placeholder="例: Taro">
        </div>
        <div class="button-group">
          <button class="remove-btn" data-remove="${index}">削除</button>
        </div>
      `;
      this.nameContainer.appendChild(nameDiv);
    });
  }

  setupEventListeners() {
    this.addButton.addEventListener('click', () => {
      this.addNewName();
      this.renderNames();
    });

    this.saveButton.addEventListener('click', () => {
      this.saveNames();
    });

    this.toggleButton.addEventListener('click', () => {
      this.toggleVisibility();
    });

    this.enableToggle.addEventListener('change', () => {
      this.isEnabled = this.enableToggle.checked;
      this.saveSettings();
    });

    this.nameContainer.addEventListener('input', (e) => {
      if (e.target.tagName === 'INPUT') {
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        if (this.isVisible) {
          this.names[index][field] = e.target.value;
          e.target.dataset.realValue = e.target.value;
        } else {
          // 非表示時は実際の値のみ更新し、表示は*のまま
          this.names[index][field] = e.target.dataset.realValue;
        }
      }
    });

    this.nameContainer.addEventListener('focus', (e) => {
      if (e.target.tagName === 'INPUT' && !this.isVisible) {
        // 非表示時はフォーカス時に実際の値を一時的に表示
        const realValue = e.target.dataset.realValue || '';
        e.target.value = realValue;
        e.target.type = 'text';
      }
    });

    this.nameContainer.addEventListener('blur', (e) => {
      if (e.target.tagName === 'INPUT' && !this.isVisible) {
        // 非表示時はフォーカスアウト時に*表示に戻す
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        this.names[index][field] = e.target.value;
        e.target.dataset.realValue = e.target.value;
        e.target.value = e.target.value ? '***' : '';
        e.target.type = 'password';
      }
    });

    this.nameContainer.addEventListener('click', (e) => {
      if (e.target.dataset.remove !== undefined) {
        const index = parseInt(e.target.dataset.remove);
        this.names.splice(index, 1);
        this.renderNames();
      }
    });
  }

  async saveNames() {
    const validNames = this.names.filter(nameSet => 
      nameSet.japaneseFirst || nameSet.japaneseLast || nameSet.romanFirst || nameSet.romanLast
    );

    try {
      await chrome.storage.sync.set({ 
        names: validNames,
        enabled: this.isEnabled
      });
      this.showSaveMessage();
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    } catch (error) {
      console.error('Failed to save names:', error);
      alert('設定の保存に失敗しました');
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ enabled: this.isEnabled });
      
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        chrome.tabs.reload(tabs[0].id);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.toggleButton.textContent = this.isVisible ? '🙈 非表示' : '👁️ 表示';
    this.renderNames();
  }

  showSaveMessage() {
    const originalText = this.saveButton.textContent;
    this.saveButton.textContent = '保存しました！';
    this.saveButton.style.background = '#4CAF50';
    
    setTimeout(() => {
      this.saveButton.textContent = originalText;
      this.saveButton.style.background = '#2196F3';
    }, 1500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new NameConfigUI();
});