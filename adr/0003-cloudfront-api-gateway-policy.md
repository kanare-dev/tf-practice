# ADR 0003: CloudFront と API Gateway の設計方針

## 日付

2025-12-20

## ステータス

提案中（Proposed）

## コンテキスト・目的

- **静的コンテンツ配信（高速・安価・安定）**と、**動的 API（認証・低遅延・正確性）**を役割分担して運用する。
- 認証は Cognito が JWT をクライアントへ発行し、API は JWT を検証して保護する（静的配信は認証に依存させない）。

---

## 選択肢（2 パターン）

### パターン A：フロントと API を分離（推奨：初期）

- `https://note-app.kanare.dev` → CloudFront → S3
- `https://api.note-app.kanare.dev` → API Gateway → Lambda

#### 採用理由

- 構成が単純で、トラブルシュートが容易（責務が明確）
- CloudFront キャッシュが API に悪影響を与えにくい
- API Gateway のカスタムドメインや認証（Cognito Authorizer）を素直に構成できる
- 先にフロントを安定稼働させられる

#### 注意点

- ブラウザから別ドメインへ API 呼び出しになるため CORS 設定が必須
- 認証トークンは Authorization: Bearer <JWT> を基本とし、Cookie 依存を避ける（ドメインまたぎの罠を回避）

---

### パターン B：CloudFront でフロントと API を統合（発展）

- `https://note-app.kanare.dev/` → CloudFront → S3
- `https://note-app.kanare.dev/api/*` → CloudFront → API Gateway

#### 採用理由

- 単一ドメインに統一でき、フロント実装が楽（CORS 負担が小さい）
- WAF、ログ、レート制限などを CloudFront 前段に寄せやすい
- ルーティングで役割が明確（/は静的、/api は動的）

#### 注意点（重要）

- `/api/*` は キャッシュ無効を原則（誤キャッシュが事故につながる）
- Authorization ヘッダや QueryString を 正しく転送する必要がある
  - （設定ミスで「認証できない」「同じ応答が返る」等が起きやすい）
- 入口が CloudFront に集約されるため、障害時の影響範囲が広がる（対策は可能だが設計が必要）

---

## 推奨方針（今回）

1. 最初はパターン A（分離）で構築する
   - フロントを note-app.kanare.dev（CloudFront+S3）
   - API を api.note-app.kanare.dev（API Gateway+Lambda）
2. 運用上、単一ドメインが必要になったら パターン B へ移行する
   - API Gateway 側はほぼ変更不要（入口を CloudFront に寄せるだけ）
   - ロールバックも容易（再び api.\* を直接呼ぶ構成に戻せる）
