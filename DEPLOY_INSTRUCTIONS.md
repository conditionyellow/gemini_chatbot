# Cloud Run デプロイ手順

## 現在のCloud Run情報

- **Service URL:** https://gemini-chatbot-proxy-770321957231.asia-northeast1.run.app/
- **Service Name:** gemini-chatbot-proxy (推定)
- **Region:** asia-northeast1
- **Project ID:** 770321957231 (推定)

## 手動デプロイ手順

### 方法1: Google Cloud Console (推奨)

1. **Google Cloud Console にアクセス**
   - https://console.cloud.google.com/
   - プロジェクト 770321957231 を選択

2. **Cloud Run サービスにアクセス**
   - Navigation menu > Cloud Run
   - または直接URL: https://console.cloud.google.com/run

3. **既存サービスを更新**
   - `gemini-chatbot-proxy` サービスをクリック
   - "EDIT & DEPLOY NEW REVISION" をクリック

4. **新しいコンテナイメージで更新**
   - Container tab で "Container image URL" を更新
   - または "Source" tab で新しいソースコードをアップロード

### 方法2: Google Cloud CLI (要インストール)

```bash
# Google Cloud CLI をインストール後
gcloud auth login
gcloud config set project 770321957231

# Cloud Run サービスをデプロイ
cd /Users/oyaryo/Library/CloudStorage/OneDrive-Personal/1use/web/conditionyellow/test/gemini_chatbot/cloud-function
gcloud run deploy gemini-chatbot-proxy \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=[YOUR_API_KEY]
```

## 新しいコードのファイル

更新されたCloud Functionコードは以下に配置済み：
- `/Users/oyaryo/Library/CloudStorage/OneDrive-Personal/1use/web/conditionyellow/test/gemini_chatbot/cloud-function/index.js`
- `/Users/oyaryo/Library/CloudStorage/OneDrive-Personal/1use/web/conditionyellow/test/gemini_chatbot/cloud-function/package.json`

## 重要な変更点

新しいコードはペルソナシステムに対応しており、以下のリクエスト形式を処理できます：

### 新形式 (ペルソナ対応)
```json
{
  "userMessage": "こんにちは",
  "chatHistory": [],
  "modelId": "natori",
  "persona": {
    "name": "ナトリ",
    "systemPrompt": "あなたは「ナトリ」という...",
    "personality": "優しくて知的な女性...",
    "specialties": ["日常会話", "学習サポート"],
    "speakingStyle": "敬語を基調としつつ..."
  }
}
```

### 旧形式 (フォールバック対応)
```json
{
  "userMessage": "こんにちは",
  "chatHistory": []
}
```

## デプロイ後の確認

1. ブラウザでアプリを開く: http://localhost:8001
2. Live2Dモデルを切り替えてキャラクター別の挨拶を確認
3. チャット機能でキャラクター固有の応答を確認
4. debug-log でAPI通信状況を確認
