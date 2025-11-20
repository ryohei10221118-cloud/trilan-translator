// Firebase 配置文件模板
// 請將此文件重命名為 firebase-config.js 並填入您的 Firebase 配置信息

/*
如何獲取 Firebase 配置：
1. 前往 https://console.firebase.google.com/
2. 選擇您的專案（或創建新專案）
3. 點擊專案設定（齒輪圖標） > 專案設定
4. 在「您的應用程式」區域，點擊「網頁應用程式」圖標 </>
5. 註冊應用程式後，複製 firebaseConfig 物件
6. 將下方的配置替換為您的配置
*/

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

/*
重要：啟用 Firestore 和 Authentication
1. 在 Firebase Console 中，點擊左側選單的「Firestore Database」
2. 點擊「建立資料庫」，選擇「以測試模式啟動」（之後可以修改規則）
3. 點擊左側選單的「Authentication」
4. 點擊「開始使用」
5. 在「登入方式」標籤中，啟用「Google」登入提供者
6. 填入專案的公開名稱和支援電子郵件
*/

// Firestore 安全規則建議（在 Firebase Console > Firestore Database > 規則）：
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 只允許已登入的用戶讀寫自己的資料
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
*/
