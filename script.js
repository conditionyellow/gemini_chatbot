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
// この履歴は、Cloud Functions経由でGemini APIに送信されます。
// 形式は { role: 'user' | 'model', text: 'メッセージ内容' }
let chatMessages = [];

// メッセージをチャット履歴UIに追加する関数
function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    // 送信者に応じてCSSクラスを割り当て
    messageDiv.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    
    // ★★★ ここからメッセージの先頭に名前を追加する変更 ★★★
    if (sender === 'user') {
        messageDiv.innerHTML = `<strong>あなた：</strong> ${text}`;
    } else { // sender === 'bot' の場合
        messageDiv.innerHTML = `<strong>SAGE：</strong> ${text}`;
    }
    // ★★★ ここまでメッセージの先頭に名前を追加する変更 ★★★

    chatHistoryDiv.appendChild(messageDiv); // チャット履歴UIに追加

    // 最新メッセージが見えるようにスクロールを一番下へ移動
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
}

// Cloud Functions経由でGemini APIへのリクエストを送信する非同期関数
async function sendMessageToCloudFunction(message) {
    // ユーザーのメッセージをUIに即座に表示
    appendMessage('user', message);

    // ボットが思考中であることを示すメッセージをUIに表示
    const thinkingMessageDiv = document.createElement('div');
    thinkingMessageDiv.classList.add('message', 'bot-message');
    thinkingMessageDiv.innerHTML = `<strong>SAGE：</strong> 思考中...`; // 思考中メッセージにも名前を追加
    chatHistoryDiv.appendChild(thinkingMessageDiv);
    chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight; // スクロール

    // 送信ボタンを無効化し、重複送信を防ぐ
    sendButton.disabled = true;

    // 現在のユーザーメッセージを履歴に追加
    chatMessages.push({ role: 'user', text: message });

    try {
        // Cloud FunctionsのエンドポイントにPOSTリクエストを送信
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // 送信するデータの形式を指定
            },
            body: JSON.stringify({
                userMessage: message, // 最新のユーザーメッセージ
                chatHistory: chatMessages.slice(0, -1) // 最新のユーザーメッセージを除いた過去の履歴
                                                        // Cloud Functions側でこの履歴をGemini APIに渡します
            })
        });

        // HTTPステータスコードが200番台以外の場合はエラーとして処理
        if (!response.ok) {
            const errorData = await response.json(); // エラーレスポンスのJSONを解析
            console.error('Cloud Functionエラー:', errorData);
            throw new Error(`Cloud Functionリクエストが失敗しました: ${response.status} ${response.statusText} - ${errorData.error ? errorData.error.details : '詳細不明'}`);
        }

        // 成功した場合、レスポンスのJSONデータを解析
        const data = await response.json();
        const botResponseText = data.reply; // Cloud Functionsからのボットの応答テキストを取得

        // UIから「思考中...」メッセージを削除
        chatHistoryDiv.removeChild(thinkingMessageDiv);

        // ボットの応答をUIに表示
        appendMessage('bot', botResponseText);

        // ボットの応答をチャット履歴に追加
        chatMessages.push({ role: 'model', text: botResponseText });

    } catch (error) {
        // エラーが発生した場合の処理
        console.error('チャットボットエラー:', error);
        // 「思考中...」メッセージが残っていたら削除
        if (chatHistoryDiv.contains(thinkingMessageDiv)) {
             chatHistoryDiv.removeChild(thinkingMessageDiv);
        }
        // UIにエラーメッセージを表示
        appendMessage('bot', 'エラーが発生しました。もう一度お試しください。');
    } finally {
        // リクエストが完了したら、送信ボタンを有効化
        sendButton.disabled = false;
        // 入力欄をクリア
        userInput.value = '';
    }
}

// 送信ボタンがクリックされた時のイベントリスナー
sendButton.addEventListener('click', () => {
    const message = userInput.value.trim(); // 入力欄のテキストを取得し、前後の空白を除去
    if (message) { // メッセージが空でない場合のみ送信処理を実行
        sendMessageToCloudFunction(message);
    }
});

// 入力欄でEnterキーが押された時のイベントリスナー
userInput.addEventListener('keypress', (e) => {
    // Enterキーが押され、かつ送信ボタンが無効化されていない場合のみ送信処理を実行
    if (e.key === 'Enter' && !sendButton.disabled) {
        const message = userInput.value.trim();
        if (message) {
            sendMessageToCloudFunction(message);
        }
    }
});