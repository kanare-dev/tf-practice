# Dev/Prod環境分離 マイグレーションガイド

このガイドでは、単一AWSアカウント内でTerraformのディレクトリ構成によりdev/prod環境を安全に分離する手順を説明します。

## 📋 概要

### 変更内容
- Terraform Stateを環境ごとに完全分離（S3バックエンド使用）
- ディレクトリ構成による環境分離（`environments/prod`、`environments/dev`）
- Prod環境の既存リソースを維持（destroy/recreate なし）
- Dev環境は新規スタックとして構築
- 環境変数による命名規則の統一
- Prod環境の重要リソースにlifecycle保護を追加

### ディレクトリ構成

```
terraform/
├── backend-setup/          # Terraform State管理用（初回のみ実行）
│   ├── main.tf
│   └── README.md
├── modules/                # 共有モジュール
│   ├── s3/
│   ├── lambda/
│   ├── dynamodb/
│   ├── api-gateway/
│   └── cognito/
└── environments/
    ├── prod/              # 本番環境
    │   ├── backend.tf     # State: s3://kanare-terraform-state-bucket/prod/terraform.tfstate
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   └── terraform.tfvars
    └── dev/               # 開発環境
        ├── backend.tf     # State: s3://kanare-terraform-state-bucket/dev/terraform.tfstate
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        └── terraform.tfvars
```

### 環境ごとのリソース命名

| リソース | Prod | Dev |
|---------|------|-----|
| ドメイン | note-app.kanare.dev | dev.note-app.kanare.dev |
| APIドメイン | api.note-app.kanare.dev | api-dev.note-app.kanare.dev |
| S3バケット | note-app.kanare.dev | dev.note-app.kanare.dev |
| DynamoDB | NotesTable-prod | NotesTable-dev |
| Lambda | note-api-handler-prod | note-api-handler-dev |
| API Gateway | note-api-gateway-prod | note-api-gateway-dev |
| Cognito | note-app-user-pool-prod | note-app-user-pool-dev |

## 🚀 マイグレーション手順

### Phase 1: Terraform State管理用リソースの作成

```bash
# 1. Backend用のS3バケットとDynamoDBテーブルを作成
cd terraform/backend-setup
terraform init
terraform apply

# 出力を確認
# - S3 Bucket: kanare-terraform-state-bucket
# - DynamoDB Table: terraform-state-locks
```

**注意**: このステップは1回のみ実行します。作成されたリソースは全環境で共有されます。

### Phase 2: Prod環境の準備（既存リソースの維持）

```bash
# 2. Prod環境ディレクトリに移動
cd ../environments/prod

# 3. Dev環境の既存Stateをコピー
cp ../dev/terraform.tfstate ./terraform.tfstate

# 4. .terraformディレクトリを削除（クリーンな状態で開始）
rm -rf .terraform

# 5. Backend設定を初期化し、Stateを移行
terraform init -migrate-state

# プロンプトで以下を確認:
# - 既存のStateをS3に移行するか? → yes

# 6. 差分がないことを確認（重要！）
terraform plan

# 期待される出力: "No changes. Your infrastructure matches the configuration."
# もし差分がある場合、変更内容を確認してから進めてください
```

**重要な注意点**:
- Step 3でdev環境のStateをコピーするのは、既存の本番リソースのStateがdev環境に保存されていたためです
- Step 4で.terraformディレクトリを削除することで、バックエンド設定を確実にリセットします

**重要**: `terraform plan`で差分がないことを必ず確認してください。差分がある場合、既存リソースに影響が出る可能性があります。

### Phase 3: Dev環境の新規構築

```bash
# 6. Dev環境ディレクトリに移動
cd ../dev

# 7. ローカルのStateファイルを削除（既存のStateは不要）
rm -f terraform.tfstate terraform.tfstate.backup .terraform.lock.hcl
rm -rf .terraform/

# 8. Backend設定を初期化
terraform init

# 9. Dev環境のリソースを確認
terraform plan

# 期待される出力: 全てのリソースが新規作成（+）として表示される
# - S3バケット: dev.note-app.kanare.dev
# - CloudFront distribution
# - ACM証明書（2つ）
# - API Gateway
# - Lambda関数
# - DynamoDB: NotesTable-dev
# - Cognito User Pool
# - Cloudflare DNSレコード

# 10. Dev環境を構築
terraform apply

# 確認を求められたら "yes" と入力
```

**注意**:
- ACM証明書の検証には数分かかります
- Cloudflare DNSレコードの伝播にも時間がかかる場合があります

### Phase 4: 検証

```bash
# 11. Prod環境が影響を受けていないか確認
cd ../prod
terraform plan

# 期待される出力: "No changes."

# 12. Prod環境のStateを確認
terraform state list

# 13. Dev環境のStateを確認
cd ../dev
terraform state list

# 14. 各環境のリソースが正しく分離されていることを確認
# - Prod: note-app.kanare.dev 関連のリソースのみ
# - Dev: dev.note-app.kanare.dev 関連のリソースのみ
```

## 🔒 Lifecycle保護について

### Prod環境の保護設定

以下のリソースには`prevent_destroy = true`が設定されています：

1. **CloudFront Distribution** (`environments/prod/main.tf:115`)
2. **ACM証明書（2つ）** (`environments/prod/main.tf:55`, `environments/prod/main.tf:188`)
   - note-app.kanare.dev用
   - api.note-app.kanare.dev用

