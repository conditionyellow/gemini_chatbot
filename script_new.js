document.addEventListener('DOMContentLoaded', () => {
    // Chrome拡張機能のエラーを無視する設定
    window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('runtime.lastError')) {
            event.preventDefault();
            return false;
        }
    });

    // Uncaught runtime.lastError エラーの抑制
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
        // Chrome拡張機能のエラーログを抑制
        console.info('Chrome extension errors are being suppressed for better user experience.');
    }

    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatHistoryElement = document.getElementById('chat-history');
    const live2dCanvas = document.getElementById('live2d-canvas');

    const geminiApiEndpoint = 'https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app/';

    // Live2D関連の変数
    let app;
    let currentModel;
    const modelPath = 'models/live2d/natori_pro/runtime/natori_pro_t06.model3.json';

    // Chat history array as per specification
    let chatHistory = [];

    /**
     * 指定されたテキストを音声で読み上げる
     * @param {string} text 読み上げるテキスト
     */
    function speakMessage(text) {
        if (!('speechSynthesis' in window)) {
            console.warn('Web Speech API (SpeechSynthesis) is not supported in this browser.');
            return;
        }

        // 既存の読み上げがあればキャンセル
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP'; // 言語: 日本語
        utterance.volume = 1.0;   // 音量: 最大
        utterance.rate = 1.0;     // 読み上げ速度: 標準
        utterance.pitch = 1.0;    // 音声の高さ: 標準

        window.speechSynthesis.speak(utterance);
    }

    async function initializeLive2D() {
        try {
            console.log('Live2D初期化を開始します...');
            
            // PIXI Live2D Displayが読み込まれているか確認
            if (!PIXI || !PIXI.live2d) {
                throw new Error('PIXI Live2D Display ライブラリが読み込まれていません');
            }

            const { Live2DModel } = PIXI.live2d;
            
            // キャンバスコンテナの設定
            const live2dContainer = document.querySelector('.live2d-container');
            const canvasWidth = live2dContainer.clientWidth || 400;
            const canvasHeight = live2dContainer.clientHeight || 500;

            // PIXIアプリケーションを作成
            app = new PIXI.Application({
                width: canvasWidth,
                height: canvasHeight,
                backgroundColor: 0xf0f0f0,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            // キャンバスを既存のcanvas要素と置き換え
            live2dCanvas.style.display = 'none';
            live2dContainer.appendChild(app.view);

            console.log('PIXIアプリケーション初期化完了');
            addMessageToDisplay('system', 'Live2D初期化中... モデルを読み込んでいます');

            // Live2Dモデルを読み込み
            currentModel = await Live2DModel.from(modelPath);
            
            if (!currentModel) {
                throw new Error('モデルの読み込みに失敗しました');
            }

            // モデルをステージに追加
            app.stage.addChild(currentModel);

            // モデルの位置とスケールを設定
            positionModel(currentModel, canvasWidth, canvasHeight);

            // クリックイベントを追加
            currentModel.interactive = true;
            currentModel.on('pointerdown', () => {
                if (currentModel && currentModel.internalModel && currentModel.internalModel.motionManager) {
                    // ランダムなモーションを再生
                    const motionGroups = currentModel.internalModel.settings.motions;
                    if (motionGroups && Object.keys(motionGroups).length > 0) {
                        const groupNames = Object.keys(motionGroups);
                        const randomGroup = groupNames[Math.floor(Math.random() * groupNames.length)];
                        const motions = motionGroups[randomGroup];
                        if (motions && motions.length > 0) {
                            const randomMotion = Math.floor(Math.random() * motions.length);
                            currentModel.motion(randomGroup, randomMotion);
                        }
                    }
                }
            });

            console.log('Live2Dモデル読み込み完了:', modelPath);
            addMessageToDisplay('system', 'Live2Dモデルの読み込みが完了しました！クリックして反応を見てみてください。');

            // リサイズイベントリスナーを追加
            window.addEventListener('resize', () => {
                const newWidth = live2dContainer.clientWidth;
                const newHeight = live2dContainer.clientHeight;
                app.renderer.resize(newWidth, newHeight);
                if (currentModel) {
                    positionModel(currentModel, newWidth, newHeight);
                }
            });

        } catch (error) {
            console.error('Live2D初期化エラー:', error);
            addMessageToDisplay('system', `Live2D初期化に失敗しました: ${error.message}`);
            
            // エラー時はプレースホルダーを表示
            showPlaceholder();
        }
    }

    function positionModel(model, canvasWidth, canvasHeight) {
        if (!model) return;
        
        // モデルのスケールを設定（0.3倍）
        const scale = 0.3;
        model.scale.set(scale);
        
        // モデルを中央下部に配置
        model.x = canvasWidth / 2;
        model.y = canvasHeight - (model.height * scale * 0.1); // 少し上に調整
    }

    function showPlaceholder() {
        // プレースホルダー画像を表示
        const live2dContainer = document.querySelector('.live2d-container');
        const canvasWidth = live2dContainer.clientWidth || 400;
        const canvasHeight = live2dContainer.clientHeight || 500;
        
        live2dCanvas.width = canvasWidth;
        live2dCanvas.height = canvasHeight;
        live2dCanvas.style.display = 'block';
        
        const ctx = live2dCanvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.fillStyle = '#888';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Live2Dキャラクター', canvasWidth / 2, canvasHeight / 2 - 10);
            ctx.fillText('(読み込み中またはエラー)', canvasWidth / 2, canvasHeight / 2 + 10);
        }
    }

    function addMessageToDisplay(sender, message, isLoading = false) {
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
            } else {
                // Speak the bot's final message
                speakMessage(message);
                
                // Live2Dモデルにモーションを追加（応答時）
                if (currentModel && currentModel.internalModel && currentModel.internalModel.motionManager) {
                    // "TapBody"グループのモーションを再生（存在する場合）
                    const motionGroups = currentModel.internalModel.settings.motions;
                    if (motionGroups && motionGroups['TapBody']) {
                        const motions = motionGroups['TapBody'];
                        if (motions && motions.length > 0) {
                            const randomMotion = Math.floor(Math.random() * motions.length);
                            currentModel.motion('TapBody', randomMotion);
                        }
                    }
                }
            }
        } else { // system messages
            messageElement.classList.add('system-message');
            messageElement.textContent = message;
        }
        chatHistoryElement.appendChild(messageElement);
        chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
    }

    // Function to add message to the internal history array
    function addMessageToInternalHistory(role, text) {
        chatHistory.push({ role, text });
    }

    async function handleSendMessage() {
        const messageText = userInput.value.trim();
        if (!messageText) return;

        addMessageToDisplay('user', messageText);
        addMessageToInternalHistory('user', messageText);
        userInput.value = '';
        sendButton.disabled = true;

        addMessageToDisplay('bot', '考え中...', true);

        try {
            const requestBody = {
                userMessage: messageText,
                chatHistory: chatHistory.slice(0, -1)
            };

            const response = await fetch(geminiApiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const thinkingMessage = chatHistoryElement.querySelector('.bot-message.thinking');
            if (thinkingMessage) {
                thinkingMessage.remove();
            }

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    errorData = { error: 'サーバーからの応答が不正です。' };
                }
                let errorMessage = `HTTP error! status: ${response.status}`;
                if (errorData && errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.reply) {
                addMessageToDisplay('bot', data.reply);
                addMessageToInternalHistory('model', data.reply);
            } else {
                throw new Error("APIからの応答に 'reply' フィールドが含まれていません。");
            }

        } catch (error) {
            console.error('Error sending message to API:', error);
            const thinkingMessage = chatHistoryElement.querySelector('.bot-message.thinking');
            if (thinkingMessage) {
                thinkingMessage.remove();
            }
            addMessageToDisplay('bot', `エラー: ${error.message}`);
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

    initializeLive2D();
    addMessageToDisplay('system', 'チャットボットへようこそ！');
});

// グローバルエラーハンドリング
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('runtime.lastError')) {
        // Chrome拡張機能関連のエラーは無視
        event.preventDefault();
        return;
    }
    console.error('Unhandled promise rejection:', event.reason);
});

// リソース読み込みエラーのハンドリング
window.addEventListener('error', (event) => {
    if (event.target !== window) {
        // リソース読み込みエラー（画像、スクリプトなど）
        if (event.target.src && event.target.src.includes('favicon.ico')) {
            // favicon エラーは無視（すでに対処済み）
            return;
        }
        console.warn('Resource loading error:', event.target.src || event.target.href);
    }
}, true);
