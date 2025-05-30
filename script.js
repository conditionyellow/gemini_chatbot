// script.js (Webページ用)

// Cloud FunctionsのエンドポイントURL
// ★★★ ここにあなたのGoogle Cloud FunctionsのURLを貼り付けてください ★★★
// 例: "https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app"
const CLOUD_FUNCTION_URL = "https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app";

// HTML要素の参照
const chatHistoryDiv = document.getElementById('chat-history');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// チャット履歴を保持する配列
let chatMessages = [];

// Web Speech APIのSpeechSynthesisUtteranceオブジェクトを保持する変数
let utterance = null; 

// メッセージをチャット履歴UIに追加し、必要であれば読み上げる関数
function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    
    if (sender === 'user') {
        messageDiv.innerHTML = `<strong>あなた：</strong> ${text}`;
    } else { // sender === 'bot' の場合
        messageDiv.innerHTML = `<strong>SAGE：</strong> ${text}`;
        // ★★★ ここから音声読み上げ機能の追加 ★★★
        readOutLoud(text); // SAGEの返答を読み上げる
        // ★★★ ここまで音声読み上げ機能の追加 ★★★
    }

    chatHistoryDiv.appendChild(messageDiv);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

// ★★★ 音声読み上げ専用の関数を追加 ★★★
function readOutLoud(message) {
    // 既に読み上げ中の音声があれば停止
    if (utterance && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'ja-JP'; // 日本語を設定 (必要であれば 'en-US' などに変更)
    utterance.volume = 1;      // 音量 (0 to 1)
    utterance.rate = 1;        // 読み上げ速度 (0.1 to 10)
    utterance.pitch = 1;       // 声の高さ (0 to 2)

    // 読み上げを開始
    window.speechSynthesis.speak(utterance);
}
// ★★★ 音声読み上げ専用の関数を追加ここまで ★★★

// Live2D関連の定数
const MODEL_PATH = 'path/to/your/model.model3.json';
let currentModel = null;

// 感情マッピング
const EMOTION_MAPPING = {
  happy: ['笑顔', '嬉しい', '楽しい', '素晴らしい'],
  sad: ['悲しい', '残念', '申し訳ない'],
  angry: ['怒り', '不満', '困った'],
  surprised: ['驚き', '意外', 'すごい'],
  normal: ['はい', 'です', 'ます'] // デフォルト
};

// Live2Dモデルの初期化
async function initializeLive2D() {
  try {
    const app = new PIXI.Application({
      view: document.getElementById('live2d-canvas'),
      autoStart: true,
      backgroundColor: 0x000000,
      transparent: true
    });

    currentModel = await PIXI.live2d.Live2DModel.from(MODEL_PATH);
    app.stage.addChild(currentModel);
    
    // モデルのサイズと位置を調整
    currentModel.scale.set(0.5);
    currentModel.position.set(app.view.width / 2, app.view.height / 2);
    
    updateDebugInfo('Live2Dモデルの初期化成功');
  } catch (error) {
    console.error('Live2Dモデル初期化エラー:', error);
    updateDebugInfo(`Live2Dモデル初期化エラー: ${error.message}`);
  }
}

// テキストから感情を分析する関数
function analyzeEmotion(text) {
  for (const [emotion, keywords] of Object.entries(EMOTION_MAPPING)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return emotion;
    }
  }
  return 'normal';
}

// モデルの感情表現を設定
function setModelEmotion(emotion) {
  if (!currentModel) return;
  
  try {
    // 対応する表情パラメータを設定
    switch (emotion) {
      case 'happy':
        currentModel.expression('happy');
        currentModel.motion('motion', 'happy');
        break;
      case 'sad':
        currentModel.expression('sad');
        currentModel.motion('motion', 'sad');
        break;
      case 'angry':
        currentModel.expression('angry');
        currentModel.motion('motion', 'angry');
        break;
      case 'surprised':
        currentModel.expression('surprised');
        currentModel.motion('motion', 'surprised');
        break;
      default:
        currentModel.expression('normal');
        currentModel.motion('motion', 'idle');
    }
  } catch (error) {
    console.error('感情表現エラー:', error);
    updateDebugInfo(`感情表現エラー: ${error.message}`);
  }
}

// Cloud Functions経由でGemini APIへのリクエストを送信する非同期関数
async function sendMessageToCloudFunction(message) {
    appendMessage('user', message);

    const thinkingMessageDiv = document.createElement('div');
    thinkingMessageDiv.classList.add('message', 'bot-message');
    thinkingMessageDiv.innerHTML = `<strong>SAGE：</strong> 思考中...`;
    chatHistoryDiv.appendChild(thinkingMessageDiv);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

    sendButton.disabled = true;

    chatMessages.push({ role: 'user', text: message });

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userMessage: message,
                chatHistory: chatMessages.slice(0, -1)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Cloud Functionエラー:', errorData);
            throw new Error(`Cloud Functionリクエストが失敗しました: ${response.status} ${response.statusText} - ${errorData.error ? errorData.error.details : '詳細不明'}`);
        }

        const data = await response.json();
        const botResponseText = data.reply;

        chatHistoryDiv.removeChild(thinkingMessageDiv);

        appendMessage('bot', botResponseText); // ボットの応答をUIに表示し、ここで読み上げも実行される

        const emotion = analyzeEmotion(botResponseText);
        setModelEmotion(emotion);

        chatMessages.push({ role: 'model', text: botResponseText });

    } catch (error) {
        console.error('チャットボットエラー:', error);
        if (chatHistoryDiv.contains(thinkingMessageDiv)) {
             chatHistoryDiv.removeChild(thinkingMessageDiv);
        }
        appendMessage('bot', 'エラーが発生しました。もう一度お試しください。');
    } finally {
        sendButton.disabled = false;
        userInput.value = '';
    }
}

// 送信ボタンがクリックされた時のイベントリスナー
sendButton.addEventListener('click', () => {
    const message = userInput.value.trim();
    if (message) {
        sendMessageToCloudFunction(message);
    }
});

// 入力欄でEnterキーが押された時のイベントリスナー
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !sendButton.disabled) {
        const message = userInput.value.trim();
        if (message) {
            sendMessageToCloudFunction(message);
        }
    }
});

// DOMContentLoaded イベントリスナーを修正
document.addEventListener('DOMContentLoaded', async () => {
  await initializeLive2D();
});