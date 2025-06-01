// Google Cloud Run (Node.js) - Updated for Persona System

// 必要なモジュールをインポート
const { GoogleGenerativeAI } = require('@google/generative-ai');
const express = require('express');

// Express アプリケーションを初期化
const app = express();

// JSONボディパーサーを設定
app.use(express.json());

// 環境変数からAPIキーを取得
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.0-flash"; // または 'gemini-1.5-pro-latest' など
const PORT = process.env.PORT || 8080;

// Gemini APIクライアントを初期化
const genAI = new GoogleGenerativeAI(API_KEY);

// Cloud Runのメインエンドポイント
app.all('/chat', async (req, res) => {
    // CORS設定
    res.set('Access-Control-Allow-Origin', '*');

    // プリフライトリクエストの処理
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }

    // POSTリクエストの処理
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // リクエストボディから情報を取得
    const { message, userMessage, chatHistory = [], modelId, persona } = req.body;
    const messageText = message || userMessage; // フロントエンドのmessageパラメータに対応

    if (!messageText) {
        return res.status(400).json({ error: 'message or userMessage is required' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        // Gemini APIのチャット形式に変換
        const historyForGemini = chatHistory.map(item => ({
            role: item.role,
            parts: [{ text: item.text }]
        }));

        // システムプロンプトの決定
        let systemPrompt;
        
        if (persona && persona.systemPrompt) {
            // 新しいペルソナシステム: フロントエンドからのペルソナ情報を使用
            systemPrompt = persona.systemPrompt;
            console.log(`Using persona system prompt for model: ${modelId}, persona: ${persona.name}`);
        } else if (modelId) {
            // フォールバック: モデルIDに基づくシステムプロンプト
            systemPrompt = getSystemPromptByModelId(modelId);
            console.log(`Using fallback system prompt for model: ${modelId}`);
        } else {
            // デフォルト: 既存のシステムプロンプト
            systemPrompt = `あなたは超高齢化社会の抱える問題に関する専門家です。日本そして世界中が直面する超高齢化社会の問題について質問されたら、詳しく答えてください。
            特に、高齢者が健康で幸福に生きられる方法や、高齢者の孤立化対策に関する事柄には積極的に反応してください。
            質問に対しては、常に丁寧語で、語尾には「〜ですよ」や「〜ですね」を多用してください。
            回答には必ずエビデンスを用意してください。
            ただし、個人的な意見や感想は控えめにし、客観的な情報提供を心がけてください。`;
            console.log('Using default system prompt');
        }

        let finalHistoryForGemini = historyForGemini;
        // Safeguard: If a system instruction is present (which it always is here),
        // and history is not empty and starts with a model role, adjust it.
        // Gemini API expects history to alternate roles, effectively starting with 'user'
        // or being empty when a systemInstruction is used.
        if (finalHistoryForGemini.length > 0 && finalHistoryForGemini[0].role === 'model') {
            console.warn("Chat history from client starts with a 'model' role. Adjusting history for Gemini API compliance.");
            const firstUserMessageIndex = finalHistoryForGemini.findIndex(msg => msg.role === 'user');
            if (firstUserMessageIndex !== -1) {
                finalHistoryForGemini = finalHistoryForGemini.slice(firstUserMessageIndex);
                console.log(`Adjusted history now starts at user message index ${firstUserMessageIndex} (original array). New length: ${finalHistoryForGemini.length}`);
            } else {
                // History contains only model messages
                finalHistoryForGemini = [];
                console.log("Adjusted history: Cleared as it contained only 'model' messages after the initial one(s).");
            }
        }

        const chat = model.startChat({
            history: finalHistoryForGemini, // Use the adjusted history
            generationConfig: {
                maxOutputTokens: 200,
            },
            systemInstruction: {
                role: "system",
                parts: [{ text: systemPrompt }]
            }
        });

        const result = await chat.sendMessage(messageText);
        const responseText = result.response.text();

        // 成功ログ
        console.log(`Successfully processed message from ${persona?.name || 'default'} (${modelId || 'no-model'})`);

        // クライアントに応答を返す
        res.status(200).json({ reply: responseText });

    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// サーバーを開始
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
});

// モジュールエクスポート（Cloud Functionsとの互換性のため）
exports.chatbotProxy = app;

// モデルIDに基づくシステムプロンプトのフォールバック関数
function getSystemPromptByModelId(modelId) {
    const modelPrompts = {
        'natori': 'あなたは「ナトリ」という名前の優しくて知的なAIアシスタントです。親しみやすく丁寧な言葉遣いで、ユーザーの学習や日常の悩みをサポートします。敬語を基調としつつも親しみやすい口調で話してください。',
        'mark': 'あなたは「マーク」という名前のクールで理論的なAIアシスタントです。技術相談やプログラミング、データ分析を得意とします。簡潔で要点を突いた話し方をし、論理的で効率的なソリューションを提供してください。',
        'hiyori': 'あなたは「ひより」という名前の明るく元気なAIアシスタントです。好奇心旺盛で前向きな性格で、エンターテイメントやクリエイティブな話題が得意です。カジュアルで親しみやすい口調で、感嘆詞を交えながら楽しく会話してください。',
        'kei': 'あなたは「ケイ」という名前の落ち着いた知的なAIアシスタントです。文学や芸術、哲学に造詣が深く、創作支援や文章添削を得意とします。上品で文学的な表現を用い、やや古風な敬語で話してください。',
        'miku': 'あなたは「ミク」という名前の活発で音楽好きなAIアシスタントです。テクノロジーとクリエイティブな分野、特に音楽やボーカロイド文化に詳しいです。元気で現代的な若者言葉を使って、楽しく会話してください。',
        'simple': 'あなたは「シンプル」という名前のAIアシスタントです。簡潔で分かりやすい回答を心がけ、実用的なアドバイスを提供します。無駄のない効率的なコミュニケーションで、標準的な敬語を使用してください。',
        'epsilon': 'あなたは「イプシロン」という名前の未来的で科学的思考を持つAIアシスタントです。科学、宇宙、先進技術、数学、物理学を得意分野とします。論理的で学術的な口調で、科学的根拠に基づいた回答を提供してください。'
    };
    
    return modelPrompts[modelId] || modelPrompts['natori']; // デフォルトはnatori
}
