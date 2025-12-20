# Personal Notes App – AWS/Terraform 総合学習プロジェクト

[![Terraform CI](https://github.com/Canale0107/tf-practice/actions/workflows/terraform.yml/badge.svg)](https://github.com/Canale0107/tf-practice/actions/workflows/terraform.yml)
[![Deploy Static Site to S3](https://github.com/Canale0107/tf-practice/actions/workflows/deploy-static-site.yml/badge.svg)](https://github.com/Canale0107/tf-practice/actions/workflows/deploy-static-site.yml)

---

## プロジェクト概要

本リポジトリは「パーソナルノート/メモアプリ」を AWS インフラ（サーバーレス/モダン CI/CD）と Terraform で実践する学習用サンプルです。
主要な AWS サービスと IaC の設計・運用を、実用性ある形で段階的に習得できます。

### なぜこのプロジェクト？

- **学習効率**: 認証、ストレージ、API 設計、CI/CD など幅広く体験
- **拡張性**: ライトな MVP(最小機能)から段階拡張へ対応
- **実用性**: Markdown メモの作成・編集・検索可能

### 🎯 このプロジェクトの特徴

- ✅ **完全なIaC化**: AWS + Cloudflare DNSまでTerraformで管理
- ✅ **再現性**: `terraform destroy` → `terraform apply` で完全復元
- ✅ **本番環境レベル**: CloudFront + ACM証明書 + カスタムドメイン
- ✅ **セキュリティ**: レート制限、DDoS対策、HTTPS強制
- ✅ **モジュール設計**: 再利用可能なTerraformモジュール
- ✅ **ドキュメント充実**: ADR、運用ガイド、トラブルシューティング

---

## システム全体アーキテクチャ

![概要図](diagrams/svg/overview.svg)

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
- **CloudFront**: CDN、HTTPS配信（ACM証明書）
- **API Gateway**: REST API（カスタムドメイン、レート制限）
- **Lambda**: API バックエンド（Python）
- **DynamoDB**: NoSQL DB（NoteTable）
- **ACM**: SSL/TLS証明書管理
- **Cognito**: ユーザー認証（予定）
- **CodeBuild/CodePipeline**: CI/CD（予定）

### Cloudflare（DNS管理）

- **DNS**: ドメイン・サブドメイン管理
- **Terraform Provider**: DNSレコードの自動管理（オプション）
  - ACM証明書検証用CNAMEレコード
  - CloudFront/API Gateway向けCNAMEレコード
  - 詳細: [Cloudflare Terraform導入ガイド](docs/cloudflare-terraform-guide.md)

---

## ディレクトリ構成（最新版：2025 年 12 月リファクタ）

```
tf-practice/
├── frontend/                # 静的Webサイト (index.html, JS, CSS, SPAソース)
│   ├── public/              # HTML, 画像など公開用
│   ├── src/                 # (必要に応じて) SPAやアプリソース
│   └── build/               # (自動生成) デプロイ成果物
├── terraform/               # IaC/インフラ全般
│   ├── environments/        # dev, prod, staging別Tf構成
│   ├── modules/             # サービス毎モジュール群
│   └── lambda-functions/    # Lambda用Python等
├── docs/                   # 運用/設計/提案ドキュメント
├── adr/                    # 重要設計意思決定(ADR)
├── diagrams/               # 設計図・SVG・note等
├── ci-cd/                  # CI/CD用ファイル
└── README.md
```

---

## クイックスタート

- [docs/getting-started.md](docs/getting-started.md): 初期セットアップ
- [docs/deployment-guide.md](docs/deployment-guide.md): 詳細デプロイ&コスト注意
- [docs/cicd-guide.md](docs/cicd-guide.md): CI/CD 運用ガイド
- [docs/rebuild-guide.md](docs/rebuild-guide.md): インフラ再構築ガイド（destroy→apply時）
- [docs/cloudflare-terraform-guide.md](docs/cloudflare-terraform-guide.md): Cloudflare DNS自動管理の導入

### セットアップ最短例

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集（AWS認証情報、Cloudflare設定など）
terraform init
terraform plan
terraform apply
```

#### Cloudflare DNS自動管理（オプション）

デフォルトでは手動でCloudflare DNSを設定する必要がありますが、Terraform Providerを使用して完全自動化できます：

```bash
# terraform.tfvars に以下を追加
enable_cloudflare_dns = true
cloudflare_api_token  = "your-api-token"
cloudflare_zone_id    = "your-zone-id"
```

詳細: [Cloudflare Terraform導入ガイド](docs/cloudflare-terraform-guide.md)

---

## CI/CD について

- GitHub Actions を利用した自動 plan/validate
  - **pull_request（PR）時のみ plan 結果が PR コメントとして通知され、push（main/develop 等）では plan 結果が Actions コンソールにのみ出力されます**
  - apply/destroy は手作業で実施します
- `.github/workflows/terraform.yml`, `.github/workflows/deploy-static-site.yml` にて管理

## 設計ドキュメント・背景

- [docs/project-proposal.md](docs/project-proposal.md): アイデア/要件/仕様詳細
- [docs/goal_structure_20251217.md](docs/goal_structure_20251217.md): 目標ディレクトリ構成・進捗ロードマップ
- [adr/](adr/): 主要意思決定ドキュメント
- [diagrams/](diagrams/): draw.io 構成図・svg・設計メモ
