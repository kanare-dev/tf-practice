# environments/prod/ - 本番環境構成

このディレクトリは、AWS + Cloudflareを使用したサーバーレス構成の**本番環境**です。

## ⚠️ 重要事項

本番環境のため、以下の点に注意してください：

- ✅ **慎重な変更**: 必ず`terraform plan`で差分を確認してから`apply`
- ✅ **Dev環境でテスト**: 新しい変更は必ずDev環境で先にテスト
- ✅ **Lifecycle保護**: 重要リソースは誤って削除できないよう保護されています
- ❌ **Destroy禁止**: `terraform destroy`は実行しないでください

## 🏗️ 構成内容

### ドメイン

- **Webサイト**: note-app.kanare.dev
- **API**: api.note-app.kanare.dev

### AWS リソース

- **S3**: 静的Webサイトホスティング (`note-app.kanare.dev`)
- **CloudFront**: CDN、HTTPS配信（lifecycle保護あり）
- **ACM証明書**: SSL/TLS証明書（us-east-1）（lifecycle保護あり）
- **API Gateway**: REST API（カスタムドメイン、レート制限）
- **Lambda**: APIバックエンド（`note-api-handler-prod`）
- **DynamoDB**: NoSQLデータベース（`NotesTable-prod`）（lifecycle保護あり）
- **Cognito**: ユーザー認証（`note-app-user-pool-prod`）

### Cloudflare（オプション）

- **DNS管理**: Terraform Providerで自動管理可能
  - ACM証明書検証用CNAMEレコード
  - CloudFront向けCNAMEレコード（`note-app`）
  - API Gateway向けCNAMEレコード（`api.note-app`）

## 📁 ファイル一覧

- `backend.tf` - S3バックエンド設定（State: `prod/terraform.tfstate`）
- `main.tf` - メインリソース定義（lifecycle保護あり）
- `variables.tf` - 変数定義
- `outputs.tf` - 出力定義
- `terraform.tfvars.example` - 設定例
- `terraform.tfvars` - 実際の設定（.gitignoreで除外、手動作成）

## 🚀 デプロイ手順

### 前提条件

- Backend Setupが完了していること（`terraform/backend-setup`で実行）
- AWS認証情報が設定されていること
- Cloudflare APIトークン（DNS自動管理を使用する場合）

### 1. 設定ファイルの作成

```bash
cd terraform/environments/prod
cp terraform.tfvars.example terraform.tfvars
```

### 2. terraform.tfvarsを編集

```hcl
# 環境設定
env              = "prod"
domain_name      = "note-app.kanare.dev"
api_domain_name  = "api.note-app.kanare.dev"

# AWS設定
aws_region = "ap-northeast-1"

# Cloudflare DNS自動管理（オプション）
enable_cloudflare_dns = true
cloudflare_api_token  = "your-api-token-here"
cloudflare_zone_id    = "your-zone-id-here"
```

**注意**:
- `terraform.tfvars`は`.gitignore`で除外されています
- APIトークンなどの機密情報を含むため、絶対にGitにコミットしないでください

### 3. Terraformを実行

```bash
# Backend設定の初期化
terraform init

# 変更内容の確認（重要！）
terraform plan

# リソースの作成・更新
terraform apply
```

### 4. 出力の確認

```bash
terraform output
```

主な出力：
- `cloudfront_domain_name`: CloudFrontのドメイン
- `api_gateway_url`: API GatewayのURL
- `acm_dns_validation_options`: ACM証明書検証用DNS情報

## 🔒 Lifecycle保護について

以下のリソースには`prevent_destroy = true`が設定されており、誤って削除できません：

1. **CloudFront Distribution**
2. **ACM証明書（2つ）**
   - note-app.kanare.dev用
   - api.note-app.kanare.dev用

**⚠️ 重要**: Terraformの仕様上、`lifecycle`ブロック内では変数を使用できないため、モジュール経由のリソース（S3バケット、DynamoDBテーブル）には`prevent_destroy`を設定できません。

### モジュール経由リソースの保護策

**S3バケット**の保護:
- ✅ バージョニング有効化済み
- ✅ パブリックアクセスブロック設定済み
- 推奨: バケットポリシーでの削除制限
- 推奨: MFA Delete有効化

**DynamoDBテーブル**の保護:
- ✅ Point-in-time recovery有効化済み
- 推奨: AWS Backupでの定期バックアップ
- 推奨: IAM権限での削除制限

### 削除する場合

これらのリソースを削除する必要がある場合は：

1. 該当のリソース定義から`prevent_destroy = true`を削除
2. `terraform plan`で確認
3. `terraform apply`で変更を適用
4. その後、`terraform destroy`が可能になります

**注意**: 本番環境のリソース削除は慎重に行ってください。

## 🔄 変更の適用手順

### 推奨フロー

1. **Dev環境でテスト**
   ```bash
   cd ../dev
   # 変更を適用
   terraform plan
   terraform apply
   # 動作確認
   ```

2. **Prod環境に適用**
   ```bash
   cd ../prod
   # 同じ変更を適用
   terraform plan  # 必ず確認！
   terraform apply
   ```

### 緊急時のロールバック

```bash
# Stateのバージョンを確認
aws s3api list-object-versions \
  --bucket kanare-terraform-state-bucket \
  --prefix prod/terraform.tfstate

# 必要に応じて古いバージョンを復元
```

## 📊 リソースのタグ規則

本番環境のAWSリソースには、以下のタグが設定されています：

- `Name`: `prod-tfpractice-<リソース種別>`
- `Environment`: `prod`
- `System`: `tfpractice`
- `ManagedBy`: `terraform`

## 📚 関連ドキュメント

- [../../../docs/deployment-guide.md](../../../docs/deployment-guide.md) - デプロイガイド
- [../../../docs/cloudflare-terraform-guide.md](../../../docs/cloudflare-terraform-guide.md) - Cloudflare DNS自動管理
- [../../../adr/](../../../adr/) - 設計決定の記録

## ⚠️ トラブルシューティング

### エラー: "Resource protected by prevent_destroy"

**原因**: Lifecycle保護されたリソースを削除しようとしている

**対処法**:
1. 本当に削除が必要か再確認
2. 必要であれば、該当リソースの`prevent_destroy`を削除
3. Dev環境で同様の操作をテストしてから実行

### エラー: "State lock error"

**原因**: 他の操作が実行中、または前回の操作が異常終了

**対処法**:
```bash
# Lock情報の確認
aws dynamodb scan --table-name terraform-state-locks

# Lock解除（慎重に）
terraform force-unlock <LOCK_ID>
```

### エラー: "Certificate validation timeout"

**原因**: ACM証明書の検証が完了していない

**対処法**:
1. CloudflareのDNS設定を確認
2. DNS伝播を待つ（最大30分）
3. "Proxy status"が"DNS only"になっているか確認

## 🆘 緊急時の対応

### 本番環境に問題が発生した場合

1. **まず影響範囲を確認**
   ```bash
   terraform state list
   terraform show
   ```

2. **Stateのバックアップを確認**
   - S3バージョニングで自動保存されています
   - 必要に応じて復元可能

3. **問題の切り分け**
   - Terraform の問題か、AWS側の問題か
   - CloudFlareの問題か

4. **ロールバック検討**
   - Stateの復元
   - DNSの手動切り戻し

5. **サポートに連絡**
   - AWSサポート
   - Cloudflareサポート

---

**重要**: 本番環境への変更は慎重に行ってください。不明点があれば、まずDev環境でテストするか、チームメンバーに相談してください。
