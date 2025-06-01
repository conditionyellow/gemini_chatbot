// API接続テストスクリプト
const fetch = require('node-fetch');

const geminiApiEndpoint = 'https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app/';

async function testBasicAPI() {
    console.log('=== Testing basic API call ===');
    try {
        console.log('Sending request to:', geminiApiEndpoint);
        const requestBody = {
            userMessage: 'こんにちは',
            chatHistory: []
        };
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(geminiApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response status text:', response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data = await response.json();
            console.log('Success! Response data:', data);
        } else {
            const errorText = await response.text();
            console.log('Error response:', errorText);
        }
    } catch (error) {
        console.error('Fetch error:', error.message);
        console.error('Full error:', error);
    }
}

async function testPersonaAPI() {
    console.log('\n=== Testing persona API call ===');
    try {
        console.log('Sending persona request to:', geminiApiEndpoint);
        const requestBody = {
            userMessage: 'こんにちは',
            chatHistory: [],
            modelId: 'natori',
            persona: {
                name: 'ナトリ',
                systemPrompt: 'あなたは「ナトリ」という名前の優しくて知的なAIアシスタントです。',
                personality: '優しくて知的な女性。親しみやすく、丁寧な言葉遣いを心がける。',
                specialties: ['日常会話', '学習サポート', '心理カウンセリング'],
                speakingStyle: '敬語を基調としつつも親しみやすい口調。'
            }
        };
        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch(geminiApiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Response status:', response.status);
        console.log('Response status text:', response.statusText);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
            const data = await response.json();
            console.log('Success! Response data:', data);
        } else {
            const errorText = await response.text();
            console.log('Error response:', errorText);
        }
    } catch (error) {
        console.error('Fetch error:', error.message);
        console.error('Full error:', error);
    }
}

// テスト実行
console.log('Starting API tests...\n');
testBasicAPI()
    .then(() => testPersonaAPI())
    .then(() => console.log('\n=== Tests completed ==='))
    .catch(error => console.error('Test runner error:', error));
