# クイックスタートガイド

このガイドでは、Terraformを使用してAWSインフラを構築する手順を説明します。

> **📌 重要**: 2025年12月より、本プロジェクトはDev/Prod環境を完全分離しています。
> 詳細は [terraform/MIGRATION_GUIDE.md](../terraform/MIGRATION_GUIDE.md) を参照してください。
>
> このガイドは基本的な手順を説明していますが、**環境分離後の最新の構成については上記ガイドを優先してください。**

## 前提条件

- AWSアカウントを持っている
- AWS CLIがインストール・設定済み
- Terraform >= 1.0 がインストール済み
- 適切なAWS認証情報が設定されている

## セットアップ

### 1. AWS認証情報の設定

```bash
# AWS CLIでプロファイルを設定
aws configure --profile your-profile-name
```

または、環境変数を設定：

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=ap-northeast-1
```

### 2. Backend Setupの実行（必須）

**重要**: 本プロジェクトではS3バックエンドが必須です。

```bash
# Backend用のリソースを作成（初回のみ）
cd terraform/backend-setup
terraform init
terraform apply
```

これにより以下が作成されます：
- S3バケット: `kanare-terraform-state-bucket`
- DynamoDBテーブル: `terraform-state-locks`

詳細: [terraform/backend-setup/README.md](../terraform/backend-setup/README.md)

### 3. 環境の選択と変数の設定

**Dev環境の場合**:
```bash
cd terraform/environments/dev
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集
# env = "dev"
# domain_name = "dev.note-app.kanare.dev"
# api_domain_name = "api-dev.note-app.kanare.dev"
```

**Prod環境の場合**:
```bash
cd terraform/environments/prod
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集
# env = "prod"
# domain_name = "note-app.kanare.dev"
# api_domain_name = "api.note-app.kanare.dev"
```

### 4. Terraformの初期化

```bash
terraform init
```

### 5. 実行計画の確認

```bash
terraform plan
```

### 6. インフラの作成

```bash
terraform apply
```

確認を求められたら `yes` を入力します。

## リソースの確認

デプロイ後、以下のコマンドで出力を確認できます：

```bash
terraform output
```

主な出力：
- `api_gateway_url`: API GatewayのURL
- `s3_website_endpoint`: S3静的Webサイトのエンドポイント
- `cognito_user_pool_id`: Cognito User Pool ID

## テスト

### APIのテスト

```bash
# API GatewayのURLを取得
API_URL=$(terraform output -raw api_gateway_url)

# ルートエンドポイントのテスト
curl $API_URL/

# ユーザー一覧の取得
curl $API_URL/users

# ユーザーの作成
curl -X POST $API_URL/users \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","email":"test@example.com","name":"Test User"}'
```

### S3静的ホスティングのテスト

```bash
# サンプルHTMLファイルをアップロード
cat > index.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>MVP Web App</title>
</head>
<body>
    <h1>Welcome to MVP Web App</h1>
    <p>API Gateway URL: <span id="api-url"></span></p>
    <script>
        document.getElementById('api-url').textContent = '$API_URL';
    </script>
</body>
</html>
EOF

# S3バケット名を取得
BUCKET_NAME=$(terraform output -raw s3_bucket_id)

# ファイルをアップロード
aws s3 cp index.html s3://$BUCKET_NAME/index.html

# 静的ホスティングのURLを取得
WEBSITE_URL=$(terraform output -raw s3_website_endpoint)
echo "Website URL: http://$WEBSITE_URL"
```

## クリーンアップ

インフラを削除する場合：

```bash
terraform destroy
```

## トラブルシューティング

### Lambda関数のエラー

Lambda関数のログを確認：

```bash
LAMBDA_NAME=$(terraform output -raw lambda_function_name)
aws logs tail /aws/lambda/$LAMBDA_NAME --follow
```

### API Gatewayのエラー

API Gatewayのログを確認：

```bash
API_ID=$(terraform output -raw api_gateway_id)
aws logs describe-log-groups --log-group-name-prefix "/aws/apigateway/$API_ID"
```

## 次のステップ

1. ADRを読んで設計決定を確認: `adr/`
2. モジュールをカスタマイズ: `modules/`
3. CI/CDパイプラインを設定: `ci-cd/`
4. 設計書を確認: `docs/`

