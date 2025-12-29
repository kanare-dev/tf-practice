# environments/dev/ - 開発環境構成

このディレクトリは、AWS + Cloudflareを使用したサーバーレス構成の**開発環境**です。

> **注**: 本番環境（Prod）とは完全に分離されており、Terraform Stateも独立しています。Dev環境での変更はProd環境に影響しません。

## 🏗️ 構成内容

### ドメイン

- **Webサイト**: dev.note-app.kanare.dev
- **API**: api-dev.note-app.kanare.dev

### AWS リソース

- **S3**: 静的Webサイトホスティング (`dev.note-app.kanare.dev`)
- **CloudFront**: CDN、HTTPS配信
- **ACM証明書**: SSL/TLS証明書（us-east-1）
- **API Gateway**: REST API（カスタムドメイン、レート制限）
- **Lambda**: APIバックエンド（`note-api-handler-dev`）
- **DynamoDB**: NoSQLデータベース（`NotesTable-dev`）
- **Cognito**: ユーザー認証（`note-app-user-pool-dev`）

### Cloudflare（オプション）

- **DNS管理**: Terraform Providerで自動管理可能
  - ACM証明書検証用CNAMEレコード
  - CloudFront向けCNAMEレコード（`dev.note-app`）
  - API Gateway向けCNAMEレコード（`api-dev.note-app`）

## 📁 ファイル一覧

- `backend.tf` - S3バックエンド設定（State: `dev/terraform.tfstate`）
- `main.tf` - メインリソース定義（AWS + Cloudflare）
- `variables.tf` - 変数定義（env, domain_name等）
- `outputs.tf` - 出力定義（エンドポイント、DNS情報など）
- `terraform.tfvars.example` - 設定例（これをコピーして使用）
- `terraform.tfvars` - 実際の設定（.gitignoreで除外、手動作成）

## 🚀 デプロイ手順

### 前提条件

- Backend Setupが完了していること（`terraform/backend-setup`で実行）
- AWS認証情報が設定されていること
- Cloudflare APIトークン（DNS自動管理を使用する場合）

### 1. 設定ファイルの作成

```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
```

### 2. terraform.tfvarsを編集

```hcl
# 環境設定
env              = "dev"
domain_name      = "dev.note-app.kanare.dev"
api_domain_name  = "api-dev.note-app.kanare.dev"

# AWS設定
aws_region = "ap-northeast-1"

# Cloudflare DNS自動管理（オプション）
enable_cloudflare_dns = true  # 自動管理する場合
cloudflare_api_token  = "your-api-token-here"
cloudflare_zone_id    = "your-zone-id-here"
```

**注意**: 
- `terraform.tfvars`は`.gitignore`で除外されています
- APIトークンなどの機密情報を含むため、絶対にGitにコミットしないでください

### 3. Terraformを実行

```bash
terraform init    # プロバイダのダウンロード
terraform plan    # 変更内容の確認
terraform apply   # リソースの作成
```

### 4. 出力の確認

```bash
terraform output
```

主な出力：
- `cloudfront_domain_name`: CloudFrontのドメイン
- `api_gateway_url`: API GatewayのURL
- `acm_dns_validation_options`: ACM証明書検証用DNS情報

## Cloudflare DNS管理について

### Option A: 手動管理（デフォルト）

`terraform.tfvars`で`enable_cloudflare_dns = false`（またはコメントアウト）の場合：

1. `terraform apply`を実行
2. `terraform output`でDNS設定値を確認
3. Cloudflareダッシュボードで手動設定

詳細: [再構築ガイド](../../../docs/rebuild-guide.md)

### Option B: 自動管理（推奨）

`terraform.tfvars`で`enable_cloudflare_dns = true`の場合：

1. Cloudflare APIトークンを取得
2. `terraform.tfvars`に設定
3. `terraform apply`で自動的にDNSレコードが作成される

詳細: [Cloudflare Terraform導入ガイド](../../../docs/cloudflare-terraform-guide.md)

---

## リソースのタグ規則

本プロジェクトの AWS リソースには、以下のタグを一貫して設定します：

- `Name`: `<環境名>-<プロジェクト名>-<リソース種別>`
  - 例: `dev-tfpractice-vpc`
- `system`: プロジェクト名（例: `tfpractice`）
- `env`: 環境名（例: `dev`）

> 将来的に他リソース（サブネット、IGW、S3、Lambda など）でも同じタグ設計と命名規則を採用してください。

今後はここに 1 つずつリソースを追加・発展させていきます。
最終的には docs/goal_structure_20251217.md を目指します。

---

## 作成したリソースの削除方法

```bash
terraform destroy
```

- 削除されるリソースの一覧と確認が求められ、"yes"で削除が実行されます
- Cloudflare DNSレコードも自動管理している場合は一緒に削除されます
- S3バケット内のファイルは事前削除が必要な場合があります

### 再構築について

`terraform destroy` → `terraform apply`でインフラを再構築する場合：

- **Cloudflare自動管理あり**: 完全に自動復元
- **Cloudflare手動管理**: DNSレコードの再設定が必要

詳細: [再構築ガイド](../../../docs/rebuild-guide.md)

---

## 🔄 Prod環境への適用

Dev環境でテストした変更をProd環境に適用する手順：

1. **Dev環境で動作確認**
   ```bash
   # Dev環境の確認
   terraform plan
   terraform apply
   # 動作テスト
   ```

2. **Prod環境に適用**
   ```bash
   cd ../prod
   # 同じ変更を適用
   terraform plan  # 必ず確認！
   terraform apply
   ```

詳細: [環境分離マイグレーションガイド](../../MIGRATION_GUIDE.md)

## 📚 関連ドキュメント

- [../../MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md) - **環境分離の詳細ガイド**
- [../../../docs/deployment-guide.md](../../../docs/deployment-guide.md) - 初回デプロイの詳細手順
- [../../../docs/rebuild-guide.md](../../../docs/rebuild-guide.md) - destroy→apply時の手順
- [../../../docs/cloudflare-terraform-guide.md](../../../docs/cloudflare-terraform-guide.md) - DNS自動管理の設定
- [../../../docs/rate-limiting-setup.md](../../../docs/rate-limiting-setup.md) - API Gatewayのレート制限
- [../../../adr/](../../../adr/) - 設計決定の記録

---

## 🔧 トラブルシューティング

### エラー: "expected DNS record to not already be present"

**原因**: Cloudflareに同じ名前のDNSレコードが既に存在

**対処法**: 既存レコードをTerraformにインポート
```bash
terraform import 'cloudflare_record.note_app[0]' <zone-id>/<record-id>
```

詳細: [Cloudflare Terraform導入ガイド](../../../docs/cloudflare-terraform-guide.md)

### エラー: "Certificate validation timeout"

**原因**: ACM証明書の検証が完了していない

**対処法**: 
1. CloudflareのDNS設定を確認
2. DNS伝播を待つ（最大30分）
3. "Proxy status"が"DNS only"になっているか確認
