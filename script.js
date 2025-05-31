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
    const chatHistoryElement = document.getElementById('chat-history'); // Renamed to avoid conflict with chatHistory array
    const live2dCanvas = document.getElementById('live2d-canvas');

    const geminiApiEndpoint = 'https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app/';

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

    // Live2D関連の変数
    let app;
    let currentModel;
    const modelPath = 'models/live2d/natori_pro/runtime/natori_pro_t06.model3.json';

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
                backgroundColor: 0xffffff,
                backgroundAlpha: 1.0,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            // キャンバスを既存のcanvas要素と置き換え
            live2dCanvas.style.display = 'none';
            live2dContainer.appendChild(app.view);
            
            // PIXI キャンバスのスタイルを設定
            app.view.style.display = 'block';
            app.view.style.width = '100%';
            app.view.style.height = '100%';
            app.view.style.border = '2px solid #0000ff'; // デバッグ用
            
            console.log('PIXIキャンバス詳細:', {
                canvas: app.view,
                size: `${app.view.width}x${app.view.height}`,
                container: `${live2dContainer.clientWidth}x${live2dContainer.clientHeight}`,
                display: app.view.style.display
            });

            console.log('PIXIアプリケーション初期化完了');
            addMessageToDisplay('system', 'Live2D初期化中... モデルを読み込んでいます');

            // Live2Dモデルを読み込み
            console.log('モデル読み込み開始:', modelPath);
            currentModel = await Live2DModel.from(modelPath);
            
            if (!currentModel) {
                throw new Error('モデルの読み込みに失敗しました');
            }

            console.log('モデル読み込み成功:', {
                width: currentModel.width,
                height: currentModel.height,
                anchor: currentModel.anchor,
                type: currentModel.constructor.name,
                hasInternalModel: !!currentModel.internalModel,
                hasTexture: !!currentModel.texture,
                properties: Object.keys(currentModel).filter(key => typeof currentModel[key] !== 'function')
            });

            // モデルをステージに追加
            app.stage.addChild(currentModel);
            console.log('モデルをステージに追加. ステージの子要素数:', app.stage.children.length);
            
            // テスト用の図形を追加
            const testGraphics = new PIXI.Graphics();
            testGraphics.beginFill(0x00ff00);
            testGraphics.drawCircle(50, 50, 25);
            testGraphics.endFill();
            app.stage.addChild(testGraphics);
            console.log('テスト用の緑円を追加しました');
            
            // 追加のテスト図形（赤い四角）
            const redRect = new PIXI.Graphics();
            redRect.beginFill(0xff0000);
            redRect.drawRect(canvasWidth - 100, 10, 80, 50);
            redRect.endFill();
            app.stage.addChild(redRect);
            console.log('テスト用の赤い四角を追加しました');
            
            // キャンバス中央にマーカーを追加
            const centerMarker = new PIXI.Graphics();
            centerMarker.lineStyle(2, 0x0000ff);
            centerMarker.moveTo(canvasWidth/2 - 20, canvasHeight/2);
            centerMarker.lineTo(canvasWidth/2 + 20, canvasHeight/2);
            centerMarker.moveTo(canvasWidth/2, canvasHeight/2 - 20);
            centerMarker.lineTo(canvasWidth/2, canvasHeight/2 + 20);
            app.stage.addChild(centerMarker);
            console.log('中央マーカーを追加しました');

            // モデルの位置とスケールを設定
            positionModel(currentModel, canvasWidth, canvasHeight);
            
            // モデルの状態をデバッグ
            console.log('モデル詳細状態:', {
                stage_children: app.stage.children.length,
                model_in_stage: app.stage.children.includes(currentModel),
                model_position: { x: currentModel.x, y: currentModel.y },
                model_scale: { x: currentModel.scale.x, y: currentModel.scale.y },
                model_alpha: currentModel.alpha,
                model_visible: currentModel.visible,
                model_bounds: currentModel.getBounds(),
                stage_bounds: app.stage.getBounds(),
                canvas_size: { width: app.view.width, height: app.view.height }
            });
            
            // 手動でレンダリングを強制
            app.renderer.render(app.stage);
            console.log('手動レンダリングを実行しました');

            // クリックイベントを追加
            currentModel.eventMode = 'static'; // Fix deprecation warning
            currentModel.cursor = 'pointer';
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
        
        console.log('Live2Dモデル配置開始:', {
            modelWidth: model.width,
            modelHeight: model.height,
            canvasSize: `${canvasWidth}x${canvasHeight}`,
            hasAnchor: !!model.anchor,
            hasPivot: !!model.pivot
        });
        
        // 表示エリアに合わせて適切なスケールを計算
        const scaleX = (canvasWidth * 0.8) / model.width;  // 幅の80%に収める
        const scaleY = (canvasHeight * 0.9) / model.height; // 高さの90%に収める
        const optimalScale = Math.min(scaleX, scaleY); // 小さい方を選択して完全に収める
        
        console.log('スケール計算:', {
            scaleX: scaleX,
            scaleY: scaleY,
            optimalScale: optimalScale,
            resultSize: `${model.width * optimalScale}x${model.height * optimalScale}`
        });
        
        // 計算されたスケールを設定
        model.scale.set(optimalScale);
        
        // アンカーまたはピボットポイントを設定
        if (model.anchor) {
            model.anchor.set(0.5, 1.0); // 中央下
            console.log('アンカーポイントを中央下に設定');
        } else if (model.pivot) {
            model.pivot.set(model.width / 2, model.height);
            console.log('ピボットポイントを中央下に設定');
        }
        
        // 位置を設定（キャンバス内の中央下部に配置）
        model.x = canvasWidth / 2;
        model.y = canvasHeight - 10; // 下端から少し余裕を持たせる
        
        // 可視性を確保
        model.visible = true;
        model.alpha = 1.0;
        
        console.log('モデル配置完了:', {
            originalSize: `${model.width}x${model.height}`,
            finalScale: optimalScale,
            scaledSize: `${Math.round(model.width * optimalScale)}x${Math.round(model.height * optimalScale)}`,
            finalPosition: { x: model.x, y: model.y },
            canvasSize: `${canvasWidth}x${canvasHeight}`,
            visible: model.visible,
            alpha: model.alpha,
            bounds: model.getBounds()
        });
        
        // デバッグ用：モデルの境界線を描画
        const bounds = model.getBounds();
        const boundingBox = new PIXI.Graphics();
        boundingBox.lineStyle(3, 0xff00ff); // マゼンタ色の境界線
        boundingBox.drawRect(bounds.x, bounds.y, bounds.width, bounds.height);
        app.stage.addChild(boundingBox);
        console.log('モデルの境界線を描画しました:', bounds);
        
        // モデルの位置に十字マークを追加
        const positionMarker = new PIXI.Graphics();
        positionMarker.lineStyle(2, 0x00ffff); // シアン色
        positionMarker.moveTo(model.x - 30, model.y);
        positionMarker.lineTo(model.x + 30, model.y);
        positionMarker.moveTo(model.x, model.y - 30);
        positionMarker.lineTo(model.x, model.y + 30);
        app.stage.addChild(positionMarker);
        console.log('モデル位置マーカーを追加しました:', { x: model.x, y: model.y });
        
        // 強制的にレンダリング
        if (app && app.renderer) {
            app.renderer.render(app.stage);
            console.log('強制レンダリング実行');
        }
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
        addMessageToInternalHistory('user', messageText); // Add to internal history
        userInput.value = '';
        sendButton.disabled = true;

        addMessageToDisplay('bot', '考え中...', true);

        try {
            const requestBody = {
                userMessage: messageText,
                chatHistory: chatHistory.slice(0, -1) // Send history excluding the current user message
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
                addMessageToInternalHistory('model', data.reply); // Add bot's reply to internal history
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