document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatHistory = document.getElementById('chat-history');
    const live2dCanvas = document.getElementById('live2d-canvas');

    // Gemini APIバックエンドのURL（実際のCloud FunctionのURLに置き換えてください）
    const geminiApiEndpoint = 'https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app/api/chat'; // 例: 'https://your-region-project-id.cloudfunctions.net/geminiChat'

    // Live2Dモデルのパス (index.htmlからの相対パス)
    const modelPath = 'live2d-models/natori_pro_jp/runtime/';
    const modelJsonFileName = 'natori_pro_t06.model3.json'; // 使用するモデルのjsonファイル名

    let live2DManager = null; // Live2Dの管理オブジェクト用

    // --- Live2D 初期化処理 (プレースホルダー) ---
    async function initializeLive2D() {
        if (!window.Live2DCubismCore || !window.Live2DCubismFramework) {
            console.error('Live2D SDK not loaded.');
            addMessageToHistory('system', 'Live2D SDKの読み込みに失敗しました。');
            return;
        }
        
        // Live2Dキャンバスのサイズ設定
        const live2dContainer = document.querySelector('.live2d-container');
        if (live2dContainer) {
            live2dCanvas.width = live2dContainer.clientWidth;
            live2dCanvas.height = live2dContainer.clientHeight;
        } else {
            live2dCanvas.width = 400; // デフォルト値
            live2dCanvas.height = 500; // デフォルト値
        }


        // ここからLive2Dモデルのロードと表示処理を記述します。
        // Live2D SDKのサンプル (CubismWebSamples) を参考に、LAppLive2DManagerのような
        // モデル管理クラスを作成・利用するか、CubismFrameworkのAPIを直接使用します。
        // 以下は非常に簡略化された概念的な流れです。

        try {
            // Live2D Frameworkの初期化
            const cubismOption = new Live2DCubismFramework.Option();
            // cubismOption.logFunction = console.log; // 必要に応じてログ関数を設定
            // cubismOption.loggingLevel = Live2DCubismFramework.LogLevel.LogLevel_Verbose; // ログレベル
            Live2DCubismFramework.CubismFramework.startUp(cubismOption);
            Live2DCubismFramework.CubismFramework.initialize();

            // モデルのロード (実際には LAppModel や CubismModel を使用)
            // この部分はSDKのサンプルを元に大幅な実装が必要です
            addMessageToHistory('system', 'Live2Dモデルの初期化処理を開始します...(この部分は詳細な実装が必要です)');
            console.log(`Attempting to load model: ${modelPath}${modelJsonFileName}`);

            // --- ここにLive2Dモデルロード、モーション管理、描画ループなどの詳細実装 ---
            // 例:
            // 1. .model3.json をフェッチしてパース
            // 2. CubismModel.create でモデルインスタンス作成
            // 3. モーション、表情ファイルのロードと管理 (CubismMotionManager, CubismExpressionMotion)
            // 4. レンダラーのセットアップ (WebGL)
            // 5. 描画ループ (requestAnimationFrame) でモデルの更新と描画

            // 簡単な成功メッセージ (実際にはモデルが描画されてから)
            // addMessageToHistory('system', 'Live2Dモデルの準備ができました。');

        } catch (error) {
            console.error('Live2D Initialization Error:', error);
            addMessageToHistory('system', `Live2Dの初期化に失敗しました: ${error.message}`);
        }
    }

    // --- チャット処理 ---
    function addMessageToHistory(sender, message, isLoading = false) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        if (sender === 'user') {
            messageElement.classList.add('user-message');
            messageElement.textContent = message;
        } else if (sender === 'bot') {
            messageElement.classList.add('bot-message');
            messageElement.textContent = message;
            if (isLoading) {
                messageElement.classList.add('thinking');
            }
        } else { // system messages
            messageElement.classList.add('system-message');
            messageElement.textContent = message;
        }
        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight; // 自動スクロール
    }

    async function handleSendMessage() {
        const messageText = userInput.value.trim();
        if (!messageText) return;

        addMessageToHistory('user', messageText);
        userInput.value = '';
        sendButton.disabled = true;

        addMessageToHistory('bot', '考え中...', true);

        try {
            const response = await fetch(geminiApiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: messageText }),
            });

            // 古い「考え中...」メッセージを削除 (オプション)
            const thinkingMessage = chatHistory.querySelector('.bot-message.thinking');
            if (thinkingMessage) {
                thinkingMessage.remove();
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'サーバーエラーが発生しました。' }));
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            addMessageToHistory('bot', data.reply);

            // --- Live2D 感情表現のトリガー (プレースホルダー) ---
            // Geminiからの応答 (data.reply や、もしあれば感情データ) に基づいて
            // Live2Dモデルの表情やモーションを変更します。
            // 例: if (data.emotion === 'happy') { live2DManager.startMotion('Happy'); }
            // この部分はLive2Dの具体的な実装に依存します。

        } catch (error) {
            console.error('Error sending message to API:', error);
            const thinkingMessage = chatHistory.querySelector('.bot-message.thinking');
            if (thinkingMessage) {
                thinkingMessage.remove();
            }
            addMessageToHistory('bot', `エラー: ${error.message}`);
        } finally {
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    sendButton.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSendMessage();
        }
    });

    // --- 初期化処理の呼び出し ---
    initializeLive2D();
    addMessageToHistory('system', 'チャットボットへようこそ！');
});