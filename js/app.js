// 主應用邏輯
class TranslatorApp {
    constructor() {
        this.firebase = null;
        this.storage = null;
        this.translator = null;
        this.currentTab = 'translator';
        this.editingId = null;
        this.editingType = null;
        this.isSyncing = false;
        this.lastTranslation = null; // 保存最後一次翻譯結果
        this.init();
    }

    async init() {
        // 初始化 Firebase（如果可用）
        if (typeof FirebaseManager !== 'undefined') {
            this.firebase = new FirebaseManager();
            const initialized = await this.firebase.initialize();

            if (initialized) {
                // 設置 Firebase 回調
                this.firebase.onAuthStateChanged = (user) => this.handleAuthChange(user);
                this.firebase.onConnectionChange = (isOnline) => this.handleConnectionChange(isOnline);
            }
        }

        // 初始化存儲管理器
        this.storage = new StorageManager(this.firebase);

        // 設置同步回調
        this.storage.setSyncCallback(async (type) => {
            await this.syncToFirebase(type);
        });

        // 初始化 Claude 翻譯器
        if (typeof ClaudeTranslator !== 'undefined') {
            this.translator = new ClaudeTranslator();
            this.loadApiKey();
        }

        this.setupEventListeners();
        this.loadCategories();
        this.renderAll();
        this.updateSyncStatus();
    }

