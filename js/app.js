// 主應用邏輯
class TranslatorApp {
    constructor() {
        this.storage = new StorageManager();
        this.currentTab = 'translator';
        this.editingId = null;
        this.editingType = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCategories();
        this.renderAll();
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
        return `
            <div class="translation-item">
                <div><strong>繁體中文:</strong> ${entry.traditional}</div>
                <div><strong>简体中文:</strong> ${entry.simplified}</div>
                <div><strong>English:</strong> ${entry.english}</div>
                <div><strong>한국어:</strong> ${entry.korean}</div>
            </div>
        `;
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
}

// 初始化應用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TranslatorApp();
});