これらのリソースは`terraform destroy`で削除できません。削除する場合は、該当の`lifecycle`ブロックを手動で削除してから実行してください。

### モジュール経由リソースの保護

**⚠️ Terraformの制限**: `lifecycle`ブロック内では変数を使用できないため、モジュール経由のリソース（S3バケット、DynamoDBテーブル）には`prevent_destroy`を直接設定できません。

**代替保護策**:

1. **S3バケット**
   - バージョニング有効化（設定済み）
   - MFA Delete有効化（推奨）
   - バケットポリシーでの削除制限

2. **DynamoDBテーブル**
   - Point-in-time recovery有効化（設定済み）
   - AWS Backupでの定期バックアップ
   - IAM権限での削除制限

3. **IAMポリシーでの保護**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Deny",
         "Action": [
           "s3:DeleteBucket",
           "dynamodb:DeleteTable"
         ],
         "Resource": [
           "arn:aws:s3:::note-app.kanare.dev",
           "arn:aws:dynamodb:ap-northeast-1:*:table/NotesTable-prod"
         ]
       }
     ]
   }
   ```

### Dev環境

Dev環境にはlifecycle保護がないため、自由に`terraform destroy`で削除できます。

## 📝 運用ガイド

### 環境の切り替え

```bash
# Prod環境で作業
cd terraform/environments/prod
terraform plan
terraform apply

# Dev環境で作業
cd terraform/environments/dev
terraform plan
terraform apply
```

### 新しい変更のテスト

1. Dev環境で変更をテスト
2. `terraform plan`で差分を確認
3. `terraform apply`で適用
4. 動作確認
5. 問題なければProd環境に同じ変更を適用

### Stateの確認

```bash
# リソース一覧の表示
terraform state list

# 特定のリソースの詳細表示
terraform state show <resource_name>

# S3上のState確認
aws s3 ls s3://kanare-terraform-state-bucket/
aws s3 ls s3://kanare-terraform-state-bucket/prod/
aws s3 ls s3://kanare-terraform-state-bucket/dev/
```

### バックアップとロールバック

S3バケットのバージョニングが有効なため、Stateファイルは自動的にバージョン管理されます。

```bash
# S3上のStateのバージョンを確認
aws s3api list-object-versions \
  --bucket kanare-terraform-state-bucket \
  --prefix prod/terraform.tfstate

# 古いバージョンを復元（必要な場合）
aws s3api get-object \
  --bucket kanare-terraform-state-bucket \
  --key prod/terraform.tfstate \
  --version-id <VERSION_ID> \
  terraform.tfstate.restored
```

## ⚠️ 注意事項

### DO

- ✅ 変更前に必ず`terraform plan`で差分を確認
- ✅ Prod環境での変更は慎重に実行
- ✅ Dev環境で十分にテストしてからProd環境に適用
- ✅ 定期的にStateのバックアップを確認

### DON'T

- ❌ Prod環境で`terraform destroy`を実行しない
- ❌ 手動でStateファイルを編集しない
- ❌ 異なる環境のtfvarsファイルを混同しない
- ❌ Backend設定を変更した後、`terraform init`を忘れない

## 🔧 トラブルシューティング

### State Lockエラー

```bash
# DynamoDBのLockを確認
aws dynamodb scan --table-name terraform-state-locks

# 必要に応じてLockを手動解除（注意して実行）
terraform force-unlock <LOCK_ID>
```

### ACM証明書の検証が完了しない

```bash
# DNSレコードの確認
terraform output

# Cloudflare DNSレコードの確認
dig _<validation_string>.note-app.kanare.dev CNAME

# 必要に応じてCloudflare側で手動設定
```

### Prod環境のStateが見つからない

```bash
# S3バケットの確認
aws s3 ls s3://kanare-terraform-state-bucket/prod/

# Backend設定の確認
cat backend.tf

# 再初期化
terraform init -reconfigure
```

## 📚 参考情報

### ファイル構成

- `backend.tf`: S3バックエンド設定
- `main.tf`: リソース定義
- `variables.tf`: 変数定義
- `outputs.tf`: 出力値定義
- `terraform.tfvars`: 変数の値（環境ごとに異なる）

### 重要な変数

```hcl
variable "env" {
  # prod または dev
  # lifecycle保護の制御に使用
}

variable "domain_name" {
  # prod: note-app.kanare.dev
  # dev: dev.note-app.kanare.dev
}

variable "api_domain_name" {
  # prod: api.note-app.kanare.dev
  # dev: api-dev.note-app.kanare.dev
}
```

## 🎯 次のステップ

1. ✅ Backend setupの実行
2. ✅ Prod環境のState移行
3. ✅ Dev環境の構築
4. 🔄 フロントエンドの環境変数を更新（dev環境用）
5. 🔄 CI/CDパイプラインの更新（環境ごとのデプロイ）
6. 🔄 監視・アラート設定（環境ごと）

## 📞 サポート

問題が発生した場合は、以下を確認してください：

1. `terraform plan`の出力
2. `terraform.tfstate`の場所と内容
3. AWS S3とDynamoDBのリソース状態
4. Cloudflare DNSレコードの設定

---

**重要**: このマイグレーションは既存の本番環境に影響を与えません。すべての変更は可逆的で、問題が発生した場合はStateのバージョンを復元できます。
