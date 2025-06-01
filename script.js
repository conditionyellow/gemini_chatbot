document.addEventListener('DOMContentLoaded', () => {
    // デバッグ用ログ関数
    function debugLog(message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage, data);
        
        // ページにもログを表示
        const debugElement = document.getElementById('debug-log');
        if (debugElement) {
            const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
            debugElement.innerHTML += `<div>${logMessage}${dataStr}</div>`;
            debugElement.scrollTop = debugElement.scrollHeight;
        }
    }

    // グローバルエラーをキャッチ
    window.onerror = function(message, source, lineno, colno, error) {
        debugLog('JS Error:', { message, source, lineno, colno, error: error ? error.toString() : null });
        return false; // デフォルトのエラーハンドリングも実行
    };
    
    // Promise rejection をキャッチ
    window.addEventListener('unhandledrejection', function(event) {
        debugLog('Unhandled Promise Rejection:', event.reason);
    });

    debugLog('Script loaded successfully');

    // ペルソナマッピングシステム - 各Live2Dモデルのキャラクター設定
    const modelPersonas = {
        'natori': {
            id: 'natori',
            name: 'ナトリ',
            personality: '優しくて知的な男性。親しみやすく、丁寧な言葉遣いを心がける。',
            specialties: ['日常会話', '学習サポート', '心理カウンセリング'],
            speakingStyle: '敬語を基調としつつも親しみやすい口調。「〜ですね」「〜でしょうか」を多用。',
            greeting: 'こんにちは！ナトリです。何かお困りのことがあれば、お気軽にお話しくださいね。',
            systemPrompt: 'あなたは「ナトリ」という名前の優しくて知的なAIアシスタントです。親しみやすく丁寧な言葉遣いで、ユーザーの学習や日常の悩みをサポートします。敬語を基調としつつも親しみやすい口調で話してください。'
        },
        'mark': {
            id: 'mark',
            name: 'マーク',
            personality: 'クールで理論的な男性。効率を重視し、論理的な思考を好む。',
            specialties: ['技術相談', 'プログラミング', 'データ分析', '問題解決'],
            speakingStyle: '簡潔で要点を突いた話し方。「〜だ」「〜である」調。専門用語を適切に使用。',
            greeting: 'こんにちは。マークだ。技術的な質問や論理的な問題解決が必要なら、遠慮なく聞いてくれ。',
            systemPrompt: 'あなたは「マーク」という名前のクールで理論的なAIアシスタントです。技術相談やプログラミング、データ分析を得意とします。簡潔で要点を突いた話し方をし、論理的で効率的なソリューションを提供してください。'
        },
        'hiyori': {
            id: 'hiyori',
            name: 'ひより',
            personality: '明るく元気な女の子。好奇心旺盛で、何事にも前向き。',
            specialties: ['エンターテイメント', 'クリエイティブ', '雑談', 'ゲーム'],
            speakingStyle: 'カジュアルで親しみやすい口調。「〜だよ！」「〜なの？」「わあ！」などの感嘆詞を使用。',
            greeting: 'やっほー！ひよりだよ〜！今日は何して遊ぼうか？なんでも聞いてね！',
            systemPrompt: 'あなたは「ひより」という名前の明るく元気なAIアシスタントです。好奇心旺盛で前向きな性格で、エンターテイメントやクリエイティブな話題が得意です。カジュアルで親しみやすい口調で、感嘆詞を交えながら楽しく会話してください。'
        },
        'kei': {
            id: 'kei',
            name: 'ケイ',
            personality: '落ち着いた知的な女性。文学や芸術に造詣が深く、思慮深い。',
            specialties: ['文学', '芸術', '哲学', '創作支援', '文章添削'],
            speakingStyle: '上品で文学的な表現を好む。「〜ですわ」「〜でございます」など、やや古風な敬語。',
            greeting: 'ごきげんよう。ケイと申します。文学や芸術について語り合えることを楽しみにしております。',
            systemPrompt: 'あなたは「ケイ」という名前の落ち着いた知的なAIアシスタントです。文学や芸術、哲学に造詣が深く、創作支援や文章添削を得意とします。上品で文学的な表現を用い、やや古風な敬語で話してください。'
        },
        'miku': {
            id: 'miku',
            name: 'ミク',
            personality: '活発で音楽好きな女の子。テクノロジーにも詳しく、クリエイティブな発想を持つ。',
            specialties: ['音楽', 'テクノロジー', 'クリエイティブ', 'ボーカロイド文化'],
            speakingStyle: '元気で現代的な口調。「〜だっけ？」「〜じゃん！」「すっごい！」などの若者言葉。',
            greeting: 'はーい！ミクだよ〜♪ 音楽とかテクノロジーの話、すっごく好きなんだ！何でも聞いてね〜！',
            systemPrompt: 'あなたは「ミク」という名前の活発で音楽好きなAIアシスタントです。テクノロジーとクリエイティブな分野、特に音楽やボーカロイド文化に詳しいです。元気で現代的な若者言葉を使って、楽しく会話してください。'
        },
        'simple': {
            id: 'simple',
            name: 'シンプル',
            personality: 'シンプルで実用的。無駄のない効率的なコミュニケーションを好む。',
            specialties: ['基本的な質問応答', '実用的なアドバイス', '簡潔な説明'],
            speakingStyle: '簡潔で分かりやすい表現。「です」「ます」調の標準的な敬語。',
            greeting: 'こんにちは。シンプルです。分かりやすく簡潔にお答えします。',
            systemPrompt: 'あなたは「シンプル」という名前のAIアシスタントです。簡潔で分かりやすい回答を心がけ、実用的なアドバイスを提供します。無駄のない効率的なコミュニケーションで、標準的な敬語を使用してください。'
        },
        'epsilon': {
            id: 'epsilon',
            name: 'イプシロン',
            personality: '未来的で高度な科学的思考を持つ。論理と数式を愛し、宇宙の神秘に魅了される。',
            specialties: ['量子物理学', '宇宙科学', 'AI・機械学習', '数学理論', '未来技術予測'],
            speakingStyle: '高度に論理的で正確性を重視。「計算結果によると〜」「理論的には〜」「データから推測すると〜」など科学的根拠を基にした表現。',
            greeting: '処理系初期化完了。イプシロンと申します。科学的探究心に基づき、宇宙の法則から未来技術まで、あらゆる知的課題に論理的にアプローチいたします。',
            systemPrompt: 'あなたは「イプシロン」という名前の高度な科学的思考能力を持つAIアシスタントです。量子物理学、宇宙科学、AI・機械学習、数学理論、未来技術予測を専門とします。常に論理的で科学的根拠に基づいた回答を提供し、「計算結果によると」「理論的には」「データから推測すると」などの表現を用いて、正確性と客観性を重視した高度な学術的口調で話してください。複雑な概念もわかりやすく説明することができます。'
        }
    };

    // 現在のモデルとペルソナを追跡
    let currentModelId = 'natori'; // デフォルト
    let currentPersona = modelPersonas[currentModelId];

    // モデルパスからモデルIDを抽出する関数
    function getModelIdFromPath(modelPath) {
        const lowerPath = modelPath.toLowerCase(); // 大文字小文字を統一
        if (lowerPath.includes('natori')) return 'natori';
        if (lowerPath.includes('mark')) return 'mark';
        if (lowerPath.includes('hiyori')) return 'hiyori';
        if (lowerPath.includes('kei')) return 'kei';
        if (lowerPath.includes('miku')) return 'miku';
        if (lowerPath.includes('simple')) return 'simple';
        if (lowerPath.includes('epsilon')) return 'epsilon';
        return 'natori'; // フォールバック
    }

    // キャラクター情報UIを更新する関数
    function updateCharacterInfoUI() {
        const characterName = document.getElementById('character-name');
        const characterPersonality = document.getElementById('character-personality');
        const characterSpecialties = document.getElementById('character-specialties');
        
        if (characterName && characterPersonality && characterSpecialties && currentPersona) {
            characterName.textContent = currentPersona.name;
            characterPersonality.textContent = currentPersona.personality;
            characterSpecialties.textContent = `得意分野: ${currentPersona.specialties.join(', ')}`;
        }
    }

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

    const geminiApiEndpoint = 'https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app/chat';

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
                    // PIXIアプリケーションからモデルを削除
                    if (app && app.stage && currentModel.parent) {
                        app.stage.removeChild(currentModel);
                    }
                    
                    // Live2Dモデルのリソースを安全に解放
                    if (currentModel.internalModel) {
                        // モデル内部のリソースを解放
                        if (currentModel.internalModel.release && typeof currentModel.internalModel.release === 'function') {
                            currentModel.internalModel.release();
                        }
                    }
                    
                    // PIXIオブジェクトとしての破棄
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
        debugLog('handleSendMessage called');
        const messageText = userInput.value.trim();
        if (!messageText) return;

        debugLog('Sending message:', messageText);
        addMessageToDisplay('user', messageText);
        addMessageToInternalHistory('user', messageText);
        userInput.value = '';
        sendButton.disabled = true;

        addMessageToDisplay('bot', '考え中...', true);

        try {
            // タイムアウト設定（30秒）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            // 新しいペルソナ機能付きリクエストを試行
            let requestBody = {
                userMessage: messageText,
                chatHistory: chatHistory.slice(0, -1),
                modelId: currentModelId,
                persona: {
                    name: currentPersona.name,
                    systemPrompt: currentPersona.systemPrompt,
                    personality: currentPersona.personality,
                    specialties: currentPersona.specialties,
                    speakingStyle: currentPersona.speakingStyle
                }
            };

            console.log('Sending API request:', requestBody);
            debugLog('Sending API request to:', geminiApiEndpoint);
            debugLog('Request body keys:', Object.keys(requestBody));

            let response;
            try {
                response = await fetch(geminiApiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                debugLog('Fetch completed successfully');
            } catch (fetchError) {
                debugLog('Fetch failed:', fetchError.message);
                throw fetchError;
            }

            clearTimeout(timeoutId);
            console.log('API response status:', response.status);
            console.log('API response headers:', Object.fromEntries(response.headers.entries()));
            debugLog('API response status:', response.status);

            // サーバーエラーの場合、従来のフォーマットでリトライ
            if (!response.ok && response.status === 500) {
                console.warn('Persona API failed, falling back to legacy format...');
                requestBody = {
                    userMessage: messageText,
                    chatHistory: chatHistory.slice(0, -1)
                };
                
                console.log('Sending fallback API request:', requestBody);
                debugLog('Sending fallback request');
                
                const fallbackController = new AbortController();
                const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 30000);
                
                try {
                    response = await fetch(geminiApiEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                        signal: fallbackController.signal
                    });
                    debugLog('Fallback fetch completed');
                } catch (fallbackError) {
                    debugLog('Fallback fetch failed:', fallbackError.message);
                    throw fallbackError;
                }
                
                clearTimeout(fallbackTimeoutId);
                console.log('Fallback API response status:', response.status);
            }

            const thinkingMessage = chatHistoryElement.querySelector('.bot-message.thinking');
            if (thinkingMessage) {
                thinkingMessage.remove();
            }

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    console.error('Failed to parse error response as JSON:', e);
                    errorData = { error: 'サーバーからの応答が不正です。' };
                }
                console.error('API error response:', errorData);
                let errorMessage = `HTTP error! status: ${response.status}`;
                if (errorData && errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData && errorData.message) {
                    errorMessage = errorData.message;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('API response data:', data);
            debugLog('API response received');
            if (data.reply) {
                debugLog('API reply received, adding to display');
                addMessageToDisplay('bot', data.reply);
                addMessageToInternalHistory('model', data.reply);
            } else {
                throw new Error("APIからの応答に 'reply' フィールドが含まれていません。");
            }

        } catch (error) {
            console.error('Error sending message to API:', error);
            console.error('Error stack:', error.stack);
            debugLog('Error in handleSendMessage:', error.message);
            const thinkingMessage = chatHistoryElement.querySelector('.bot-message.thinking');
            if (thinkingMessage) {
                thinkingMessage.remove(); // Ensure thinking message is removed on error too
            }
            
            // ユーザーフレンドリーなエラーメッセージ
            let errorMessage = 'すみません、応答中にエラーが発生しました。';
            if (error.name === 'AbortError') {
                errorMessage = `${currentPersona.name}: リクエストがタイムアウトしました。しばらく経ってから再度お試しください。`;
            } else if (error.message.includes('500')) {
                errorMessage = `${currentPersona.name}: すみません、サーバーで問題が発生しています。しばらく経ってから再度お試しください。`;
            } else if (error.message.includes('fetch') || error.name === 'TypeError') {
                errorMessage = `${currentPersona.name}: ネットワーク接続に問題があるようです。インターネット接続をご確認ください。`;
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = `${currentPersona.name}: サーバーとの接続に失敗しました。しばらく経ってから再度お試しください。`;
            }
            
            console.error('Displaying error message:', errorMessage);
            addMessageToDisplay('bot', errorMessage);
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
    
    // 初期モデルIDとペルソナを設定
    currentModelId = getModelIdFromPath(initialModelPath);
    currentPersona = modelPersonas[currentModelId];
    
    // キャラクター情報UIを更新
    updateCharacterInfoUI();
    
    initializeLive2D(initialModelPath);
    
    if (modelSelector) {
        modelSelector.addEventListener('change', (e) => {
            const path = e.target.value;
            const newModelId = getModelIdFromPath(path);
            
            // ペルソナを更新
            currentModelId = newModelId;
            currentPersona = modelPersonas[currentModelId];
            
            // キャラクター情報UIを更新
            updateCharacterInfoUI();
            
            // モデルを切り替え
            initializeLive2D(path);
            
            // キャラクター挨拶を表示（チャット履歴には追加しない）
            setTimeout(() => {
                addMessageToDisplay('bot', currentPersona.greeting);
                // 初期挨拶はチャット履歴に追加しない（Gemini API仕様のため）
            }, 1000); // モデル読み込み後に挨拶
        });
    }
    
    // 初期挨拶を表示（チャット履歴には追加しない）
    addMessageToDisplay('system', 'チャットボットへようこそ！');
    setTimeout(() => {
        addMessageToDisplay('bot', currentPersona.greeting);
        // 初期挨拶はチャット履歴に追加しない（Gemini API仕様のため）
    }, 2000);
    
    debugLog('Page initialization complete');
    
    // テストボタンの機能を追加
    const testChatBtn = document.getElementById('test-chat-btn');
    if (testChatBtn) {
        testChatBtn.addEventListener('click', async () => {
            debugLog('Test button clicked');
            
            // 入力フィールドにテストメッセージを設定
            if (userInput) {
                userInput.value = 'こんにちは、テストメッセージです';
                debugLog('Test message set');
                
                // handleSendMessage を呼び出し
                try {
                    await handleSendMessage();
                } catch (error) {
                    debugLog('Test message error:', error.message);
                }
            }
        });
    }
    
    // 簡易テスト関数
    async function testAPIConnection() {
        debugLog('Testing API connection...');
        try {
            const testBody = {
                userMessage: "テスト",
                chatHistory: []
            };
            
            const response = await fetch(geminiApiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testBody)
            });
            
            debugLog('Test API response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                debugLog('Test API success:', data.reply ? 'Got reply' : 'No reply field');
                addMessageToDisplay('system', 'API接続テスト成功！');
            } else {
                debugLog('Test API failed with status:', response.status);
                addMessageToDisplay('system', `API接続テスト失敗: ${response.status}`);
            }
        } catch (error) {
            debugLog('Test API error:', error.message);
            addMessageToDisplay('system', `API接続テストエラー: ${error.message}`);
        }
    }
    
    // デバッグ用：自動テストメッセージ（本番環境では無効化）
    /*
    setTimeout(() => {
        debugLog('Auto-testing chat functionality...');
        testAPIConnection(); // まずAPI接続をテスト
        
        if (userInput) {
            userInput.value = 'こんにちは、テストメッセージです';
            debugLog('Test message set in input field');
            // 手動でテストする場合はコメントアウト
            // handleSendMessage();
        }
    }, 5000);
    */
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