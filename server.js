// Claude API 代理服務器
// 用於解決瀏覽器 CORS 限制問題

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 啟用 CORS
app.use(cors());

// 解析 JSON 請求體
app.use(express.json());

// 提供靜態文件
app.use(express.static(__dirname));

// Claude API 代理端點
app.post('/api/claude', async (req, res) => {
    try {
        const { apiKey, messages, model, max_tokens } = req.body;

        if (!apiKey) {
            return res.status(400).json({
                error: { message: '缺少 API Key' }
            });
        }

        console.log('Proxying request to Claude API...');
        console.log('Model:', model);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model || 'claude-3-5-sonnet-20241022',
                max_tokens: max_tokens || 1024,
                messages: messages
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Claude API Error:', errorData);
            return res.status(response.status).json(errorData);
        }

        const data = await response.json();
        console.log('Claude API Success');
        res.json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({
            error: {
                message: error.message || '代理服務器錯誤'
            }
        });
    }
});

// 首頁路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 啟動服務器
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('三語翻譯工具代理服務器已啟動！');
    console.log('='.repeat(60));
    console.log(`本地訪問：http://localhost:${PORT}`);
    console.log(`網絡訪問：http://127.0.0.1:${PORT}`);
    console.log('='.repeat(60));
    console.log('提示：請確保已設置 Claude API Key');
    console.log('按 Ctrl+C 停止服務器');
    console.log('='.repeat(60));
});
