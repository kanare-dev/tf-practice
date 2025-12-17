# ADR-0002: MVP Architecture - Serverless Web Application

## Status

| Proposed | Accepted | Deprecated | Superseded |
| -------- | -------- | ---------- | ---------- |
| ✅       |          |

## Context

モダンな AWS インフラ開発を学習するために、簡単な Web アプリケーションを動かすための最小構成（MVP）を設計する必要がある。
以下の要件を満たす必要がある：

- サーバーレスアーキテクチャ
- RESTful API の提供
- ユーザー認証
- データ永続化
- 静的ファイルのホスティング

## Decision

MVP として以下の構成を採用する：

1. **API Gateway**: RESTful API のエンドポイントとして使用
2. **Lambda**: バックエンドロジックの実装
3. **Cognito User Pool**: ユーザー認証・認可
4. **DynamoDB**: データの永続化
5. **S3**: 静的ファイル（HTML, CSS, JS）のホスティングと Lambda デプロイパッケージの保存

この構成により、以下の利点がある：

- サーバー管理が不要
- 従量課金でコスト効率が良い
- スケーラブル
- 学習に適した複数の AWS サービスをカバー

## Consequences

### Positive

- サーバーレスで運用負荷が低い
- AWS マネージドサービスで可用性が高い
- モジュール化された構成で拡張しやすい
- 各サービスが独立しているため、段階的に機能追加可能

### Negative

- Lambda のコールドスタートによるレイテンシの可能性
- DynamoDB のクエリパターンに制約がある
- 複数のサービスを組み合わせることでデバッグが複雑になる可能性

### Neutral

- 将来的に Step Functions、CodePipeline、CodeBuild などのサービスを追加予定
