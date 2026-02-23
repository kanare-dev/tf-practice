# Terraform ディレクトリ

このディレクトリは AWS インフラ (S3, Lambda, Cognito, API Gateway など) を Terraform で IaC 管理するために使用します。

## 📁 ディレクトリ構成

```
terraform/
├── backend-setup/         # Terraform State管理用リソース（初回のみ実行）
│   ├── main.tf            # S3バケット、DynamoDBテーブル定義
│   └── README.md
├── environments/          # 環境別構成（State完全分離）
│   ├── prod/              # 本番環境
│   │   ├── backend.tf     # S3バックエンド設定（key: prod/terraform.tfstate）
│   │   ├── main.tf        # リソース定義（lifecycle保護あり）
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars
│   └── dev/               # 開発環境
│       ├── backend.tf     # S3バックエンド設定（key: dev/terraform.tfstate）
│       ├── main.tf        # リソース定義
│       ├── variables.tf
│       ├── outputs.tf
│       └── terraform.tfvars
├── modules/               # 再利用可能なモジュール
│   ├── s3/                # S3バケット管理
│   ├── lambda/            # Lambda関数管理
│   ├── dynamodb/          # DynamoDBテーブル管理
│   ├── api-gateway/       # API Gateway管理
│   └── cognito/           # Cognito User Pool管理
└── MIGRATION_GUIDE.md     # 環境分離マイグレーションガイド
```

> **注意**: Lambda関数のソースコードはプロジェクトルートの `lambda-functions/api-handler.py` に配置されています。

## 🏗️ 環境分離アーキテクチャ

本プロジェクトは**Dev/Prod環境を完全分離**しています：

### 特徴

- ✅ **State完全分離**: 各環境のStateはS3の異なるキーで管理
- ✅ **同時作業可能**: DynamoDB Lockで競合を防止
- ✅ **Prod保護**: 本番環境の重要リソースにlifecycle保護
- ✅ **環境変数による命名**: リソース名の衝突を防止

### 環境比較

| 項目 | Prod | Dev |
|------|------|-----|
| **ドメイン** | note-app.kanare.dev | dev.note-app.kanare.dev |
| **State** | `s3://kanare-terraform-state-bucket/prod/terraform.tfstate` | `s3://kanare-terraform-state-bucket/dev/terraform.tfstate` |
| **Lifecycle保護** | あり（CloudFront, ACM, S3, DynamoDB） | なし |
| **用途** | 本番環境 | 開発・テスト環境 |

## 🚀 クイックスタート

### 1. Backend Setupの実行（初回のみ）

```bash
cd backend-setup
terraform init
terraform apply
```

これにより以下が作成されます：
- S3バケット: `kanare-terraform-state-bucket`
- DynamoDBテーブル: `terraform-state-locks`

### 2. 環境のデプロイ

```bash
# Dev環境
cd environments/dev
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集
terraform init
terraform plan
terraform apply

# Prod環境
cd ../prod
# ... 同様の手順
```

## 📚 ドキュメント

### 必読

- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)**: Dev/Prod環境分離の詳細ガイド
  - マイグレーション手順
  - トラブルシューティング
  - 運用ベストプラクティス

### その他

- [backend-setup/README.md](backend-setup/README.md): Backend setup詳細
- [environments/dev/README.md](environments/dev/README.md): Dev環境の説明
- [environments/prod/README.md](environments/prod/README.md): Prod環境の説明（作成予定）

## 🔐 セキュリティ

### 機密情報の管理

- `terraform.tfvars`は`.gitignore`で除外されています
- Cloudflare APIトークンなどの機密情報を含むため、絶対にコミットしないでください
- GitHub Secretsを使用してCI/CD環境でも安全に管理

### Prod環境の保護

以下のリソースには`prevent_destroy = true`が設定されています：

- CloudFront Distribution
- ACM証明書（2つ：静的サイト用、API用）

**注意**: Terraformの仕様上、モジュール経由のリソース（S3バケット、DynamoDBテーブル）には`lifecycle`ブロックで変数を使用できないため、これらのリソースには以下の代替保護策を推奨します：

- **S3バケット**: バージョニング有効化、バケットポリシーでの制限
- **DynamoDBテーブル**: Point-in-time recovery有効化、バックアップ設定

削除する場合は、該当の`lifecycle`ブロックを手動で削除してから実行してください。

## 🔧 運用

### 環境の切り替え

```bash
# Prod環境で作業
cd environments/prod
terraform plan
terraform apply

# Dev環境で作業
cd environments/dev
terraform plan
terraform apply
```

### 変更のテストフロー

1. Dev環境で変更をテスト
2. `terraform plan`で差分を確認
3. `terraform apply`で適用
4. 動作確認
5. 問題なければProd環境に同じ変更を適用

### Stateの確認

```bash
# リソース一覧の表示
terraform state list

# S3上のState確認
aws s3 ls s3://kanare-terraform-state-bucket/
aws s3 ls s3://kanare-terraform-state-bucket/prod/
aws s3 ls s3://kanare-terraform-state-bucket/dev/
```

## ⚠️ 注意事項

### DO

- ✅ 変更前に必ず`terraform plan`で差分を確認
- ✅ Prod環境での変更は慎重に実行
- ✅ Dev環境で十分にテストしてからProd環境に適用

### DON'T

- ❌ Prod環境で`terraform destroy`を実行しない
- ❌ 手動でStateファイルを編集しない
- ❌ 異なる環境のtfvarsファイルを混同しない

## 🆘 トラブルシューティング

詳細は[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)のトラブルシューティングセクションを参照してください。

### よくある問題

- **State Lockエラー**: `terraform force-unlock <LOCK_ID>`
- **ACM証明書の検証が完了しない**: DNS設定とCloudflare Proxy設定を確認
- **Stateが見つからない**: Backend設定を確認、`terraform init -reconfigure`

## 📞 サポート

問題が発生した場合は、以下のドキュメントを確認してください：

- [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- [../docs/rebuild-guide.md](../docs/rebuild-guide.md)
- [../docs/cloudflare-terraform-guide.md](../docs/cloudflare-terraform-guide.md)
