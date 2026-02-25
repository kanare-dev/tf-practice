# Personal Notes App – AWS/Terraform 総合学習プロジェクト

[![Terraform CI](https://github.com/Canale0107/tf-practice/actions/workflows/terraform.yml/badge.svg)](https://github.com/Canale0107/tf-practice/actions/workflows/terraform.yml)
[![Deploy Static Site to S3](https://github.com/Canale0107/tf-practice/actions/workflows/deploy-static-site.yml/badge.svg)](https://github.com/Canale0107/tf-practice/actions/workflows/deploy-static-site.yml)

---

## プロジェクト概要

本リポジトリは「パーソナルノート/メモアプリ」を AWS インフラ（サーバーレス/モダン CI/CD）と Terraform で実践する学習用サンプルです。
主要な AWS サービスと IaC の設計・運用を、実用性ある形で段階的に習得することを目的としています。

### なぜこのプロジェクト？

- **学習効率**: 認証、ストレージ、API 設計、CI/CD など幅広く体験
- **拡張性**: ライトな MVP(最小機能)から段階拡張へ対応
- **実用性**: Markdown メモの作成・編集・検索可能

### 🎯 このプロジェクトの特徴

- ✅ **完全な IaC 化**: AWS + Cloudflare DNS まで Terraform で管理
- ✅ **再現性**: `terraform destroy` → `terraform apply` で完全復元
- ✅ **本番環境レベル**: CloudFront + ACM 証明書 + カスタムドメイン
- ✅ **セキュリティ**: レート制限、DDoS 対策、HTTPS 強制
- ✅ **モジュール設計**: 再利用可能な Terraform モジュール
- ✅ **ドキュメント充実**: ADR、運用ガイド、トラブルシューティング

---

## システム全体アーキテクチャ

![概要図](diagrams/png/overview.png)

> 詳細な図の解説や拡張方針は [diagrams/note/overview.note.md](diagrams/note/overview.note.md) を参照。

---

## 機能要件（MVP & Phase2）

### MVP（最小機能）

- **ユーザー認証**: Cognito によるサインアップ/サインイン、セッション管理
- **ノート管理（CRUD）**:
  - ノート作成/一覧/詳細取得/更新/削除（API 経由）
- **UI**: シンプルな Web（HTML, CSS, JS）を S3 静的ホスティング

#### データモデル（DynamoDB）

| Key       | 用途                       |
| --------- | -------------------------- |
| userId    | Cognito ユーザー ID (Hash) |
| noteId    | ノート ID (UUID, Range)    |
| title     | タイトル                   |
| content   | 本文（Markdown）           |
| createdAt | 作成日時                   |
| updatedAt | 更新日時                   |
| tags      | タグ（配列、任意）         |

#### API エンドポイント

| メソッド | パス            | 説明           |
| -------- | --------------- | -------------- |
| GET      | /notes          | ノート一覧取得 |
| POST     | /notes          | ノート作成     |
| GET      | /notes/{noteId} | ノート詳細取得 |
| PUT      | /notes/{noteId} | ノート更新     |
| DELETE   | /notes/{noteId} | ノート削除     |

### Phase2 以降（拡張機能例）

- ノート検索（DynamoDB GSI）・タグ絞り込み
- ファイル添付・画像管理（S3,署名付き URL）
- ノート共有リンク・公開/非公開設定
- カテゴリ/フォルダ管理

---

## 利用サービス

### AWS

- **S3**: 静的 Web ホスティング
- **CloudFront**: CDN、HTTPS 配信（ACM 証明書）
- **API Gateway**: REST API（カスタムドメイン、レート制限）
- **Lambda**: API バックエンド（Python）
- **DynamoDB**: NoSQL DB（NoteTable）
- **ACM**: SSL/TLS 証明書管理
- **Cognito**: ユーザー認証
- **WAF**: DDoS 対策（予定）

### Cloudflare（DNS 管理）

- **DNS**: ドメイン・サブドメイン管理
- **Terraform Provider**: DNS レコードの自動管理（オプション）
  - ACM 証明書検証用 CNAME レコード
  - CloudFront/API Gateway 向け CNAME レコード
  - 詳細: [Cloudflare Terraform 導入ガイド](docs/cloudflare-terraform-guide.md)

---

## ディレクトリ構成（最新版：2025 年 12 月リファクタ）

```
tf-practice/
├── frontend/                # 静的Webサイト (index.html, JS, CSS, SPAソース)
│   ├── public/              # HTML, 画像など公開用
│   ├── src/                 # (必要に応じて) SPAやアプリソース
│   └── build/               # (自動生成) デプロイ成果物
├── terraform/               # IaC/インフラ全般
│   ├── backend-setup/       # Terraform State管理用（初回のみ）
│   ├── environments/        # dev, prod 環境別構成（State完全分離）
│   │   ├── prod/            # 本番環境（note-app.kanare.dev）
│   │   └── dev/             # 開発環境（dev.note-app.kanare.dev）
│   ├── modules/             # サービス毎モジュール群
│   ├── lambda-functions/    # Lambda用Python等
│   └── MIGRATION_GUIDE.md   # 環境分離マイグレーションガイド
├── docs/                    # 運用/設計/提案ドキュメント
├── adr/                     # 重要設計意思決定(ADR)
├── diagrams/                # 設計図・SVG・note等
├── ci-cd/                   # CI/CD用ファイル
└── README.md
```

---

## クイックスタート

### 📚 主要ドキュメント

- [terraform/MIGRATION_GUIDE.md](terraform/MIGRATION_GUIDE.md): **Dev/Prod 環境分離ガイド**（必読）
- [docs/deployment-guide.md](docs/deployment-guide.md): 詳細デプロイ&コスト注意
- [docs/cicd-guide.md](docs/cicd-guide.md): CI/CD 運用ガイド
- [docs/rebuild-guide.md](docs/rebuild-guide.md): インフラ再構築ガイド（destroy→apply 時）
- [docs/cloudflare-terraform-guide.md](docs/cloudflare-terraform-guide.md): Cloudflare DNS 自動管理の導入

### 🏗️ 環境構成

本プロジェクトは**Dev/Prod 環境を完全分離**しています：

| 環境     | ドメイン                | State 管理                      | 用途                           |
| -------- | ----------------------- | ------------------------------- | ------------------------------ |
| **Prod** | note-app.kanare.dev     | `s3://…/prod/terraform.tfstate` | 本番環境（lifecycle 保護あり） |
| **Dev**  | dev.note-app.kanare.dev | `s3://…/dev/terraform.tfstate`  | 開発環境（自由に破壊可能）     |

詳細: [terraform/MIGRATION_GUIDE.md](terraform/MIGRATION_GUIDE.md)

### セットアップ最短例

#### Phase 1: Backend Setup（初回のみ）

```bash
cd terraform/backend-setup
terraform init
terraform apply
```

#### Phase 2: 環境のデプロイ

```bash
# Dev環境の場合
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集（AWS認証情報、Cloudflare設定など）
terraform init
terraform plan
terraform apply

# Prod環境も同様
cd ../prod
# ... 同じ手順
```

#### Cloudflare DNS 自動管理

Cloudflare DNS の設定も、Terraform Provider を使用して完全自動化しています：

```bash
# terraform.tfvars に以下を追加
enable_cloudflare_dns = true
cloudflare_api_token  = "your-api-token"
cloudflare_zone_id    = "your-zone-id"
```

詳細: [Cloudflare Terraform 導入ガイド](docs/cloudflare-terraform-guide.md)

---

## CI/CD について

GitHub Actions による GitOps パイプラインを実装しています。

### Terraform（インフラ）

| イベント | 実行内容 |
|----------|----------|
| PR 作成 | fmt / validate / plan（dev + prod）→ PR コメントに差分を表示 |
| main マージ | 上記 + **dev 自動 apply** → **prod 手動承認後 apply** |

```
PR:          fmt → validate → plan → [PR コメント]
main merge:  fmt → validate → plan → apply dev → [承認待ち] → apply prod
```

prod への apply は **GitHub Environment "production"** の Required Reviewers による承認が必要です。

### フロントエンド（静的サイト）

| イベント | デプロイ先 |
|----------|------------|
| PR 作成 | dev 環境（プレビュー） |
| main マージ | prod 環境 |
| 手動実行 | 選択した環境 |

### ワークフローファイル

- `.github/workflows/terraform.yml` — インフラ CI/CD
- `.github/workflows/deploy-static-site.yml` — フロントエンドデプロイ

詳細: [docs/cicd-guide.md](docs/cicd-guide.md)

## 設計ドキュメント・背景

- [adr/](adr/): 主要意思決定ドキュメント
- [diagrams/](diagrams/): draw.io 構成図・svg・設計メモ
