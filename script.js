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

// Live2D関連の変数
let app = null;
let currentModel = null;

// Live2Dモデルのパス（ケイモデル用）
const MODEL_PATH = './live2d-models/kei/kei.model3.json';

// 感情マッピング
const EMOTION_MAPPING = {
  happy: ['笑顔', '嬉しい', '楽しい', '素晴らしい', 'ありがとう', '良い', 'すごい'],
  sad: ['悲しい', '残念', '申し訳ない', 'すみません', '困った', '大変'],
  surprised: ['驚き', '意外', 'びっくり', 'まさか', 'え？', '本当に'],
  normal: ['はい', 'です', 'ます', 'こんにちは', 'わかりました'] // デフォルト
};

// デバッグ情報を表示する関数
function updateDebugInfo(message) {
    console.log('[Live2D Debug]:', message);
}

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

// Live2Dモデルの初期化
async function initializeLive2D() {
    try {
        updateDebugInfo('=== Live2D初期化開始 ===');
        
        // Live2D SDKが利用可能かチェック
        if (typeof LIVE2DCUBISMCORE === 'undefined') {
            throw new Error('Live2D Cubism Core が読み込まれていません');
        }
        
        if (typeof PIXI === 'undefined') {
            throw new Error('PIXI.js が読み込まれていません');
        }
        
        if (!PIXI.live2d) {
            throw new Error('PIXI Live2D プラグインが読み込まれていません');
        }

        // PIXIアプリケーションの作成
        const canvas = document.getElementById('live2d-canvas');
        if (!canvas) {
            throw new Error('live2d-canvas 要素が見つかりません');
        }

        updateDebugInfo('PIXIアプリケーションを作成中...');
        app = new PIXI.Application({
            view: canvas,
            width: 400,
            height: 600,
            backgroundColor: 0x000000,
            transparent: true,
            antialias: true
        });
        updateDebugInfo('PIXIアプリケーション作成完了');

        // Live2Dモデルの読み込み
        updateDebugInfo(`Live2Dモデルを読み込み中: ${MODEL_PATH}`);
        
        // モデルファイルの存在確認
        try {
            const response = await fetch(MODEL_PATH);
            if (!response.ok) {
                throw new Error(`モデルファイルが見つかりません: ${response.status} ${response.statusText}`);
            }
            updateDebugInfo('モデルファイルの存在を確認');
        } catch (fetchError) {
            throw new Error(`モデルファイルへのアクセスに失敗: ${fetchError.message}`);
        }
        
        // Live2D Cubism SDK 4.x の正しい読み込み方法
        currentModel = await PIXI.live2d.Live2DModel.from(MODEL_PATH, {
            autoInteract: true,
            autoUpdate: true
        });
        
        if (!currentModel) {
            throw new Error('モデルの読み込みに失敗しました');
        }
        
        updateDebugInfo('Live2Dモデル読み込み完了');

        // モデルをステージに追加
        app.stage.addChild(currentModel);
        updateDebugInfo('モデルをステージに追加');
        
        // モデルのサイズと位置を調整
        const scale = Math.min(
            app.view.width / currentModel.width,
            app.view.height / currentModel.height
        ) * 0.8;
        
        currentModel.scale.set(scale);
        currentModel.x = app.view.width * 0.5;
        currentModel.y = app.view.height * 0.9;
        currentModel.anchor.set(0.5, 1);
        
        updateDebugInfo(`モデルサイズ調整完了 - スケール: ${scale}`);

        // モデルにインタラクション機能を追加
        currentModel.interactive = true;
        currentModel.on('pointerdown', () => {
            updateDebugInfo('モデルがタップされました');
            // タップされた時のランダムモーション
            if (currentModel.internalModel && currentModel.internalModel.motionManager) {
                const motionGroup = 'TapBody';
                const motionCount = currentModel.internalModel.motionManager.getMotionCount(motionGroup);
                if (motionCount > 0) {
                    const motionIndex = Math.floor(Math.random() * motionCount);
                    currentModel.motion(motionGroup, motionIndex);
                    updateDebugInfo(`タップモーション再生: ${motionGroup}[${motionIndex}]`);
                }
            }
        });

        updateDebugInfo('=== Live2D初期化成功 ===');
        
        // モデル情報をログ出力
        updateDebugInfo(`モデル名: ${currentModel.internalModel?.settings?.name || '不明'}`);
        updateDebugInfo(`モデルサイズ: ${currentModel.width} x ${currentModel.height}`);
        
        // 初期アイドルモーションを開始
        setTimeout(() => {
            setModelEmotion('normal');
        }, 1000);

    } catch (error) {
        console.error('Live2Dモデル初期化エラー:', error);
        updateDebugInfo(`=== Live2D初期化エラー ===`);
        updateDebugInfo(`エラー詳細: ${error.message}`);
        updateDebugInfo(`スタックトレース: ${error.stack}`);
        
        // エラー時の代替表示
        const canvas = document.getElementById('live2d-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ff6b6b';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Live2Dモデル読み込みエラー', canvas.width / 2, canvas.height / 2);
                ctx.fillText('コンソールを確認してください', canvas.width / 2, canvas.height / 2 + 30);
                ctx.fillText(error.message, canvas.width / 2, canvas.height / 2 + 60);
            }
        }
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
    if (!currentModel || !currentModel.internalModel) {
        updateDebugInfo('モデルが初期化されていません');
        return;
    }
    
    try {
        updateDebugInfo(`感情を設定中: ${emotion}`);
        
        // 表情の設定
        if (currentModel.internalModel.expressionManager) {
            let expressionId = '';
            switch (emotion) {
                case 'happy':
                    expressionId = 'f01'; // 笑顔の表情ID
                    break;
                case 'sad':
                    expressionId = 'f02'; // 悲しい表情ID
                    break;
                case 'surprised':
                    expressionId = 'f03'; // 驚きの表情ID
                    break;
                default:
                    expressionId = 'f00'; // 通常の表情ID
                    break;
            }
            
            currentModel.expression(expressionId);
        }

        // モーションの設定
        if (currentModel.internalModel.motionManager) {
            let motionGroup = '';
            let motionIndex = 0;
            
            switch (emotion) {
                case 'happy':
                    motionGroup = 'Idle';
                    motionIndex = 0;
                    break;
                case 'sad':
                    motionGroup = 'Idle';
                    motionIndex = 1;
                    break;
                case 'surprised':
                    motionGroup = 'TapBody';
                    motionIndex = 0;
                    break;
                default:
                    motionGroup = 'Idle';
                    motionIndex = 0;
                    break;
            }
            
            // モーションの再生
            currentModel.motion(motionGroup, motionIndex, LIVE2DCUBISMFRAMEWORK.Priority.Normal);
        }

        updateDebugInfo(`感情設定完了: ${emotion}`);
        
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

        // 感情分析とモデルの感情表現設定
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

// DOMContentLoaded イベントリスナー
document.addEventListener('DOMContentLoaded', async () => {
    updateDebugInfo('DOM読み込み完了、Live2D初期化開始');
    
    // SDKの読み込み状況をチェック
    updateDebugInfo(`LIVE2DCUBISMCORE: ${typeof LIVE2DCUBISMCORE !== 'undefined' ? '✓' : '✗'}`);
    updateDebugInfo(`PIXI: ${typeof PIXI !== 'undefined' ? '✓' : '✗'}`);
    updateDebugInfo(`PIXI.live2d: ${typeof PIXI !== 'undefined' && PIXI.live2d ? '✓' : '✗'}`);
    
    // Canvas要素の存在確認
    const canvas = document.getElementById('live2d-canvas');
    updateDebugInfo(`Canvas要素: ${canvas ? '✓' : '✗'}`);
    
    // Live2D SDKの読み込み待機
    if (typeof LIVE2DCUBISMCORE !== 'undefined' && typeof PIXI !== 'undefined' && PIXI.live2d) {
        await initializeLive2D();
    } else {
        // SDKが読み込まれるまで待機
        let attempts = 0;
        const maxAttempts = 50;
        const checkInterval = setInterval(async () => {
            attempts++;
            updateDebugInfo(`SDK読み込み待機中... (${attempts}/${maxAttempts})`);
            
            if (typeof LIVE2DCUBISMCORE !== 'undefined' && typeof PIXI !== 'undefined' && PIXI.live2d) {
                clearInterval(checkInterval);
                updateDebugInfo('全てのSDKが読み込まれました');
                await initializeLive2D();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                updateDebugInfo('Live2D SDK の読み込みがタイムアウトしました');
                updateDebugInfo('以下のSDKが不足している可能性があります:');
                updateDebugInfo(`- LIVE2DCUBISMCORE: ${typeof LIVE2DCUBISMCORE !== 'undefined' ? '✓' : '✗'}`);
                updateDebugInfo(`- PIXI: ${typeof PIXI !== 'undefined' ? '✓' : '✗'}`);
                updateDebugInfo(`- PIXI.live2d: ${typeof PIXI !== 'undefined' && PIXI.live2d ? '✓' : '✗'}`);
            }
        }, 100);
    }
});