document.addEventListener('DOMContentLoaded', () => {
    // Chrome拡張機能のエラーを抑制
    window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('runtime.lastError')) {
            event.preventDefault();
            return false;
        }
    });

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
        // Chrome拡張機能のエラーログを抑制
    }

    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatHistoryElement = document.getElementById('chat-history');
    const live2dCanvas = document.getElementById('live2d-canvas');

    const geminiApiEndpoint = 'https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app/';

    let chatHistory = [];

    /**
     * テキストを音声で読み上げる
     */
    function speakMessage(text) {
        if (!('speechSynthesis' in window)) {
            console.warn('Web Speech API (SpeechSynthesis) is not supported in this browser.');
            return;
        }

        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.volume = 1.0;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    }

    // Live2D関連の変数
    let app;
    let currentModel;
    let modelOriginalSize = { width: 0, height: 0 };
    let resizeTimeout;

    async function initializeLive2D(modelPath) {
        try {
            if (!PIXI || !PIXI.live2d) {
                throw new Error('PIXI Live2D Display ライブラリが読み込まれていません');
            }
            const { Live2DModel } = PIXI.live2d;
            const live2dContainer = document.querySelector('.live2d-container');
            const canvasWidth = live2dContainer.clientWidth || 400;
            const canvasHeight = live2dContainer.clientHeight || 500;

            // PIXIアプリが未生成なら生成
            if (!app) {
                app = new PIXI.Application({
                    width: canvasWidth,
                    height: canvasHeight,
                    backgroundColor: 0xffffff,
                    backgroundAlpha: 1.0,
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true
                });
                const live2dCanvas = document.getElementById('live2d-canvas');
                live2dCanvas.style.display = 'none';
                live2dContainer.appendChild(app.view);
                app.view.style.display = 'block';
                app.view.style.width = '100%';
                app.view.style.height = '100%';
            }

            // 既存モデルがあれば破棄
            if (currentModel) {
                try {
                    app.stage.removeChild(currentModel);
                    // Defensive: check destroy exists and is a function
                    if (typeof currentModel.destroy === 'function') {
                        currentModel.destroy();
                    }
                } catch (e) {
                    console.warn('Error during Live2D model destroy:', e);
                }
                currentModel = null;
            }

            addMessageToDisplay('system', 'Live2D初期化中... モデルを読み込んでいます');
            currentModel = await Live2DModel.from(modelPath);
            if (!currentModel) throw new Error('モデルの読み込みに失敗しました');
            modelOriginalSize.width = currentModel.width;
            modelOriginalSize.height = currentModel.height;
            app.stage.addChild(currentModel);
            positionModel(currentModel, canvasWidth, canvasHeight);
            currentModel.eventMode = 'static';
            currentModel.cursor = 'pointer';
            currentModel.on('pointerdown', () => {
                if (currentModel && currentModel.internalModel && currentModel.internalModel.motionManager) {
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
            addMessageToDisplay('system', 'Live2Dモデルの読み込みが完了しました！クリックして反応を見てみてください。');
            setTimeout(() => { handleResize(); }, 100);
            window.addEventListener('resize', () => {
                if (resizeTimeout) clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => { handleResize(); }, 100);
            });
            window.addEventListener('orientationchange', () => {
                if (resizeTimeout) clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => { handleResize(); }, 200);
            });
            function handleResize() {
                try {
                    if (!app || !live2dContainer) return;
                    const newWidth = live2dContainer.clientWidth;
                    const newHeight = live2dContainer.clientHeight;
                    if (newWidth <= 0 || newHeight <= 0) return;
                    app.renderer.resize(newWidth, newHeight);
                    app.view.style.width = '100%';
                    app.view.style.height = '100%';
                    if (currentModel) positionModel(currentModel, newWidth, newHeight);
                    if (app.renderer && app.stage) app.renderer.render(app.stage);
                } catch (error) { console.error('Error during resize:', error); }
            }
        } catch (error) {
            console.error('Live2D初期化エラー:', error);
            addMessageToDisplay('system', `Live2D初期化に失敗しました: ${error.message}`);
            showPlaceholder();
        }
    }

    function positionModel(model, canvasWidth, canvasHeight) {
        if (!model) {
            console.warn('Model is not available for positioning');
            return;
        }
        
        try {
            // 保存されたオリジナルサイズを使用、存在しない場合は現在のサイズをフォールバック
            let originalWidth = modelOriginalSize.width || model.width || 300;
            let originalHeight = modelOriginalSize.height || model.height || 400;
            
            // オリジナルサイズがまだ設定されていない場合は現在のサイズを保存
            if (modelOriginalSize.width === 0 && model.width) {
                modelOriginalSize.width = model.width;
                modelOriginalSize.height = model.height;
                originalWidth = model.width;
                originalHeight = model.height;
            }
            
            // 表示エリアに合わせて適切なスケールを計算
            const scaleX = (canvasWidth * 0.8) / originalWidth;  // 幅の80%に収める
            const scaleY = (canvasHeight * 0.9) / originalHeight; // 高さの90%に収める
            const optimalScale = Math.min(scaleX, scaleY, 1.5); // 最大1.5倍まで
            
            // 現在のスケールをリセットしてから新しいスケールを適用
            model.scale.set(optimalScale);
            
            // アンカーまたはピボットポイントを設定
            if (model.anchor) {
                model.anchor.set(0.5, 1.0); // 中央下
            } else if (model.pivot) {
                model.pivot.set(originalWidth / 2, originalHeight);
            }
            
            // 位置を設定（キャンバス内の中央下部に配置）
            model.x = canvasWidth / 2;
            model.y = canvasHeight - 10; // 下端から少し余裕を持たせる
            
            // 可視性を確保
            model.visible = true;
            model.alpha = 1.0;
            
            console.log('Model positioned:', {
                scale: optimalScale,
                position: { x: model.x, y: model.y },
                canvasSize: { width: canvasWidth, height: canvasHeight },
                originalSize: { width: originalWidth, height: originalHeight }
            });
        } catch (error) {
            console.error('Error positioning model:', error);
        }
    }

    function showPlaceholder() {
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
                speakMessage(message);
            }
        } else {
            messageElement.classList.add('system-message');
            messageElement.textContent = message;
        }
        chatHistoryElement.appendChild(messageElement);
        chatHistoryElement.scrollTop = chatHistoryElement.scrollHeight;
    }

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
                thinkingMessage.remove(); // Ensure thinking message is removed on error too
            }
            addMessageToDisplay('bot', `エラー: ${error.message}`);
            // Optionally, add error to internal history if needed, though typically not done for UI errors.
            // addMessageToInternalHistory('model', `エラー: ${error.message}`);
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

    const modelSelector = document.getElementById('model-selector');
    let initialModelPath = modelSelector ? modelSelector.value : 'models/live2d/natori_pro/runtime/natori_pro_t06.model3.json';
    initializeLive2D(initialModelPath);
    if (modelSelector) {
        modelSelector.addEventListener('change', (e) => {
            const path = e.target.value;
            initializeLive2D(path);
        });
    }
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