# Live2D実装手順書

## 現在の状況

現在、Live2D機能は404エラーを避けるために一時的に無効化されています。
チャットボット機能は正常に動作し、Live2Dキャンバスエリアにはプレースホルダーが表示されています。

## Live2D実装の段階的アプローチ

### 段階1: Live2D Core SDKの正しい読み込み

1. **Core SDKの確認**
   - パス: `SDK/CubismSdkForWeb-5-r.4/Core/live2dcubismcore.min.js`
   - このファイルが正しく存在することを確認済み

2. **HTMLでの読み込み**
   ```html
   <script src="SDK/CubismSdkForWeb-5-r.4/Core/live2dcubismcore.min.js"></script>
   ```

### 段階2: Framework SDKのビルドと読み込み

1. **Frameworkのビルド**
   ```bash
   cd SDK/CubismSdkForWeb-5-r.4/Framework
   npm install
   npm run build
   ```

2. **ビルド結果の確認**
   - `dist/`フォルダに生成されたファイルを確認
   - 主要ファイル: `live2dcubismframework.js`

### 段階3: シンプルなLive2D初期化

1. **基本的な初期化コード**
   ```javascript
   // Core SDKの読み込み確認
   if (window.Live2DCubismCore) {
       // Framework初期化
       // 基本的なレンダリング設定
   }
   ```

### 段階4: モデルファイルの読み込み

1. **モデルファイルの確認**
   - パス: `live2d-models/natori_pro_jp/runtime/`
   - モデルファイル: `natori_pro_t06.model3.json`

2. **モデルの読み込みと表示**
   - JSONファイルの読み込み
   - テクスチャの読み込み
   - モデルの描画

### 段階5: インタラクション機能の追加

1. **基本的なアニメーション**
   - アイドルモーション
   - 基本的な表情変化

2. **チャットとの連携**
   - メッセージ受信時の反応
   - 感情に応じた表情変化

## 現在推奨される実装方法

### 方法1: 公式サンプルベースの実装

1. **サンプルプロジェクトの活用**
   ```bash
   cd SDK/CubismSdkForWeb-5-r.4/Samples/TypeScript/Demo
   npm install
   npm run build
   ```

2. **ビルド結果をプロジェクトに組み込み**
   - 生成されたバンドルファイルを使用
   - 必要な部分のみを抽出

### 方法2: 軽量版実装

1. **最小限のLive2D機能**
   - Core SDKのみ使用
   - Framework機能は必要最小限
   - カスタム実装で軽量化

## トラブルシューティング

### 404エラーの解決

- ✅ **解決済み**: モジュールファイルの読み込みエラー
- 解決方法: 段階的実装アプローチを採用

### 今後の注意点

1. **ファイルパスの確認**
   - 相対パスの正確性
   - ファイルの存在確認

2. **CORS設定**
   - ローカルサーバーでの動作確認
   - モデルファイル読み込み時のCORS対応

3. **パフォーマンス**
   - WebGLの対応確認
   - メモリ使用量の監視

## 次のステップ

1. **Core SDKの有効化**
   - HTMLでのスクリプト読み込み復活
   - 基本的な初期化テスト

2. **Framework統合**
   - 段階的なFramework機能追加
   - エラーハンドリングの強化

3. **モデル表示**
   - 実際のLive2Dモデル読み込み
   - 基本的な描画機能実装
