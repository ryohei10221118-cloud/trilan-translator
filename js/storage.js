// 數據存儲管理模塊
class StorageManager {
    constructor(firebaseManager = null) {
        this.firebase = firebaseManager;
        this.syncCallback = null;
        this.initializeData();
    }

    // 設置同步回調
    setSyncCallback(callback) {
        this.syncCallback = callback;
    }

    // 觸發同步
    async triggerSync(type) {
        if (this.syncCallback) {
            await this.syncCallback(type);
        }
    }

    // 初始化數據
    initializeData() {
        if (!localStorage.getItem('categories')) {
            localStorage.setItem('categories', JSON.stringify([]));
        }
        if (!localStorage.getItem('dictionary')) {
            localStorage.setItem('dictionary', JSON.stringify([]));
        }
        if (!localStorage.getItem('phrases')) {
            localStorage.setItem('phrases', JSON.stringify([]));
        }
    }

    // 獲取分類
    getCategories() {
        return JSON.parse(localStorage.getItem('categories') || '[]');
    }

    // 保存分類
    saveCategories(categories) {
        localStorage.setItem('categories', JSON.stringify(categories));
        this.triggerSync('categories');
    }

    // 添加分類
    addCategory(name, type) {
        const categories = this.getCategories();
        const newCategory = {
            id: Date.now(),
            name: name,
            type: type, // 'dictionary' 或 'phrase'
            createdAt: new Date().toISOString()
        };
        categories.push(newCategory);
        this.saveCategories(categories);
        return newCategory;
    }

    // 更新分類
    updateCategory(id, name) {
        const categories = this.getCategories();
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index].name = name;
            categories[index].updatedAt = new Date().toISOString();
            this.saveCategories(categories);
            return true;
        }
        return false;
    }

    // 刪除分類
    deleteCategory(id) {
        const categories = this.getCategories();
        const filtered = categories.filter(c => c.id !== id);
        this.saveCategories(filtered);
    }

    // 獲取辭庫
    getDictionary() {
        return JSON.parse(localStorage.getItem('dictionary') || '[]');
    }

    // 保存辭庫
    saveDictionary(dictionary) {
        localStorage.setItem('dictionary', JSON.stringify(dictionary));
        this.triggerSync('dictionary');
    }

    // 添加辭庫條目
    addDictionaryEntry(entry) {
        const dictionary = this.getDictionary();
        const newEntry = {
            id: Date.now(),
            traditional: entry.traditional,
            simplified: entry.simplified,
            english: entry.english,
            korean: entry.korean,
            categoryId: entry.categoryId || null,
            createdAt: new Date().toISOString()
        };
        dictionary.push(newEntry);
        this.saveDictionary(dictionary);
        return newEntry;
    }

    // 更新辭庫條目
    updateDictionaryEntry(id, entry) {
        const dictionary = this.getDictionary();
        const index = dictionary.findIndex(e => e.id === id);
        if (index !== -1) {
            dictionary[index] = {
                ...dictionary[index],
                ...entry,
                updatedAt: new Date().toISOString()
            };
            this.saveDictionary(dictionary);
            return true;
        }
        return false;
    }

    // 刪除辭庫條目
    deleteDictionaryEntry(id) {
        const dictionary = this.getDictionary();
        const filtered = dictionary.filter(e => e.id !== id);
        this.saveDictionary(filtered);
    }

    // 搜索辭庫
    searchDictionary(query) {
        const dictionary = this.getDictionary();
        if (!query) return dictionary;

        const lowerQuery = query.toLowerCase();
        return dictionary.filter(entry =>
            entry.traditional.toLowerCase().includes(lowerQuery) ||
            entry.simplified.toLowerCase().includes(lowerQuery) ||
            entry.english.toLowerCase().includes(lowerQuery) ||
            entry.korean.toLowerCase().includes(lowerQuery)
        );
    }

    // 獲取句庫
    getPhrases() {
        return JSON.parse(localStorage.getItem('phrases') || '[]');
    }

    // 保存句庫
    savePhrases(phrases) {
        localStorage.setItem('phrases', JSON.stringify(phrases));
        this.triggerSync('phrases');
    }

    // 添加句庫條目
    addPhrase(entry) {
        const phrases = this.getPhrases();
        const newEntry = {
            id: Date.now(),
            traditional: entry.traditional,
            simplified: entry.simplified,
            english: entry.english,
            korean: entry.korean,
            categoryId: entry.categoryId || null,
            createdAt: new Date().toISOString()
        };
        phrases.push(newEntry);
        this.savePhrases(phrases);
        return newEntry;
    }

    // 更新句庫條目
    updatePhrase(id, entry) {
        const phrases = this.getPhrases();
        const index = phrases.findIndex(e => e.id === id);
        if (index !== -1) {
            phrases[index] = {
                ...phrases[index],
                ...entry,
                updatedAt: new Date().toISOString()
            };
            this.savePhrases(phrases);
            return true;
        }
        return false;
    }

    // 刪除句庫條目
    deletePhrase(id) {
        const phrases = this.getPhrases();
        const filtered = phrases.filter(e => e.id !== id);
        this.savePhrases(filtered);
    }

    // 搜索句庫
    searchPhrases(query) {
        const phrases = this.getPhrases();
        if (!query) return phrases;

        const lowerQuery = query.toLowerCase();
        return phrases.filter(entry =>
            entry.traditional.toLowerCase().includes(lowerQuery) ||
            entry.simplified.toLowerCase().includes(lowerQuery) ||
            entry.english.toLowerCase().includes(lowerQuery) ||
            entry.korean.toLowerCase().includes(lowerQuery)
        );
    }

    // 導出數據
    exportData() {
        return {
            categories: this.getCategories(),
            dictionary: this.getDictionary(),
            phrases: this.getPhrases(),
            exportedAt: new Date().toISOString()
        };
    }

    // 導入數據
    importData(data) {
        if (data.categories) {
            this.saveCategories(data.categories);
        }
        if (data.dictionary) {
            this.saveDictionary(data.dictionary);
        }
        if (data.phrases) {
            this.savePhrases(data.phrases);
        }
    }
}
