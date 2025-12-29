# Terraform Backend Setup

このディレクトリは、Terraform State管理用のS3バケットとDynamoDBテーブルを作成します。

## 使用方法

### 初回セットアップ（1回のみ実行）

```bash
cd terraform/backend-setup
terraform init
terraform apply
```

### 作成されるリソース

- **S3バケット**: `kanare-terraform-state-bucket`
  - バージョニング有効
  - 暗号化有効（AES256）
  - パブリックアクセスブロック設定

- **DynamoDBテーブル**: `terraform-state-locks`
  - State Lock用
  - PAY_PER_REQUEST課金モード

### 注意事項

- このディレクトリは初回セットアップ後、通常は触りません
- Backend用リソースを削除する場合は、先に全環境のStateを別の場所に移行してください
- このディレクトリ自体のStateはローカルに保存されます

### 次のステップ

Backend作成後、各環境（prod/dev）で以下を実行：

```bash
# Prod環境
cd terraform/environments/prod
terraform init -migrate-state

# Dev環境
cd terraform/environments/dev
terraform init
```
