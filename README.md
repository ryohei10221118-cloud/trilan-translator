# Trilan Translator - 三語翻譯工具

一個支援中文（繁體/簡體）、英文、韓文三語翻譯的工具，具備辭庫、句庫和分類管理功能。**支援 Claude AI 智能翻譯和跨設備雲端同步！**

## ✨ 功能特色

- **🤖 AI 智能翻譯**：整合 Claude API，自動檢測語言並翻譯
- **翻譯功能**：支援繁體中文、簡體中文、英文、韓文互譯
- **辭庫管理**：新增、編輯、刪除單詞翻譯
- **句庫管理**：新增、編輯、刪除句子翻譯
- **分類管理**：為辭庫和句庫建立分類，方便管理
- **🔄 跨設備同步**：登入後自動同步數據到所有設備
- **📴 離線支援**：支援離線使用，網路恢復後自動同步
- **☁️ 雲端備份**：數據安全存儲在 Firebase Firestore
- **🔐 安全登入**：Email/密碼登入，新用戶自動註冊
- **📋 一鍵複製**：每個翻譯結果都有複製按鈕
- **👤 用戶標記**：翻譯結果自動附加創建者用戶名

## 🚀 快速開始

### 方式一：使用代理服務器（推薦，支援 AI 翻譯）

使用 Node.js 代理服務器，可以完整使用所有功能包括 Claude AI 翻譯。

#### 1. 安裝依賴

```bash
npm install
```

#### 2. 啟動服務器

```bash
npm start
```

服務器會在 `http://localhost:3000` 啟動。

#### 3. 配置 Claude API Key

1. 前往 [Anthropic Console](https://console.anthropic.com/settings/keys) 獲取 API Key
2. 在應用界面中的「Claude API 設定」區域輸入 API Key
3. 點擊「保存」按鈕
4. 點擊「測試」驗證 API Key 是否有效

#### 4. 開始使用 AI 翻譯

在「AI 智能翻譯」區域輸入文字，系統會自動檢測語言並翻譯成其他三種語言！

### 方式二：直接開啟（不支援 AI 翻譯）

直接在瀏覽器中開啟 `index.html` 即可使用辭庫、句庫管理功能。

**注意**：由於瀏覽器 CORS 限制，無法直接調用 Claude API，需要使用方式一的代理服務器。

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
- **後端**：Node.js, Express
- **AI 模型**：Claude 3.5 Sonnet (Anthropic)
- **本地存儲**：LocalStorage
- **雲端服務**：Firebase (Firestore, Authentication)
- **認證**：Email/Password (Firebase Auth)

## 📁 專案結構

```
trilan-translator/
├── index.html                      # 主頁面
├── server.js                       # Node.js 代理服務器
├── package.json                    # Node.js 依賴配置
├── .env.example                    # 環境變量模板
├── css/
│   └── style.css                   # 樣式表
├── js/
│   ├── translator.js               # Claude API 翻譯模組
│   ├── storage.js                  # 本地存儲管理
│   ├── firebase.js                 # Firebase 整合
│   └── app.js                      # 主應用邏輯
├── firebase-config.template.js     # Firebase 配置模板
├── firebase-config.js              # Firebase 配置（不提交到 Git）
└── README.md                       # 說明文件
```

## 🔒 安全注意事項

- `firebase-config.js` 已加入 `.gitignore`，不會被提交到版本控制系統
- `.env` 文件已加入 `.gitignore`，保護環境變量
- Claude API Key 存儲在瀏覽器 LocalStorage 中，僅在本地使用
- API Key 通過代理服務器傳遞，不會暴露在前端代碼中
- Firebase 安全規則確保用戶只能訪問自己的數據
- 本地數據始終保存在 LocalStorage，作為備份

## ⚠️ 關於 CORS 問題

由於瀏覽器的 CORS（跨域資源共享）安全限制，Claude API 無法直接從瀏覽器調用。本專案提供了 Node.js 代理服務器來解決這個問題：

- **代理服務器的作用**：接收前端請求 → 調用 Claude API → 返回結果給前端
- **安全性**：API Key 不會在網絡請求中暴露，只在本地使用
- **必要性**：這是所有瀏覽器端 AI 應用的標準做法

## 🐛 常見問題

### 1. 翻譯時顯示 "Failed to fetch" 錯誤

**原因**：沒有啟動代理服務器

**解決方案**：
```bash
npm install
npm start
```
然後在 `http://localhost:3000` 訪問應用。

### 2. API Key 測試失敗

**可能原因**：
- API Key 格式不正確（應該以 `sk-ant-` 開頭）
- API Key 已過期或無效
- 沒有足夠的 API 額度

**解決方案**：前往 [Anthropic Console](https://console.anthropic.com/settings/keys) 重新獲取 API Key。

### 3. 首次登入失敗

**原因**：Firebase 配置未設置

**解決方案**：按照上述「啟用跨設備同步」步驟配置 Firebase。

## 📝 授權

本專案採用 MIT 授權。
