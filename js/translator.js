// Claude API 翻譯模組
class ClaudeTranslator {
    constructor() {
        this.apiKey = localStorage.getItem('claudeApiKey') || '';
        // 使用本地代理服務器，避免 CORS 問題
        this.apiEndpoint = '/api/claude';
        this.model = 'claude-3-5-sonnet-20241022';
    }

    // 設置 API Key
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('claudeApiKey', apiKey);
    }

    // 獲取 API Key
    getApiKey() {
        return this.apiKey;
    }

    // 檢查 API Key 是否已設置
    hasApiKey() {
        return this.apiKey && this.apiKey.length > 0;
    }

    // 調用 Claude API 進行翻譯
    async translate(text, sourceLanguage, targetLanguages) {
        if (!this.hasApiKey()) {
            throw new Error('請先設置 Claude API Key');
        }

        // 構建翻譯提示
        const prompt = this.buildTranslationPrompt(text, sourceLanguage, targetLanguages);

        try {
            // 確保 API key 是純 ASCII 字符串
            const apiKey = String(this.apiKey).trim();

            console.log('Calling Claude API via proxy...');
            console.log('API Endpoint:', this.apiEndpoint);
            console.log('Model:', this.model);

            // 通過代理服務器調用 Claude API
            const requestBody = {
                apiKey: apiKey,
                model: this.model,
                max_tokens: 1024,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            };

            const requestOptions = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            };

            const response = await fetch(this.apiEndpoint, requestOptions);

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            if (!response.ok) {
                let errorMessage = 'API 請求失敗';
                try {
                    const errorData = await response.json();
                    console.error('API Error:', errorData);
                    errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
                } catch (e) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('API Response:', data);
            const translationText = data.content[0].text;

            // 解析翻譯結果
            return this.parseTranslationResult(translationText, targetLanguages);
        } catch (error) {
            console.error('Translation failed:', error);

            // 提供更友好的錯誤提示
            if (error.message.includes('Failed to fetch')) {
                throw new Error('無法連接到 Claude API。請檢查：\n1. 網絡連接是否正常\n2. API Key 是否正確\n3. 是否有 CORS 限制（建議使用代理服務器）');
            } else if (error.message.includes('401')) {
                throw new Error('API Key 無效，請檢查您的 API Key 是否正確');
            } else if (error.message.includes('429')) {
                throw new Error('API 請求次數過多，請稍後再試');
            } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
                throw new Error('Claude API 服務暫時不可用，請稍後再試');
            }

            throw error;
        }
    }

    // 構建翻譯提示詞
    buildTranslationPrompt(text, sourceLanguage, targetLanguages) {
        const languageMap = {
            'zh-TW': '繁體中文',
            'zh-CN': '簡體中文',
            'en': '英文',
            'ko': '韓文'
        };

        const targetLangNames = targetLanguages.map(lang => languageMap[lang]).join('、');

        return `請將以下${languageMap[sourceLanguage]}翻譯成${targetLangNames}。

原文：${text}

請按照以下格式回覆（只輸出翻譯結果，不要其他說明）：

${targetLanguages.includes('zh-TW') ? '繁體中文：[翻譯結果]\n' : ''}${targetLanguages.includes('zh-CN') ? '簡體中文：[翻譯結果]\n' : ''}${targetLanguages.includes('en') ? '英文：[翻譯結果]\n' : ''}${targetLanguages.includes('ko') ? '韓文：[翻譯結果]' : ''}`;
    }

    // 解析翻譯結果
    parseTranslationResult(text, targetLanguages) {
        const result = {
            traditional: '',
            simplified: '',
            english: '',
            korean: ''
        };

        const lines = text.trim().split('\n');

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('繁體中文：')) {
                result.traditional = trimmedLine.replace('繁體中文：', '').trim();
            } else if (trimmedLine.startsWith('簡體中文：')) {
                result.simplified = trimmedLine.replace('簡體中文：', '').trim();
            } else if (trimmedLine.startsWith('英文：')) {
                result.english = trimmedLine.replace('英文：', '').trim();
            } else if (trimmedLine.startsWith('韓文：')) {
                result.korean = trimmedLine.replace('韓文：', '').trim();
            }
        });

        return result;
    }

    // 智能檢測源語言
    detectLanguage(text) {
        // 簡單的語言檢測
        const hasKorean = /[\u3131-\uD79D]/.test(text);
        const hasChinese = /[\u4e00-\u9fa5]/.test(text);
        const hasEnglish = /[a-zA-Z]/.test(text);

        if (hasKorean) return 'ko';
        if (hasChinese) {
            // 簡單判斷繁簡體（這個邏輯可以優化）
            const simplifiedChars = /[个为这样们]/;
            return simplifiedChars.test(text) ? 'zh-CN' : 'zh-TW';
        }
        if (hasEnglish) return 'en';

        return 'zh-TW'; // 預設繁體中文
    }

    // 自動翻譯（檢測語言並翻譯到其他三種語言）
    async autoTranslate(text) {
        const sourceLang = this.detectLanguage(text);

        // 目標語言為除了源語言之外的所有語言
        const allLanguages = ['zh-TW', 'zh-CN', 'en', 'ko'];
        const targetLanguages = allLanguages.filter(lang => lang !== sourceLang);

        const result = await this.translate(text, sourceLang, targetLanguages);

        // 補充源語言的內容
        if (sourceLang === 'zh-TW') {
            result.traditional = text;
        } else if (sourceLang === 'zh-CN') {
            result.simplified = text;
        } else if (sourceLang === 'en') {
            result.english = text;
        } else if (sourceLang === 'ko') {
            result.korean = text;
        }

        return result;
    }
}
