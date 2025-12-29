# ADR-0003: CloudFront と API Gateway の設計方針

## Status

| Proposed | Accepted | Deprecated | Superseded |
| -------- | -------- | ---------- | ---------- |
|          | ☑︎       |            |            |

Date: 2025-12-20

## Context

**静的コンテンツ配信（高速・安価・安定）**と、**動的 API（認証・低遅延・正確性）**を役割分担して運用する必要があります。

- 認証は Cognito が JWT をクライアントへ発行し、API は JWT を検証して保護する
- 静的配信は認証に依存させない設計が望ましい
- フロントエンドとバックエンドの配信方法について、2つのパターンが考えられる

### 選択肢

**パターン A：フロントと API を分離**
- `https://note-app.kanare.dev` → CloudFront → S3
- `https://api.note-app.kanare.dev` → API Gateway → Lambda

**パターン B：CloudFront でフロントと API を統合**
- `https://note-app.kanare.dev/` → CloudFront → S3
- `https://note-app.kanare.dev/api/*` → CloudFront → API Gateway

## Decision

**パターン A（分離）を採用**し、note-app.kanare.dev（CloudFront+S3）とapi.note-app.kanare.dev（API Gateway+Lambda）で構築します。

### 採用理由

- 構成が単純で、トラブルシュートが容易（責務が明確）
- CloudFront キャッシュが API に悪影響を与えにくい
- API Gateway のカスタムドメインや認証（Cognito Authorizer）を素直に構成できる
- 先にフロントを安定稼働させられる

### 将来の拡張性

運用上、単一ドメインが必要になった場合はパターン B への移行が可能です：
- API Gateway 側はほぼ変更不要（入口を CloudFront に寄せるだけ）
- ロールバックも容易（再び api.* を直接呼ぶ構成に戻せる）

## Consequences

### Positive

- 責務が明確で、デバッグとトラブルシューティングが容易
- CloudFront のキャッシュ設定が API に影響しない
- API Gateway の Cognito Authorizer を直接利用可能
- 段階的な構築が可能（まずフロント、次に API）

### Negative

- ブラウザから別ドメインへ API 呼び出しになるため CORS 設定が必須
- 2つのドメインと ACM 証明書を管理する必要がある

### Neutral

- 認証トークンは `Authorization: Bearer <JWT>` を基本とし、Cookie 依存を避ける（ドメインまたぎの罠を回避）
- 将来的にパターン B（単一ドメイン統合）への移行も可能