    setupEventListeners() {
        // Tab 切換
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 翻譯搜索
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchTranslation(e.target.value);
        });

        // 辭庫表單
        document.getElementById('dictionaryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDictionaryEntry();
        });

        // 句庫表單
        document.getElementById('phraseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePhraseEntry();
        });

        // 分類表單
        document.getElementById('categoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCategory();
        });

        // 導出/導入
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Firebase 登入/登出
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const syncBtn = document.getElementById('syncBtn');
        const uploadBtn = document.getElementById('uploadToCloudBtn');
        const downloadBtn = document.getElementById('downloadFromCloudBtn');

        if (signInBtn) {
            signInBtn.addEventListener('click', () => this.signIn());
        }
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.signOut());
        }
        if (syncBtn) {
            syncBtn.addEventListener('click', () => this.manualSync());
        }
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => this.uploadToCloud());
        }
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadFromCloud());
        }

        // Claude API 相關事件
        const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
        const testApiKeyBtn = document.getElementById('testApiKeyBtn');
        const translateBtn = document.getElementById('translateBtn');
        const changeApiKeyBtn = document.getElementById('changeApiKeyBtn');

        if (saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        }
        if (testApiKeyBtn) {
            testApiKeyBtn.addEventListener('click', () => this.testApiKey());
        }
        if (translateBtn) {
            translateBtn.addEventListener('click', () => this.performTranslation());
        }
        if (changeApiKeyBtn) {
            changeApiKeyBtn.addEventListener('click', () => this.showApiKeyInput());
        }
    }

    switchTab(tabName) {
        // 更新按鈕狀態
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // 更新內容顯示
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        this.currentTab = tabName;
        this.renderAll();
    }

    // 翻譯功能
    searchTranslation(query) {
        if (!query) {
            document.getElementById('translationResults').innerHTML = '';
            return;
        }

        const dictionaryResults = this.storage.searchDictionary(query);
        const phraseResults = this.storage.searchPhrases(query);

        let html = '';

        if (dictionaryResults.length > 0) {
            html += '<h3>辭庫結果</h3>';
            dictionaryResults.forEach(entry => {
                html += this.renderTranslationResult(entry);
            });
        }

        if (phraseResults.length > 0) {
            html += '<h3>句庫結果</h3>';
            phraseResults.forEach(entry => {
                html += this.renderTranslationResult(entry);
            });
        }

        if (dictionaryResults.length === 0 && phraseResults.length === 0) {
            html = '<div class="empty-state">未找到相關結果</div>';
        }

        document.getElementById('translationResults').innerHTML = html;
    }

    renderTranslationResult(entry) {
        const id = entry.id || Date.now();

        // 獲取創建者用戶名（如果有）
        const createdBy = entry.createdBy ? ` - ${entry.createdBy}` : '';

        return `
            <div class="translation-item">
                ${entry.traditional ? `
                <div class="translation-row">
                    <span><strong>繁體中文:</strong> ${entry.traditional}${createdBy}</span>
                    <button class="btn-copy" onclick="app.copyText('${this.escapeHtml(entry.traditional + createdBy)}')" title="複製">📋</button>
                </div>` : ''}
                <div class="translation-row">
                    <span><strong>简体中文:</strong> ${entry.simplified}${createdBy}</span>
                    <button class="btn-copy" onclick="app.copyText('${this.escapeHtml(entry.simplified + createdBy)}')" title="複製">📋</button>
                </div>
                <div class="translation-row">
                    <span><strong>English:</strong> ${entry.english}${createdBy}</span>
                    <button class="btn-copy" onclick="app.copyText('${this.escapeHtml(entry.english + createdBy)}')" title="複製">📋</button>
                </div>
                <div class="translation-row">
                    <span><strong>한국어:</strong> ${entry.korean}${createdBy}</span>
                    <button class="btn-copy" onclick="app.copyText('${this.escapeHtml(entry.korean + createdBy)}')" title="複製">📋</button>
                </div>
            </div>
        `;
    }

    // 轉義 HTML 特殊字符
    escapeHtml(text) {
        return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }

    // 複製文本到剪貼板
    copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('已複製到剪貼板', 'success');
            }).catch(err => {
                this.fallbackCopy(text);
            });
        } else {
            this.fallbackCopy(text);
        }
    }

    // 備用複製方法（兼容舊瀏覽器）
    fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            this.showNotification('已複製到剪貼板', 'success');
        } catch (err) {
            this.showNotification('複製失敗，請手動複製', 'warning');
        }

        document.body.removeChild(textArea);
    }

    // 辭庫管理
    saveDictionaryEntry() {
        const entry = {
            traditional: document.getElementById('dictTraditional').value,
            simplified: document.getElementById('dictSimplified').value,
            english: document.getElementById('dictEnglish').value,
            korean: document.getElementById('dictKorean').value,
            categoryId: parseInt(document.getElementById('dictCategory').value) || null
        };

        // 添加創建者用戶名（如果已登入）
        if (this.firebase && this.firebase.getCurrentUsername() && !this.editingId) {
            entry.createdBy = this.firebase.getCurrentUsername();
        }

        if (this.editingId && this.editingType === 'dictionary') {
            this.storage.updateDictionaryEntry(this.editingId, entry);
            this.editingId = null;
            this.editingType = null;
        } else {
            this.storage.addDictionaryEntry(entry);
        }

        document.getElementById('dictionaryForm').reset();
        this.renderDictionaryList();
    }

    renderDictionaryList() {
        const dictionary = this.storage.getDictionary();
        const categories = this.storage.getCategories();
        const tbody = document.getElementById('dictionaryList');

        if (dictionary.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">尚無辭庫資料</td></tr>';
            return;
        }

        tbody.innerHTML = dictionary.map(entry => {
            const category = categories.find(c => c.id === entry.categoryId);
            return `
                <tr>
                    <td>${entry.traditional}</td>
                    <td>${entry.simplified}</td>
                    <td>${entry.english}</td>
                    <td>${entry.korean}</td>
                    <td>${category ? category.name : '-'}</td>
                    <td class="action-buttons">
                        <button class="btn btn-secondary" onclick="app.editDictionaryEntry(${entry.id})">編輯</button>
                        <button class="btn btn-danger" onclick="app.deleteDictionaryEntry(${entry.id})">刪除</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    editDictionaryEntry(id) {
        const dictionary = this.storage.getDictionary();
        const entry = dictionary.find(e => e.id === id);
        if (entry) {
            document.getElementById('dictTraditional').value = entry.traditional;
            document.getElementById('dictSimplified').value = entry.simplified;
            document.getElementById('dictEnglish').value = entry.english;
            document.getElementById('dictKorean').value = entry.korean;
            document.getElementById('dictCategory').value = entry.categoryId || '';
            this.editingId = id;
            this.editingType = 'dictionary';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    deleteDictionaryEntry(id) {
        if (confirm('確定要刪除這個辭庫條目嗎？')) {
            this.storage.deleteDictionaryEntry(id);
            this.renderDictionaryList();
        }
    }

    // 句庫管理
    savePhraseEntry() {
        const entry = {
            traditional: document.getElementById('phraseTraditional').value,
            simplified: document.getElementById('phraseSimplified').value,
            english: document.getElementById('phraseEnglish').value,
            korean: document.getElementById('phraseKorean').value,
            categoryId: parseInt(document.getElementById('phraseCategory').value) || null
        };

        // 添加創建者用戶名（如果已登入）
        if (this.firebase && this.firebase.getCurrentUsername() && !this.editingId) {
            entry.createdBy = this.firebase.getCurrentUsername();
        }

        if (this.editingId && this.editingType === 'phrase') {
            this.storage.updatePhrase(this.editingId, entry);
            this.editingId = null;
            this.editingType = null;
        } else {
            this.storage.addPhrase(entry);
        }

        document.getElementById('phraseForm').reset();
        this.renderPhraseList();
    }

    renderPhraseList() {
        const phrases = this.storage.getPhrases();
        const categories = this.storage.getCategories();
        const tbody = document.getElementById('phraseList');

        if (phrases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">尚無句庫資料</td></tr>';
            return;
        }

        tbody.innerHTML = phrases.map(entry => {
            const category = categories.find(c => c.id === entry.categoryId);
            return `
                <tr>
                    <td>${entry.traditional}</td>
                    <td>${entry.simplified}</td>
                    <td>${entry.english}</td>
                    <td>${entry.korean}</td>
                    <td>${category ? category.name : '-'}</td>
                    <td class="action-buttons">
                        <button class="btn btn-secondary" onclick="app.editPhrase(${entry.id})">編輯</button>
                        <button class="btn btn-danger" onclick="app.deletePhrase(${entry.id})">刪除</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    editPhrase(id) {
        const phrases = this.storage.getPhrases();
        const entry = phrases.find(e => e.id === id);
        if (entry) {
            document.getElementById('phraseTraditional').value = entry.traditional;
            document.getElementById('phraseSimplified').value = entry.simplified;
            document.getElementById('phraseEnglish').value = entry.english;
            document.getElementById('phraseKorean').value = entry.korean;
            document.getElementById('phraseCategory').value = entry.categoryId || '';
            this.editingId = id;
            this.editingType = 'phrase';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    deletePhrase(id) {
        if (confirm('確定要刪除這個句庫條目嗎？')) {
            this.storage.deletePhrase(id);
            this.renderPhraseList();
        }
    }

    // 分類管理
    saveCategory() {
        const name = document.getElementById('categoryName').value;
        const type = document.getElementById('categoryType').value;

        if (this.editingId && this.editingType === 'category') {
            this.storage.updateCategory(this.editingId, name);
            this.editingId = null;
            this.editingType = null;
        } else {
            this.storage.addCategory(name, type);
        }

        document.getElementById('categoryForm').reset();
        this.loadCategories();
        this.renderCategoryList();
    }

    renderCategoryList() {
        const categories = this.storage.getCategories();
        const tbody = document.getElementById('categoryList');

        if (categories.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="empty-state">尚無分類資料</td></tr>';
            return;
        }

        tbody.innerHTML = categories.map(category => {
            return `
                <tr>
                    <td>${category.name}</td>
                    <td>${category.type === 'dictionary' ? '辭庫' : '句庫'}</td>
                    <td class="action-buttons">
                        <button class="btn btn-secondary" onclick="app.editCategory(${category.id})">編輯</button>
                        <button class="btn btn-danger" onclick="app.deleteCategory(${category.id})">刪除</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    editCategory(id) {
        const categories = this.storage.getCategories();
        const category = categories.find(c => c.id === id);
        if (category) {
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryType').value = category.type;
            this.editingId = id;
            this.editingType = 'category';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    deleteCategory(id) {
        if (confirm('確定要刪除這個分類嗎？相關的辭庫和句庫條目將不受影響。')) {
            this.storage.deleteCategory(id);
            this.loadCategories();
            this.renderCategoryList();
        }
    }

    loadCategories() {
        const categories = this.storage.getCategories();

        // 更新辭庫分類下拉選單
        const dictSelect = document.getElementById('dictCategory');
        const dictCategories = categories.filter(c => c.type === 'dictionary');
        dictSelect.innerHTML = '<option value="">請選擇分類</option>' +
            dictCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

        // 更新句庫分類下拉選單
        const phraseSelect = document.getElementById('phraseCategory');
        const phraseCategories = categories.filter(c => c.type === 'phrase');
        phraseSelect.innerHTML = '<option value="">請選擇分類</option>' +
            phraseCategories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }

    // 數據導出/導入
    exportData() {
        const data = this.storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trilan-translator-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (confirm('導入數據將覆蓋現有數據，確定要繼續嗎？')) {
                    this.storage.importData(data);
                    this.loadCategories();
                    this.renderAll();
                    alert('數據導入成功！');
                }
            } catch (error) {
                alert('數據格式錯誤，導入失敗！');
            }
        };
        reader.readAsText(file);
    }

    renderAll() {
        this.renderDictionaryList();
        this.renderPhraseList();
        this.renderCategoryList();
        this.updateStats();
    }

    updateStats() {
        document.getElementById('dictCount').textContent = this.storage.getDictionary().length;
        document.getElementById('phraseCount').textContent = this.storage.getPhrases().length;
        document.getElementById('categoryCount').textContent = this.storage.getCategories().length;
    }

    // ===== Firebase 相關方法 =====

    // 處理認證狀態變化
    async handleAuthChange(user) {
        const signInSection = document.getElementById('signInSection');
        const userSection = document.getElementById('userSection');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const syncControls = document.getElementById('syncControls');

        if (user) {
            // 用戶已登入
            if (signInSection) signInSection.style.display = 'none';
            if (userSection) userSection.style.display = 'block';
            if (userName) userName.textContent = user.displayName || '用戶';
            if (userEmail) userEmail.textContent = user.email;
            if (syncControls) syncControls.style.display = 'block';

            // 提示用戶是否要從雲端載入數據
            const hasLocalData = this.storage.getDictionary().length > 0 ||
                                this.storage.getPhrases().length > 0;

            if (confirm('是否要從雲端載入數據？\n\n選擇「確定」從雲端下載數據（會覆蓋本地數據）\n選擇「取消」上傳本地數據到雲端')) {
                await this.downloadFromCloud();
            } else if (hasLocalData) {
                await this.uploadToCloud();
            }

            // 啟動實時同步
            this.startRealtimeSync();
        } else {
            // 用戶已登出
            if (signInSection) signInSection.style.display = 'block';
            if (userSection) userSection.style.display = 'none';
            if (syncControls) syncControls.style.display = 'none';
        }

        this.updateSyncStatus();
    }

    // 處理網路連線變化
    handleConnectionChange(isOnline) {
        this.updateSyncStatus();
        if (isOnline) {
            this.showNotification('網路已連線', 'success');
        } else {
            this.showNotification('網路已斷線，將使用離線模式', 'warning');
        }
    }

    // Email 登入
    async signIn() {
        if (!this.firebase) {
            alert('Firebase 未初始化，請檢查配置');
            return;
        }

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            alert('請輸入帳號和密碼');
            return;
        }

        try {
            await this.firebase.signInWithEmail(username, password);
            // 清空輸入框
            document.getElementById('loginUsername').value = '';
            document.getElementById('loginPassword').value = '';
        } catch (error) {
            console.error('登入失敗:', error);
            let errorMessage = '登入失敗：';
            if (error.code === 'auth/wrong-password') {
                errorMessage += '密碼錯誤';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage += '帳號格式錯誤';
            } else if (error.code === 'auth/weak-password') {
                errorMessage += '密碼強度不足（至少6個字符）';
            } else {
                errorMessage += error.message;
            }
            alert(errorMessage);
        }
    }

    // 登出
    async signOut() {
        if (!this.firebase) return;

        if (confirm('確定要登出嗎？本地數據不會被刪除。')) {
            try {
                await this.firebase.signOut();
                this.showNotification('已登出', 'success');
            } catch (error) {
                console.error('登出失敗:', error);
                alert('登出失敗：' + error.message);
            }
        }
    }

    // 同步到 Firebase
    async syncToFirebase(type) {
        if (!this.firebase || !this.firebase.isSignedIn() || this.isSyncing) {
            return;
        }

        try {
            this.isSyncing = true;
            this.updateSyncStatus('同步中...');

            if (type === 'categories') {
                await this.firebase.syncCategories(this.storage.getCategories());
            } else if (type === 'dictionary') {
                await this.firebase.syncDictionary(this.storage.getDictionary());
            } else if (type === 'phrases') {
                await this.firebase.syncPhrases(this.storage.getPhrases());
            }
        } catch (error) {
            console.error('同步失敗:', error);
        } finally {
            this.isSyncing = false;
            this.updateSyncStatus();
        }
    }

    // 手動同步
    async manualSync() {
        if (!this.firebase || !this.firebase.isSignedIn()) {
            alert('請先登入');
            return;
        }

        try {
            this.updateSyncStatus('同步中...');
            await this.firebase.uploadAllData(
                this.storage.getCategories(),
                this.storage.getDictionary(),
                this.storage.getPhrases()
            );
            this.showNotification('同步成功', 'success');
        } catch (error) {
            console.error('同步失敗:', error);
            alert('同步失敗：' + error.message);
        } finally {
            this.updateSyncStatus();
        }
    }

    // 上傳到雲端
    async uploadToCloud() {
        if (!this.firebase || !this.firebase.isSignedIn()) {
            alert('請先登入');
            return;
        }

        if (!confirm('確定要上傳本地數據到雲端嗎？這會覆蓋雲端現有數據。')) {
            return;
        }

        try {
            this.updateSyncStatus('上傳中...');
            await this.firebase.uploadAllData(
                this.storage.getCategories(),
                this.storage.getDictionary(),
                this.storage.getPhrases()
            );
            this.showNotification('上傳成功', 'success');
        } catch (error) {
            console.error('上傳失敗:', error);
            alert('上傳失敗：' + error.message);
        } finally {
            this.updateSyncStatus();
        }
    }

    // 從雲端下載
    async downloadFromCloud() {
        if (!this.firebase || !this.firebase.isSignedIn()) {
            alert('請先登入');
            return;
        }

        if (!confirm('確定要從雲端下載數據嗎？這會覆蓋本地現有數據。')) {
            return;
        }

        try {
            this.updateSyncStatus('下載中...');
            const data = await this.firebase.downloadAllData();

            if (data.categories) {
                this.storage.saveCategories(data.categories);
            }
            if (data.dictionary) {
                this.storage.saveDictionary(data.dictionary);
            }
            if (data.phrases) {
                this.storage.savePhrases(data.phrases);
            }

            this.loadCategories();
            this.renderAll();
            this.showNotification('下載成功', 'success');
        } catch (error) {
            console.error('下載失敗:', error);
            alert('下載失敗：' + error.message);
        } finally {
            this.updateSyncStatus();
        }
    }

    // 啟動實時同步
    startRealtimeSync() {
        if (!this.firebase || !this.firebase.isSignedIn()) return;

        this.firebase.startSync((type, data) => {
            // 當雲端數據變化時，更新本地數據（不觸發同步回調）
            const originalCallback = this.storage.syncCallback;
            this.storage.syncCallback = null;

            if (type === 'categories') {
                this.storage.saveCategories(data);
                this.loadCategories();
            } else if (type === 'dictionary') {
                this.storage.saveDictionary(data);
            } else if (type === 'phrases') {
                this.storage.savePhrases(data);
            }

            this.renderAll();
            this.storage.syncCallback = originalCallback;
        });
    }

    // 更新同步狀態顯示
    updateSyncStatus(customMessage = null) {
        const statusEl = document.getElementById('syncStatus');
        if (!statusEl) return;

        if (customMessage) {
            statusEl.textContent = customMessage;
            statusEl.className = 'sync-status syncing';
            return;
        }

        if (!this.firebase || !this.firebase.isSignedIn()) {
            statusEl.textContent = '未登入';
            statusEl.className = 'sync-status offline';
        } else if (!this.firebase.isOnlineStatus()) {
            statusEl.textContent = '離線模式';
            statusEl.className = 'sync-status offline';
        } else {
            statusEl.textContent = '已同步';
            statusEl.className = 'sync-status synced';
        }
    }

    // 顯示通知
    showNotification(message, type = 'info') {
        // 簡單的通知實現
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#17a2b8'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // ===== Claude API 翻譯功能 =====

    // 載入 API Key
    loadApiKey() {
        if (!this.translator) return;
        const apiKey = this.translator.getApiKey();
        if (apiKey) {
            document.getElementById('claudeApiKey').value = apiKey;
            this.hideApiKeyInput();
        } else {
            this.showApiKeyInput();
        }
    }

    // 顯示 API Key 輸入框
    showApiKeyInput() {
        document.getElementById('apiKeyInputSection').style.display = 'block';
        document.getElementById('apiKeyConfiguredSection').style.display = 'none';
    }

    // 隱藏 API Key 輸入框
    hideApiKeyInput() {
        if (!this.translator || !this.translator.hasApiKey()) return;

        const apiKey = this.translator.getApiKey();
        // 顯示 API Key 前綴和遮罩
        const preview = apiKey.substring(0, 20) + '****';
        document.getElementById('apiKeyPreview').textContent = preview;

        document.getElementById('apiKeyInputSection').style.display = 'none';
        document.getElementById('apiKeyConfiguredSection').style.display = 'block';
    }

    // 保存 API Key
    saveApiKey() {
        if (!this.translator) {
            alert('翻譯器未初始化');
            return;
        }

        const apiKey = document.getElementById('claudeApiKey').value.trim();
        if (!apiKey) {
            alert('請輸入 API Key');
            return;
        }

        // 驗證 API Key 格式
        if (!apiKey.startsWith('sk-ant-')) {
            alert('API Key 格式不正確，應該以 sk-ant- 開頭');
            return;
        }

        this.translator.setApiKey(apiKey);
        this.showNotification('API Key 已保存', 'success');
        this.hideApiKeyInput();
    }

    // 測試 API Key
    async testApiKey() {
        if (!this.translator || !this.translator.hasApiKey()) {
            alert('請先輸入並保存 API Key');
            return;
        }

        try {
            const testBtn = document.getElementById('testApiKeyBtn');
            testBtn.disabled = true;
            testBtn.textContent = '測試中...';

            // 使用簡單的測試文本
            await this.translator.translate('你好', 'zh-TW', ['en']);

            this.showNotification('API Key 測試成功！', 'success');
        } catch (error) {
            console.error('API Key 測試失敗:', error);
            alert('API Key 測試失敗：' + error.message);
        } finally {
            const testBtn = document.getElementById('testApiKeyBtn');
            testBtn.disabled = false;
            testBtn.textContent = '測試';
        }
    }

    // 執行翻譯
    async performTranslation() {
        if (!this.translator || !this.translator.hasApiKey()) {
            alert('請先設置 Claude API Key');
            return;
        }

        const text = document.getElementById('translationInput').value.trim();
        if (!text) {
            alert('請輸入要翻譯的文字');
            return;
        }

        try {
            const translateBtn = document.getElementById('translateBtn');
            translateBtn.disabled = true;
            translateBtn.textContent = '翻譯中...';

            // 使用自動翻譯（自動檢測語言）
            const result = await this.translator.autoTranslate(text);

            // 保存翻譯結果
            this.lastTranslation = result;

            // 顯示結果
            this.renderAITranslationResult(result);
            this.showNotification('翻譯成功！', 'success');
        } catch (error) {
            console.error('翻譯失敗:', error);
            alert('翻譯失敗：' + error.message);
        } finally {
            const translateBtn = document.getElementById('translateBtn');
            translateBtn.disabled = false;
            translateBtn.textContent = '🤖 AI 翻譯';
        }
    }

    // 顯示 AI 翻譯結果
    renderAITranslationResult(result) {
        const resultDiv = document.getElementById('aiTranslationResult');

        // 獲取創建者用戶名（如果已登入）
        const createdBy = (this.firebase && this.firebase.getCurrentUsername())
            ? ` - ${this.firebase.getCurrentUsername()}`
            : '';

        let html = '<h3>翻譯結果</h3>';
        html += '<div class="translation-item">';

        if (result.traditional) {
            html += `
                <div class="translation-row">
                    <span><strong>繁體中文:</strong> ${result.traditional}${createdBy}</span>
                    <button class="btn-copy" onclick="app.copyText('${this.escapeHtml(result.traditional + createdBy)}')" title="複製">📋</button>
                </div>
            `;
        }

        if (result.simplified) {
            html += `
                <div class="translation-row">
                    <span><strong>简体中文:</strong> ${result.simplified}${createdBy}</span>
                    <button class="btn-copy" onclick="app.copyText('${this.escapeHtml(result.simplified + createdBy)}')" title="複製">📋</button>
                </div>
            `;
        }

        if (result.english) {
            html += `
                <div class="translation-row">
                    <span><strong>English:</strong> ${result.english}${createdBy}</span>
                    <button class="btn-copy" onclick="app.copyText('${this.escapeHtml(result.english + createdBy)}')" title="複製">📋</button>
                </div>
            `;
        }

        if (result.korean) {
            html += `
                <div class="translation-row">
                    <span><strong>한국어:</strong> ${result.korean}${createdBy}</span>
                    <button class="btn-copy" onclick="app.copyText('${this.escapeHtml(result.korean + createdBy)}')" title="複製">📋</button>
                </div>
            `;
        }

        html += '</div>';

        // 添加保存按鈕
        html += `
            <div class="save-to-library-buttons">
                <button class="btn btn-info" onclick="app.saveAIToDictionary()">💾 保存到辭庫</button>
                <button class="btn btn-info" onclick="app.saveAIToPhrase()">💾 保存到句庫</button>
            </div>
        `;

        resultDiv.innerHTML = html;
        resultDiv.style.display = 'block';
    }

    // 保存 AI 翻譯到辭庫
    saveAIToDictionary() {
        if (!this.lastTranslation) {
            alert('沒有可保存的翻譯結果');
            return;
        }

        const entry = {
            traditional: this.lastTranslation.traditional || '',
            simplified: this.lastTranslation.simplified || '',
            english: this.lastTranslation.english || '',
            korean: this.lastTranslation.korean || '',
            categoryId: null
        };

        // 添加創建者用戶名（如果已登入）
        if (this.firebase && this.firebase.getCurrentUsername()) {
            entry.createdBy = this.firebase.getCurrentUsername();
        }

        this.storage.addDictionaryEntry(entry);
        this.showNotification('已保存到辭庫', 'success');

        // 清空翻譯輸入框
        document.getElementById('translationInput').value = '';

        // 更新辭庫列表（如果在辭庫 tab）
        if (this.currentTab === 'dictionary') {
            this.renderDictionaryList();
        }
    }

    // 保存 AI 翻譯到句庫
    saveAIToPhrase() {
        if (!this.lastTranslation) {
            alert('沒有可保存的翻譯結果');
            return;
        }

        const entry = {
            traditional: this.lastTranslation.traditional || '',
            simplified: this.lastTranslation.simplified || '',
            english: this.lastTranslation.english || '',
            korean: this.lastTranslation.korean || '',
            categoryId: null
        };

        // 添加創建者用戶名（如果已登入）
        if (this.firebase && this.firebase.getCurrentUsername()) {
            entry.createdBy = this.firebase.getCurrentUsername();
        }

        this.storage.addPhraseEntry(entry);
        this.showNotification('已保存到句庫', 'success');

        // 清空翻譯輸入框
        document.getElementById('translationInput').value = '';

        // 更新句庫列表（如果在句庫 tab）
        if (this.currentTab === 'phrase') {
            this.renderPhraseList();
        }
    }
}

// 初始化應用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TranslatorApp();
});
