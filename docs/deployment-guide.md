# AWS デプロイガイド

このガイドでは、このリポジトリをあなたの AWS アカウントにデプロイする詳細な手順を説明します。

## 目次

1. [環境構成について](#環境構成について)
2. [前提条件](#前提条件)
3. [AWS アカウントの準備](#awsアカウントの準備)
4. [AWS 認証情報の設定](#aws認証情報の設定)
5. [デプロイ手順](#デプロイ手順)
6. [フロントエンドのデプロイ](#フロントエンドのデプロイ)
7. [AWS 料金について](#aws料金について)
8. [リソースの確認](#リソースの確認)
9. [クリーンアップ（リソースの削除）](#クリーンアップリソースの削除)
10. [トラブルシューティング](#トラブルシューティング)

## 環境構成について

本プロジェクトは **Dev/Prod 環境を完全分離** しています：

- **Dev 環境**: `dev.note-app.kanare.dev` - 開発・テスト用（自由に破棄・再構築可能）
- **Prod 環境**: `note-app.kanare.dev` - 本番環境（lifecycle 保護あり）

各環境は独立した Terraform State で管理され、完全に分離された AWS リソースを持ちます。

**環境分離の特徴**:

- 各環境専用のディレクトリ: `terraform/environments/dev/` および `terraform/environments/prod/`
- 独立した S3 バックエンド（同一バケット内で別の State キー）
- 環境ごとに異なるドメイン、API エンドポイント、リソース名
- Prod 環境には重要リソースの削除保護（`prevent_destroy = true`）

**最初は Dev 環境から始めることを推奨します。**

## 前提条件

以下のツールがインストールされている必要があります：

- **Terraform** >= 1.0

  ```bash
  # インストール確認
  terraform version
  ```

- **AWS CLI** >= 2.0

  ```bash
  # インストール確認
  aws --version
  ```

- **Node.js** >= 18（フロントエンド開発用）
- **Python 3.11**（Lambda 関数用）

## AWS アカウントの準備

### 1. AWS アカウントの作成

まだ AWS アカウントをお持ちでない場合：

1. [AWS 公式サイト](https://aws.amazon.com/jp/)にアクセス
2. 「アカウントを作成」をクリック
3. 必要な情報を入力してアカウントを作成

**注意**: 新規アカウントには 12 ヶ月間の無料利用枠（Free Tier）が適用されます。

### 2. IAM ユーザーの作成とアクセスキーの取得

**重要**: ルートアカウントの認証情報は使用せず、IAM ユーザーを作成してください。

1. AWS マネジメントコンソールにログイン
2. IAM サービスに移動
3. 「ユーザー」→「ユーザーを追加」をクリック
4. ユーザー名を入力（例: `terraform-user`）
5. 「プログラムによるアクセス」を選択
6. ポリシーをアタッチ：
   - 開発環境の場合: `AdministratorAccess`（フルアクセス）
   - 本番環境の場合: 必要最小限の権限のみを付与
7. ユーザーを作成
8. **アクセスキー ID**と**シークレットアクセスキー**をメモ（後で確認できません）

### 3. 必要な IAM 権限

Terraform でインフラを管理するには、以下のサービスへのアクセス権限が必要です：

- Amazon S3（バケット作成、オブジェクト管理）
- Amazon CloudFront（ディストリビューション作成）
- AWS Certificate Manager（証明書発行、検証）
- Amazon API Gateway（API 作成、カスタムドメイン設定）
- AWS Lambda（関数作成、コード更新）
- Amazon DynamoDB（テーブル作成、データ管理）
- Amazon Cognito（User Pool 作成、クライアント設定）
- IAM（ロール作成、ポリシーアタッチ）

開発環境では `AdministratorAccess` を推奨しますが、本番環境では最小権限の原則に従ってください。

## AWS 認証情報の設定

### 方法 1: AWS CLI で設定（推奨）

```bash
# デフォルトプロファイルとして設定
aws configure

# または、特定のプロファイル名で設定
aws configure --profile tf-practice
```

設定項目：

- **AWS Access Key ID**: 先ほど取得したアクセスキー ID
- **AWS Secret Access Key**: 先ほど取得したシークレットアクセスキー
- **Default region name**: `ap-northeast-1`（東京リージョン）
- **Default output format**: `json`

### 方法 2: 環境変数で設定

```bash
export AWS_ACCESS_KEY_ID=your-access-key-id
export AWS_SECRET_ACCESS_KEY=your-secret-access-key
export AWS_DEFAULT_REGION=ap-northeast-1
```

### 方法 3: プロファイルを使用する場合

```bash
# プロファイルを設定
aws configure --profile tf-practice

# 使用する際は環境変数で指定
export AWS_PROFILE=tf-practice
```

### 認証情報の確認

```bash
# 認証情報が正しく設定されているか確認
aws sts get-caller-identity
```

正しく設定されていれば、アカウント ID、ユーザー名、ARN が表示されます。

## デプロイ手順

### ステップ 0: Backend Setup（初回のみ）

**重要**: 本プロジェクトでは S3 バックエンドが必須です。最初に一度だけ実行してください。

```bash
# Backend用のリソースを作成
cd terraform/backend-setup
terraform init
terraform apply
```

これにより以下が作成されます：

- S3 バケット: `kanare-terraform-state-bucket`（バージョニング有効）
- DynamoDB テーブル: `terraform-state-locks`（State lock 用）

詳細: [terraform/backend-setup/README.md](../terraform/backend-setup/README.md)

### ステップ 1: 環境の選択

どちらの環境をセットアップするか選択します。

#### Dev 環境の場合（推奨：最初は Dev から）

```bash
cd terraform/environments/dev
```

#### Prod 環境の場合

```bash
cd terraform/environments/prod
```

以降の手順は選択した環境のディレクトリ内で実行します。

### ステップ 2: 変数ファイルの作成

```bash
# サンプルファイルをコピー
cp terraform.tfvars.example terraform.tfvars

# 編集して必要な値を設定
vim terraform.tfvars  # またはお好きなエディタ
```

#### Dev 環境の変数例

```hcl
# AWS設定
aws_region = "ap-northeast-1"

# 環境名（自動設定されるため通常は不要）
# env = "dev"

# ドメイン設定（あなたのドメインに変更）
# domain_name = "dev.your-domain.com"
# api_domain_name = "api-dev.your-domain.com"

# Cloudflare DNS管理（オプション）
# enable_cloudflare_dns = true
# cloudflare_api_token  = "your-cloudflare-api-token-here"
# cloudflare_zone_id    = "your-cloudflare-zone-id-here"

# デフォルトでは手動でCloudflare DNSを設定する必要があります
enable_cloudflare_dns = false
```

**必須の変数**:

- `aws_region`: 使用する AWS リージョン（例: `ap-northeast-1`）

**オプションの変数**:

- `enable_cloudflare_dns`: Cloudflare DNS 自動管理を有効化（`true`/`false`）
- `cloudflare_api_token`: Cloudflare の API トークン（DNS 自動管理時）
- `cloudflare_zone_id`: Cloudflare の Zone ID（DNS 自動管理時）

**注意**: `domain_name` と `api_domain_name` は `variables.tf` でデフォルト値が設定されています。独自ドメインを使用する場合のみ `terraform.tfvars` で上書きしてください。

Cloudflare DNS 自動管理の詳細: [cloudflare-terraform-guide.md](cloudflare-terraform-guide.md)

### ステップ 3: Terraform の初期化

```bash
terraform init
```

このコマンドで：

- Terraform プロバイダー（AWS、Cloudflare）がダウンロードされます
- モジュールが初期化されます
- S3 バックエンドの設定が完了します

### ステップ 4: 実行計画の確認

```bash
terraform plan
```

このコマンドで：

- 作成されるリソースの一覧が表示されます
- 変更内容を確認できます
- エラーがあればここで検出されます

作成されるリソース：

- CloudFront Distribution（静的サイト配信）
- S3 バケット（静的サイト用）
- ACM 証明書 2 つ（静的サイト用、API 用）
- API Gateway（カスタムドメイン、レート制限付き）
- Lambda 関数（API ハンドラー）
- DynamoDB テーブル（ノートデータ保存）
- Cognito User Pool（ユーザー認証）
- Cloudflare DNS レコード（有効化している場合）

**重要**: この段階ではまだリソースは作成されません。

### ステップ 5: インフラのデプロイ

```bash
terraform apply
```

確認を求められたら `yes` を入力します。

**自動承認する場合**:

```bash
terraform apply -auto-approve
```

**注意**:

- ACM 証明書の検証には数分～10 分程度かかります
- Cloudflare DNS レコードの伝播にも時間がかかる場合があります
- 全体で 15～20 分程度かかることがあります

デプロイが完了すると、主要な出力値が表示されます。

### ステップ 6: デプロイ結果の確認

```bash
terraform output
```

主な出力：

- `cloudfront_domain_name`: CloudFront のドメイン名
- `cloudfront_distribution_id`: CloudFront Distribution ID（キャッシュ無効化に使用）
- `s3_bucket_id`: S3 バケット名
- `api_gateway_custom_domain`: API のカスタムドメイン
- `cognito_user_pool_id`: Cognito User Pool ID
- `cognito_user_pool_client_id`: Cognito Client ID
- `dynamodb_table_name`: DynamoDB テーブル名
- `lambda_function_name`: Lambda 関数名

これらの値はフロントエンドのビルドやデプロイで使用します。

## フロントエンドのデプロイ

インフラ構築後、React フロントエンドをビルドして S3 にデプロイします。

### 1. 環境変数の設定

```bash
cd frontend

# Dev環境の場合
cat > .env.production <<EOF
VITE_API_BASE_URL=https://api-dev.note-app.kanare.dev
VITE_AWS_REGION=ap-northeast-1
VITE_USER_POOL_ID=$(cd ../terraform/environments/dev && terraform output -raw cognito_user_pool_id)
VITE_USER_POOL_CLIENT_ID=$(cd ../terraform/environments/dev && terraform output -raw cognito_user_pool_client_id)
EOF

# Prod環境の場合
cat > .env.production <<EOF
VITE_API_BASE_URL=https://api.note-app.kanare.dev
VITE_AWS_REGION=ap-northeast-1
VITE_USER_POOL_ID=$(cd ../terraform/environments/prod && terraform output -raw cognito_user_pool_id)
VITE_USER_POOL_CLIENT_ID=$(cd ../terraform/environments/prod && terraform output -raw cognito_user_pool_client_id)
EOF
```

**注意**: `VITE_API_BASE_URL` はあなたの API ドメインに変更してください。

### 2. ビルド

```bash
# 依存関係のインストール
npm ci

# プロダクションビルド
npm run build
```

ビルドされたファイルは `dist/` ディレクトリに出力されます。

### 3. S3 へのデプロイ

```bash
# Dev環境の場合
aws s3 sync dist/ s3://dev.note-app.kanare.dev/ --delete

# Prod環境の場合
aws s3 sync dist/ s3://note-app.kanare.dev/ --delete
```

`--delete` オプションは、S3 バケット内の古いファイルを削除します。

### 4. CloudFront キャッシュの無効化

```bash
# Dev環境の場合
DISTRIBUTION_ID=$(cd ../terraform/environments/dev && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"

# Prod環境の場合
DISTRIBUTION_ID=$(cd ../terraform/environments/prod && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

キャッシュ無効化により、新しいコンテンツがすぐに配信されます。

### 5. デプロイの確認

```bash
# 静的サイトにアクセス（ブラウザまたはcurl）
# Dev環境の場合
curl -I https://dev.note-app.kanare.dev

# Prod環境の場合
curl -I https://note-app.kanare.dev
```

HTTP 200 が返れば成功です。

**注意**: 本番環境では GitHub Actions で自動デプロイされます。詳細: [cicd-guide.md](cicd-guide.md)

## AWS 料金について

### 料金がかかるサービス

このプロジェクトで使用する AWS サービスは、以下の通り課金されます：

#### 1. **AWS Lambda**

- **無料利用枠**: 月間 100 万リクエスト、40 万 GB 秒の計算時間
- **超過分**:
  - リクエスト: $0.20/100 万リクエスト
  - 計算時間: $0.0000166667/GB 秒
- **見積もり**: 軽量な使用であれば無料枠内で収まる可能性が高い

#### 2. **API Gateway**

- **無料利用枠**: 月間 100 万リクエスト（最初の 12 ヶ月間）
- **超過分**: $3.50/100 万リクエスト
- **見積もり**: 開発・テスト用途であれば無料枠内で収まる可能性が高い

#### 3. **Amazon DynamoDB**

- **オンデマンド課金モード**（このプロジェクトの設定）:
  - 読み込み: $1.25/100 万リクエスト
  - 書き込み: $1.25/100 万リクエスト
- **無料利用枠**: なし（オンデマンドモードの場合）
- **見積もり**: 少量のデータ操作であれば月額$1-5 程度

#### 4. **Amazon S3**

- **ストレージ**: 最初の 50GB は無料（12 ヶ月間）、以降 $0.023/GB/月
- **リクエスト**:
  - GET: $0.0004/1000 リクエスト
  - PUT: $0.005/1000 リクエスト
- **見積もり**: 小規模な使用であれば月額$1 未満

#### 5. **Amazon CloudFront**

- **無料利用枠**: 月間 1TB のデータ転送、1000 万リクエスト（12 ヶ月間）
- **超過分**:
  - データ転送: $0.114/GB（最初の 10TB）
  - リクエスト: $0.0075/10,000 リクエスト
- **見積もり**: 小規模なサイトであれば無料枠内で収まる可能性が高い

#### 6. **AWS Certificate Manager（ACM）**

- **料金**: 無料（パブリック証明書）
- CloudFront や API Gateway で使用する証明書は無料です

#### 7. **Amazon Cognito**

- **無料利用枠**: 月間 5 万 MAU（Monthly Active Users）
- **超過分**: $0.0055/MAU
- **見積もり**: 開発・テスト用途であれば無料枠内で収まる可能性が高い

### 料金見積もり（環境別）

#### 開発環境（Dev）

**軽量な使用（開発・学習用途）の場合**:

- 月間リクエスト数: 1,000-10,000 回程度
- データ量: 数 MB 程度
- アクティブユーザー: 1-10 人程度
- **予想月額料金: $1-5 程度**

#### 本番環境（Prod）

**小規模サービスの場合**:

- 月間リクエスト数: 10 万回程度
- データ転送量: 数 GB 程度
- アクティブユーザー: 100 人程度
- **予想月額料金: $5-20 程度**

**注意事項**:

- 無料利用枠は新規アカウントの最初の 12 ヶ月間に適用されます
- リージョンによって料金が異なる場合があります
- 実際の使用量に応じて料金が変動します

### 料金の監視

1. **AWS Cost Explorer**で料金を確認:

   ```bash
   # AWSマネジメントコンソールから
   # 「請求」→「コストエクスプローラー」にアクセス
   ```

2. **予算アラートの設定**:

   - AWS マネジメントコンソールで「請求」→「予算」から設定可能
   - 月額$10 などの予算を設定して、超過時に通知を受け取れます

3. **タグによるコスト管理**:
   - このプロジェクトのリソースには環境ごとのタグが付与されます
   - Dev 環境: `Environment = "dev"`
   - Prod 環境: `Environment = "prod"`
   - タグでフィルタリングしてコストを確認できます

### コスト削減のヒント

1. **使用しないリソースは削除**: `terraform destroy`でリソースを削除
2. **開発環境は必要時のみ起動**: 使用しない時間はリソースを削除
3. **DynamoDB のオンデマンドモード**: 使用量が少ない場合はオンデマンドモードがお得
4. **CloudFront のキャッシュ最適化**: キャッシュヒット率を上げてオリジンアクセスを減らす
5. **S3 のライフサイクルポリシー**: 古いファイルを自動削除または Glacier に移行

## リソースの確認

### AWS マネジメントコンソールで確認

以下のサービスでリソースが作成されていることを確認できます：

1. **CloudFront**: ディストリビューションが作成されています
2. **S3**: バケットが作成されています（静的サイト用）
3. **ACM**: 証明書が 2 つ作成されています（静的サイト用、API 用）
4. **API Gateway**: REST API が作成されています
5. **Lambda**: 関数が作成されています
6. **DynamoDB**: テーブルが作成されています
7. **Cognito**: User Pool が作成されています

### コマンドで確認

```bash
# CloudFrontディストリビューションの確認
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,Aliases.Items[0]]"

# S3バケットの確認
BUCKET_NAME=$(terraform output -raw s3_bucket_id)
aws s3 ls s3://$BUCKET_NAME/

# DynamoDBテーブルの確認
TABLE_NAME=$(terraform output -raw dynamodb_table_name)
aws dynamodb describe-table --table-name $TABLE_NAME

# Lambda関数の確認
LAMBDA_NAME=$(terraform output -raw lambda_function_name)
aws lambda get-function --function-name $LAMBDA_NAME

# API Gatewayのテスト（要認証）
API_DOMAIN=$(terraform output -raw api_gateway_custom_domain)
curl https://$API_DOMAIN/
```

**注意**: API エンドポイントは Cognito 認証が必要です。認証なしでアクセスすると 401 エラーが返ります。

## クリーンアップ（リソースの削除）

**重要**: リソースを削除しないと、継続的に料金が発生します。

### Dev 環境の削除（自由に削除可能）

```bash
cd terraform/environments/dev
terraform destroy
```

確認を求められたら `yes` を入力します。

**自動承認する場合**:

```bash
terraform destroy -auto-approve
```

Dev 環境には lifecycle 保護がないため、すべてのリソースが削除されます。

### Prod 環境の削除（要注意）

Prod 環境には重要なリソースに削除保護（`prevent_destroy = true`）が設定されています：

- CloudFront Distribution
- ACM 証明書（静的サイト用、API 用）

削除するには、まず `main.tf` の該当箇所から `lifecycle` ブロックを手動で削除する必要があります。

```hcl
# main.tf 内の該当リソースから以下を削除
lifecycle {
  prevent_destroy = true
}
```

その後、`terraform destroy` を実行します。

### Backend リソースの削除（最後のみ）

すべての環境を削除した後、Backend リソースも削除できます：

```bash
cd terraform/backend-setup
terraform destroy
```

**注意**: Backend を削除すると、すべての Terraform State が失われます。本当に必要な場合のみ実行してください。

### 削除後の確認

```bash
# S3バケットが削除されたことを確認
aws s3 ls | grep note-app

# DynamoDBテーブルが削除されたことを確認
aws dynamodb list-tables | grep NotesTable

# CloudFrontディストリビューションが削除されたことを確認
aws cloudfront list-distributions --query "DistributionList.Items[*].[Id,Aliases.Items[0]]"
```

## トラブルシューティング

### エラー: "Access Denied"

**原因**: IAM ユーザーに必要な権限が付与されていない

**解決策**:

1. IAM ユーザーに `AdministratorAccess` ポリシーをアタッチ
2. または、必要な権限のみを個別に付与

### エラー: "Bucket already exists"

**原因**: S3 バケット名が既に使用されている

**解決策**:

1. `variables.tf` の `domain_name` を変更（S3 バケット名はドメイン名から自動生成されます）
2. または、既存のバケットを削除

### エラー: "ACM certificate validation timeout"

**原因**: ACM 証明書の DNS 検証が完了していない

**解決策**:

1. Cloudflare DNS が有効化されている場合は、自動で CNAME レコードが作成されます
2. 手動の場合は、`terraform output` で表示された CNAME レコードを Cloudflare に追加してください
3. Cloudflare のプロキシ（オレンジクラウド）を無効化（灰色クラウド）してください

```bash
# 証明書の検証状態を確認
aws acm describe-certificate --certificate-arn <ARN>
```

### エラー: "State lock" エラー

**原因**: 別の Terraform プロセスが State をロックしている

**解決策**:

```bash
# DynamoDBのLockを確認
aws dynamodb scan --table-name terraform-state-locks

# 必要に応じてLockを手動解除（注意して実行）
terraform force-unlock <LOCK_ID>
```

### CloudFront で 403 エラーが返る

**原因**: S3 バケットにファイルがアップロードされていない

**解決策**:

```bash
# S3バケットの内容を確認
BUCKET_NAME=$(terraform output -raw s3_bucket_id)
aws s3 ls s3://$BUCKET_NAME/

# ファイルがない場合は、フロントエンドをビルド・デプロイ
cd frontend
npm run build
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete
```

### Lambda 関数のエラー

**原因**: Lambda 関数のコードにエラーがある、または環境変数が正しく設定されていない

**解決策**:

```bash
# Lambda関数のログを確認
LAMBDA_NAME=$(terraform output -raw lambda_function_name)
aws logs tail /aws/lambda/$LAMBDA_NAME --follow

# Lambda関数の環境変数を確認
aws lambda get-function-configuration --function-name $LAMBDA_NAME
```

### API Gateway で 401 エラーが返る

**原因**: Cognito 認証が必要なエンドポイントに認証トークンなしでアクセスしている

**解決策**:

これは正常な動作です。API エンドポイントは Cognito JWT 認証が必要です。フロントエンドアプリから認証付きでアクセスしてください。

### Cloudflare DNS レコードが作成されない

**原因**: `enable_cloudflare_dns = false` または Cloudflare の認証情報が正しくない

**解決策**:

1. `terraform.tfvars` で `enable_cloudflare_dns = true` を設定
2. `cloudflare_api_token` と `cloudflare_zone_id` を正しく設定
3. API トークンに必要な権限（Zone:DNS:Edit）があることを確認

詳細: [cloudflare-terraform-guide.md](cloudflare-terraform-guide.md)

## 次のステップ

1. **フロントエンドの開発**: `frontend/` ディレクトリで React アプリを開発
2. **Lambda 関数の開発**: `lambda-functions/api-handler.py` で API ロジックを実装
3. **CI/CD の設定**: [cicd-guide.md](cicd-guide.md) を参照
4. **設計ドキュメントの確認**:
   - [adr/](../adr/) - 設計決定の記録
   - [architecture.md](architecture.md) - アーキテクチャ設計書
5. **DNS 管理の自動化**: [cloudflare-terraform-guide.md](cloudflare-terraform-guide.md) - Cloudflare Terraform 導入ガイド

## 参考リンク

- [AWS 料金計算ツール](https://calculator.aws/)
- [AWS 無料利用枠](https://aws.amazon.com/jp/free/)
- [Terraform AWS Provider ドキュメント](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
