document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const chatHistoryElement = document.getElementById('chat-history'); // Renamed to avoid conflict with chatHistory array
    const live2dCanvas = document.getElementById('live2d-canvas');

    const geminiApiEndpoint = 'https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app/';
    const modelPath = 'live2d-models/natori_pro_jp/runtime/';
    const modelJsonFileName = 'natori_pro_t06.model3.json';

    // let live2DManager = null; // Placeholder for Live2D manager

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
        if (!window.Live2DCubismCore || !window.Live2DCubismFramework) {
            console.error('Live2D SDK not loaded.');
            addMessageToDisplay('system', 'Live2D SDKの読み込みに失敗しました。');
            return;
        }

        const live2dContainer = document.querySelector('.live2d-container');
        if (live2dContainer) {
            live2dCanvas.width = live2dContainer.clientWidth;
            live2dCanvas.height = live2dContainer.clientHeight;
        } else {
            live2dCanvas.width = 400;
            live2dCanvas.height = 500;
        }

        try {
            const cubismOption = new Live2DCubismFramework.Option();
            Live2DCubismFramework.CubismFramework.startUp(cubismOption);
            Live2DCubismFramework.CubismFramework.initialize();
            addMessageToDisplay('system', 'Live2Dモデルの初期化処理を開始します...(この部分は詳細な実装が必要です)');
            console.log(`Attempting to load model: ${modelPath}${modelJsonFileName}`);
            // --- Live2D Model Loading and Rendering Implementation ---
        } catch (error) {
            console.error('Live2D Initialization Error:', error);
            addMessageToDisplay('system', `Live2Dの初期化に失敗しました: ${error.message}`);
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