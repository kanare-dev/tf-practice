# AWS Infrastructure as Code - Terraform Practice Project

このプロジェクトは、モダンな AWS インフラ開発を学習するための Terraform サンプルプロジェクトです。
GitOps による CI/CD とアジャイルな IaC 開発を体験できるように設計されています。

## プロジェクト構成

```
tf-practice/
├── adr/                    # Architecture Decision Records
├── modules/                # 再利用可能なTerraformモジュール
│   ├── api-gateway/
│   ├── lambda/
│   ├── cognito/
│   ├── dynamodb/
│   └── s3/
├── environments/           # 環境別の設定
│   ├── dev/
│   ├── staging/
│   └── prod/
├── docs/                   # 設計書（テキストベース）
├── .github/                # GitHub Actionsワークフロー
│   └── workflows/
├── ci-cd/                  # CI/CD設定
│   └── aws/                # AWS CodePipeline/CodeBuild設定
└── diagrams/               # Draw.ioダイアグラム
```

## 使用する AWS サービス

- **API Gateway**: RESTful API のエンドポイント
- **Lambda**: サーバーレス関数
- **Cognito**: 認証・認可
- **DynamoDB**: NoSQL データベース
- **S3**: オブジェクトストレージ（静的ファイル、Lambda デプロイパッケージなど）
- **CodeBuild**: ビルドサービス
- **CodePipeline**: CI/CD パイプライン
- **Step Functions**: ワークフローオーケストレーション

## 開発フロー

1. **MVP**: 最小限の構成から開始
2. **ADR**: 重要な設計決定を ADR として記録
3. **段階的拡張**: 機能を追加しながらインフラを拡張
4. **GitOps**: コードの変更が自動的にインフラに反映

## セットアップ

### 前提条件

- Terraform >= 1.0
- AWS CLI が設定済み
- AWS アカウントへのアクセス権限

### 初期セットアップ

```bash
# Terraformの初期化
cd environments/dev
terraform init

# 実行計画の確認
terraform plan

# インフラの作成
terraform apply
```

## ADR（Architecture Decision Records）

重要な設計決定は `adr/` ディレクトリに記録されます。

## 設計書

- テキストベースの設計書: `docs/`
  - [アーキテクチャ設計書](docs/architecture.md)
  - [クイックスタートガイド](docs/getting-started.md)
  - [ADR ガイド](docs/adr-guide.md)
  - [CI/CD ガイド](docs/cicd-guide.md)
- Draw.io ダイアグラム: `diagrams/`
  - Draw.io でアーキテクチャ図を作成する際の手順は [diagrams/README.md](diagrams/README.md) を参照

## Draw.io での図作成

1. [draw.io](https://app.diagrams.net/) または Draw.io Desktop を開く
2. AWS アイコンライブラリを有効化（More Shapes > AWS19）
3. `docs/architecture.md` の構成図を参考に図を作成
4. `.drawio` 形式で `diagrams/` に保存

## 次のステップ

1. [クイックスタートガイド](docs/getting-started.md) を読んでインフラを構築
2. [ADR](adr/) を読んで設計決定を確認
3. モジュールをカスタマイズして機能を追加
4. CI/CD パイプラインを設定

## ライセンス

MIT
