# アーキテクチャ設計書

## 概要

このドキュメントは、モダンなAWSインフラ開発の学習を目的としたサーバーレスWebアプリケーションのアーキテクチャ設計書です。

## MVP（Minimum Viable Product）構成

### 構成図

```
┌─────────────────┐
│   Web Browser   │
│  (Static Files) │
└────────┬────────┘
         │
         │ HTTP/HTTPS
         │
┌────────▼────────┐
│  S3 Bucket      │
│ (Static Hosting)│
└─────────────────┘

┌─────────────────┐
│   Web Browser   │
│   (API Calls)   │
└────────┬────────┘
         │
         │ REST API
         │
┌────────▼────────┐      ┌─────────────┐
│  API Gateway    │─────▶│   Lambda    │
│   (REST API)    │      │   Function  │
└─────────────────┘      └──────┬──────┘
                                 │
                                 │ Read/Write
                                 │
                        ┌────────▼────────┐
                        │    DynamoDB     │
                        │     Table       │
                        └─────────────────┘

┌─────────────────┐
│   Web Browser   │
│  (Authentication)│
└────────┬────────┘
         │
         │ OAuth/OIDC
         │
┌────────▼────────┐
│ Cognito User    │
│     Pool        │
└─────────────────┘
```

### 使用サービス

1. **Amazon S3**
   - 静的ファイル（HTML, CSS, JavaScript）のホスティング
   - Lambdaデプロイパッケージの保存

2. **Amazon API Gateway**
   - RESTful APIのエンドポイント
   - Lambda関数との統合
   - CORS設定

3. **AWS Lambda**
   - サーバーレスバックエンドロジック
   - API Gatewayからのリクエスト処理
   - DynamoDBとのデータ操作

4. **Amazon DynamoDB**
   - NoSQLデータベース
   - ユーザーデータの永続化
   - オンデマンド課金モード

5. **Amazon Cognito**
   - ユーザー認証・認可
   - User Poolによるユーザー管理
   - OAuth/OIDCフロー

## データフロー

### 1. 静的ファイルの提供
1. ユーザーがWebブラウザでアクセス
2. S3バケットから静的ファイル（HTML, CSS, JS）を取得
3. ブラウザにコンテンツを表示

### 2. APIリクエストの処理
1. WebアプリケーションからAPI Gatewayにリクエスト送信
2. API GatewayがLambda関数を呼び出し
3. Lambda関数がDynamoDBからデータを取得/更新
4. レスポンスをAPI Gateway経由でクライアントに返却

### 3. ユーザー認証
1. ユーザーがCognitoにサインアップ/サインイン
2. Cognitoが認証トークンを発行
3. アプリケーションがトークンを使用してAPIリクエスト
4. （将来実装）API GatewayでCognito Authorizerによる認証

## セキュリティ考慮事項

### 現在（MVP）
- S3バケットのパブリックアクセス設定
- API Gatewayの認証なし（開発用）
- DynamoDBの暗号化有効

### 将来の改善
- Cognito AuthorizerによるAPI Gatewayの認証
- S3バケットのプライベート化とCloudFrontの導入
- WAFによるAPI保護
- Secrets Managerによる機密情報管理

## スケーラビリティ

- **Lambda**: 自動スケーリング（同時実行数上限設定可能）
- **API Gateway**: 自動スケーリング（デフォルトで10,000 RPSまで）
- **DynamoDB**: オンデマンドモードで自動スケーリング
- **S3**: 無制限のスケーラビリティ

## コスト最適化

- サーバーレスアーキテクチャによる従量課金
- DynamoDBのオンデマンドモード（低トラフィック時に最適）
- Lambdaの適切なメモリ設定
- CloudWatch Logsの保持期間設定

## 今後の拡張計画

### Phase 2: CI/CDパイプライン
- CodePipelineによる自動デプロイ
- CodeBuildによるビルド
- GitHubとの統合

### Phase 3: ワークフローオーケストレーション
- Step Functionsによる複雑なワークフロー
- 非同期処理の実装

### Phase 4: 監視・ログ
- CloudWatchダッシュボード
- X-Rayによるトレーシング
- アラーム設定

### Phase 5: 高度なセキュリティ
- Cognito Authorizerの統合
- WAFの導入
- VPCエンドポイントの活用

