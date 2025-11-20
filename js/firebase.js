// Firebase 集成管理
class FirebaseManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.currentUser = null;
        this.isOnline = navigator.onLine;
        this.syncEnabled = false;
        this.unsubscribes = [];

        // 監聽網路狀態
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onConnectionChange(true);
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onConnectionChange(false);
        });
    }

    // 初始化 Firebase
    async initialize() {
        try {
            // 檢查是否已載入 Firebase 配置
            if (typeof firebaseConfig === 'undefined') {
                console.warn('Firebase 配置未找到，使用本地存儲模式');
                return false;
            }

            // 初始化 Firebase
            firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            this.auth = firebase.auth();

            // 啟用離線持久化
            this.db.enablePersistence({ synchronizeTabs: true })
                .catch((err) => {
                    if (err.code === 'failed-precondition') {
                        console.warn('多個分頁開啟，離線持久化可能無法使用');
                    } else if (err.code === 'unimplemented') {
                        console.warn('瀏覽器不支援離線持久化');
                    }
                });

            // 監聽認證狀態變化
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.onAuthStateChanged(user);
            });

            return true;
        } catch (error) {
            console.error('Firebase 初始化失敗:', error);
            return false;
        }
    }

    // Google 登入
    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });
            const result = await this.auth.signInWithPopup(provider);
            return result.user;
        } catch (error) {
            console.error('Google 登入失敗:', error);
            throw error;
        }
    }

    // Email 登入/註冊（自動加上 @google.com）
    async signInWithEmail(username, password) {
        try {
            const email = `${username}@google.com`;

            // 先嘗試登入
            try {
                const result = await this.auth.signInWithEmailAndPassword(email, password);
                return result.user;
            } catch (signInError) {
                // 如果帳號不存在，自動註冊
                if (signInError.code === 'auth/user-not-found') {
                    const result = await this.auth.createUserWithEmailAndPassword(email, password);
                    // 設置顯示名稱為用戶名
                    await result.user.updateProfile({
                        displayName: username
                    });
                    return result.user;
                } else {
                    throw signInError;
                }
            }
        } catch (error) {
            console.error('Email 登入失敗:', error);
            throw error;
        }
    }

    // 獲取當前用戶名（不含 @google.com）
    getCurrentUsername() {
        if (!this.currentUser) return null;
        if (this.currentUser.displayName) {
            return this.currentUser.displayName;
        }
        // 從 email 提取用戶名
        if (this.currentUser.email) {
            return this.currentUser.email.split('@')[0];
        }
        return null;
    }

    // 登出
    async signOut() {
        try {
            await this.auth.signOut();
            this.stopSync();
        } catch (error) {
            console.error('登出失敗:', error);
            throw error;
        }
    }

    // 獲取用戶數據引用
    getUserDataRef(collection) {
        if (!this.currentUser) {
            throw new Error('用戶未登入');
        }
        return this.db.collection('users').doc(this.currentUser.uid).collection(collection);
    }

    // 同步分類到 Firestore
    async syncCategories(categories) {
        if (!this.syncEnabled || !this.currentUser) return;

        try {
            const batch = this.db.batch();
            const ref = this.getUserDataRef('categories');

            // 刪除所有舊資料
            const oldDocs = await ref.get();
            oldDocs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // 添加新資料
            categories.forEach(category => {
                const docRef = ref.doc(category.id.toString());
                batch.set(docRef, category);
            });

            await batch.commit();
        } catch (error) {
            console.error('同步分類失敗:', error);
            throw error;
        }
    }

    // 同步辭庫到 Firestore
    async syncDictionary(dictionary) {
        if (!this.syncEnabled || !this.currentUser) return;

        try {
            const batch = this.db.batch();
            const ref = this.getUserDataRef('dictionary');

            // 刪除所有舊資料
            const oldDocs = await ref.get();
            oldDocs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // 添加新資料
            dictionary.forEach(entry => {
                const docRef = ref.doc(entry.id.toString());
                batch.set(docRef, entry);
            });

            await batch.commit();
        } catch (error) {
            console.error('同步辭庫失敗:', error);
            throw error;
        }
    }

    // 同步句庫到 Firestore
    async syncPhrases(phrases) {
        if (!this.syncEnabled || !this.currentUser) return;

        try {
            const batch = this.db.batch();
            const ref = this.getUserDataRef('phrases');

            // 刪除所有舊資料
            const oldDocs = await ref.get();
            oldDocs.forEach(doc => {
                batch.delete(doc.ref);
            });

            // 添加新資料
            phrases.forEach(phrase => {
                const docRef = ref.doc(phrase.id.toString());
                batch.set(docRef, phrase);
            });

            await batch.commit();
        } catch (error) {
            console.error('同步句庫失敗:', error);
            throw error;
        }
    }

    // 從 Firestore 載入分類
    async loadCategories() {
        if (!this.currentUser) return [];

        try {
            const snapshot = await this.getUserDataRef('categories').get();
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('載入分類失敗:', error);
            return [];
        }
    }

    // 從 Firestore 載入辭庫
    async loadDictionary() {
        if (!this.currentUser) return [];

        try {
            const snapshot = await this.getUserDataRef('dictionary').get();
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('載入辭庫失敗:', error);
            return [];
        }
    }

    // 從 Firestore 載入句庫
    async loadPhrases() {
        if (!this.currentUser) return [];

        try {
            const snapshot = await this.getUserDataRef('phrases').get();
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('載入句庫失敗:', error);
            return [];
        }
    }

    // 啟動實時同步
    startSync(onDataChange) {
        if (!this.currentUser || this.syncEnabled) return;

        this.syncEnabled = true;

        // 監聽分類變化
        const categoriesUnsubscribe = this.getUserDataRef('categories').onSnapshot((snapshot) => {
            const categories = snapshot.docs.map(doc => doc.data());
            onDataChange('categories', categories);
        });

        // 監聽辭庫變化
        const dictionaryUnsubscribe = this.getUserDataRef('dictionary').onSnapshot((snapshot) => {
            const dictionary = snapshot.docs.map(doc => doc.data());
            onDataChange('dictionary', dictionary);
        });

        // 監聽句庫變化
        const phrasesUnsubscribe = this.getUserDataRef('phrases').onSnapshot((snapshot) => {
            const phrases = snapshot.docs.map(doc => doc.data());
            onDataChange('phrases', phrases);
        });

        this.unsubscribes = [categoriesUnsubscribe, dictionaryUnsubscribe, phrasesUnsubscribe];
    }

    // 停止實時同步
    stopSync() {
        this.syncEnabled = false;
        this.unsubscribes.forEach(unsubscribe => unsubscribe());
        this.unsubscribes = [];
    }

    // 認證狀態變化回調（由外部設定）
    onAuthStateChanged(user) {
        // 由 app.js 設定
    }

    // 連接狀態變化回調（由外部設定）
    onConnectionChange(isOnline) {
        // 由 app.js 設定
    }

    // 獲取當前用戶信息
    getCurrentUser() {
        return this.currentUser;
    }

    // 檢查是否已登入
    isSignedIn() {
        return this.currentUser !== null;
    }

    // 檢查是否在線
    isOnlineStatus() {
        return this.isOnline;
    }

    // 全量同步（上傳本地數據到雲端）
    async uploadAllData(categories, dictionary, phrases) {
        if (!this.currentUser) {
            throw new Error('用戶未登入');
        }

        try {
            await Promise.all([
                this.syncCategories(categories),
                this.syncDictionary(dictionary),
                this.syncPhrases(phrases)
            ]);
            return true;
        } catch (error) {
            console.error('上傳數據失敗:', error);
            throw error;
        }
    }

    // 全量下載（從雲端下載到本地）
    async downloadAllData() {
        if (!this.currentUser) {
            throw new Error('用戶未登入');
        }

        try {
            const [categories, dictionary, phrases] = await Promise.all([
                this.loadCategories(),
                this.loadDictionary(),
                this.loadPhrases()
            ]);

            return { categories, dictionary, phrases };
        } catch (error) {
            console.error('下載數據失敗:', error);
            throw error;
        }
    }
}
