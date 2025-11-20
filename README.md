# Trilan Translator - 三語翻譯工具

一個支援中文（繁體/簡體）、英文、韓文三語翻譯的工具，具備辭庫、句庫和分類管理功能。**支援跨設備雲端同步！**

## ✨ 功能特色

- **翻譯功能**：支援繁體中文、簡體中文、英文、韓文互譯
- **辭庫管理**：新增、編輯、刪除單詞翻譯
- **句庫管理**：新增、編輯、刪除句子翻譯
- **分類管理**：為辭庫和句庫建立分類，方便管理
- **🔄 跨設備同步**：使用 Google 帳號登入，自動同步數據到所有設備
- **📴 離線支援**：支援離線使用，網路恢復後自動同步
- **☁️ 雲端備份**：數據安全存儲在 Firebase Firestore
- **🔐 安全登入**：使用 Google 帳號安全登入

## 🚀 快速開始

### 基本使用（無需配置）

直接在瀏覽器中開啟 `index.html` 即可使用基本功能。數據會存儲在瀏覽器的 LocalStorage 中。

### 啟用跨設備同步（需要 Firebase 配置）

如果您想使用跨設備同步功能，需要進行以下配置：

#### 1. 創建 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊「新增專案」或選擇現有專案
3. 按照提示完成專案設置

#### 2. 啟用 Firestore 資料庫

1. 在 Firebase Console 左側選單中，點擊「Firestore Database」
2. 點擊「建立資料庫」
3. 選擇「以測試模式啟動」（稍後可以修改安全規則）
4. 選擇資料庫位置（建議選擇離您最近的位置）

#### 3. 啟用 Google 登入

1. 在 Firebase Console 左側選單中，點擊「Authentication」
2. 點擊「開始使用」
3. 在「登入方式」標籤中，啟用「Google」
4. 填入專案的公開名稱和支援電子郵件

#### 4. 獲取 Firebase 配置

1. 在 Firebase Console 中，點擊專案設定（齒輪圖標）
2. 在「您的應用程式」區域，點擊網頁應用程式圖標 `</>`
3. 註冊應用程式，然後複製 `firebaseConfig` 物件

#### 5. 配置應用程式

1. 將 `firebase-config.template.js` 複製並重命名為 `firebase-config.js`
   ```bash
   cp firebase-config.template.js firebase-config.js
   ```

2. 開啟 `firebase-config.js`，填入您的 Firebase 配置：
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

3. 開啟 `index.html`，使用瀏覽器開始使用

#### 6. 設置 Firestore 安全規則（建議）

為了保護您的數據，建議設置以下安全規則：

1. 在 Firebase Console 中，前往「Firestore Database」> 「規則」
2. 複製以下規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 只允許已登入的用戶讀寫自己的資料
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. 點擊「發布」

## 📖 使用說明

### 基本功能

1. **翻譯工具**：在搜索框輸入中文、英文或韓文，即可搜索辭庫和句庫
2. **辭庫管理**：新增、編輯單詞翻譯，支援分類
3. **句庫管理**：新增、編輯句子翻譯，支援分類
4. **分類管理**：創建辭庫或句庫的分類，方便管理

### 雲端同步功能

1. **登入**：點擊右上角的「使用 Google 登入」按鈕
2. **首次登入**：系統會詢問您是要從雲端下載數據，還是上傳本地數據到雲端
3. **自動同步**：登入後，所有修改都會自動同步到雲端
4. **手動同步**：可以使用「同步」按鈕手動觸發同步
5. **上傳/下載**：使用「↑ 上傳」和「↓ 下載」按鈕手動管理數據

### 資料備份

- **導出數據**：點擊「導出數據」按鈕，將所有數據下載為 JSON 文件
- **導入數據**：點擊「導入數據」按鈕，從 JSON 文件恢復數據

## 🛠️ 技術棧

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **本地存儲**：LocalStorage
- **雲端服務**：Firebase (Firestore, Authentication)
- **認證**：Google OAuth 2.0

## 📁 專案結構

```
trilan-translator/
├── index.html                      # 主頁面
├── css/
│   └── style.css                   # 樣式表
├── js/
│   ├── storage.js                  # 本地存儲管理
│   ├── firebase.js                 # Firebase 整合
│   └── app.js                      # 主應用邏輯
├── firebase-config.template.js     # Firebase 配置模板
├── firebase-config.js             # Firebase 配置（不提交到 Git）
└── README.md                       # 說明文件
```

## 🔒 安全注意事項

- `firebase-config.js` 已加入 `.gitignore`，不會被提交到版本控制系統
- Firebase 安全規則確保用戶只能訪問自己的數據
- 本地數據始終保存在 LocalStorage，作為備份

## 📝 授權

本專案採用 MIT 授權。
