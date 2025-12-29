# AWS デプロイガイド

このガイドでは、このリポジトリをあなたの AWS アカウントにデプロイする手順を説明します。

> **📌 重要**: 2025年12月より、本プロジェクトはDev/Prod環境を完全分離しています。
> - **開発環境**: dev.note-app.kanare.dev
> - **本番環境**: note-app.kanare.dev
>
> 詳細な手順は [terraform/MIGRATION_GUIDE.md](../terraform/MIGRATION_GUIDE.md) を参照してください。
>
> このガイドは基本的な手順を説明していますが、**環境分離後の最新の構成については上記ガイドを優先してください。**

## 目次

1. [前提条件](#前提条件)
2. [AWS アカウントの準備](#awsアカウントの準備)
3. [AWS 認証情報の設定](#aws認証情報の設定)
4. [デプロイ手順](#デプロイ手順)
5. [AWS 料金について](#aws料金について)
6. [リソースの確認](#リソースの確認)
7. [クリーンアップ（リソースの削除）](#クリーンアップリソースの削除)

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

### ステップ 1: 変数ファイルの作成

```bash
cd environments/dev
cp terraform.tfvars.example terraform.tfvars
```

必要に応じて `terraform.tfvars` を編集：

```hcl
aws_region  = "ap-northeast-1"  # 使用するAWSリージョン
project_name = "tf-practice"    # プロジェクト名（リソース名のプレフィックス）
```

### ステップ 2: Terraform の初期化

```bash
terraform init
```

このコマンドで：

- Terraform プロバイダー（AWS）がダウンロードされます
- モジュールが初期化されます

### ステップ 3: 実行計画の確認

```bash
terraform plan
```

このコマンドで：

- 作成されるリソースの一覧が表示されます
- 変更内容を確認できます
- エラーがあればここで検出されます

**重要**: この段階ではまだリソースは作成されません。

### ステップ 4: インフラのデプロイ

```bash
terraform apply
```

確認を求められたら `yes` を入力します。

**自動承認する場合**:

```bash
terraform apply -auto-approve
```

デプロイには数分かかることがあります。

### ステップ 5: デプロイ結果の確認

```bash
terraform output
```

主な出力：

- `api_gateway_url`: API Gateway の URL
- `s3_website_endpoint`: S3 静的 Web サイトのエンドポイント
- `cognito_user_pool_id`: Cognito User Pool ID

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

#### 5. **Amazon Cognito**

- **無料利用枠**: 月間 5 万 MAU（Monthly Active Users）
- **超過分**: $0.0055/MAU
- **見積もり**: 開発・テスト用途であれば無料枠内で収まる可能性が高い

### 料金見積もり（開発環境）

**軽量な使用（開発・学習用途）の場合**:

- 月間リクエスト数: 1,000-10,000 回程度
- データ量: 数 MB 程度
- **予想月額料金: $1-5 程度**

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
   - このプロジェクトのリソースには `Project = "tf-practice"` タグが付与されます
   - タグでフィルタリングしてコストを確認できます

### コスト削減のヒント

1. **使用しないリソースは削除**: `terraform destroy`でリソースを削除
2. **開発環境は必要時のみ起動**: 使用しない時間はリソースを削除
3. **DynamoDB のオンデマンドモード**: 使用量が少ない場合はオンデマンドモードがお得
4. **S3 のライフサイクルポリシー**: 古いファイルを自動削除

## リソースの確認

### AWS マネジメントコンソールで確認

以下のサービスでリソースが作成されていることを確認できます：

1. **S3**: バケットが 2 つ作成されます（Web アプリ用、Lambda デプロイ用）
2. **DynamoDB**: テーブルが 1 つ作成されます
3. **Lambda**: 関数が 1 つ作成されます
4. **API Gateway**: REST API が 1 つ作成されます
5. **Cognito**: User Pool が 1 つ作成されます

### コマンドで確認

```bash
# API GatewayのURLを取得してテスト
API_URL=$(terraform output -raw api_gateway_url)
curl $API_URL/

# S3バケットの確認
aws s3 ls | grep tf-practice

# DynamoDBテーブルの確認
aws dynamodb list-tables
```

## クリーンアップ（リソースの削除）

**重要**: リソースを削除しないと、継続的に料金が発生します。

**注意**: リソースを削除した後、再構築する場合は [再構築ガイド](rebuild-guide.md) を参照してください。

### すべてのリソースを削除

```bash
cd environments/dev
terraform destroy
```

確認を求められたら `yes` を入力します。

**自動承認する場合**:

```bash
terraform destroy -auto-approve
```

### 削除後の確認

```bash
# リソースが削除されたことを確認
aws s3 ls | grep tf-practice  # 何も表示されないはず
aws dynamodb list-tables      # テーブルが表示されないはず
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

1. `terraform.tfvars` の `project_name` を変更
2. または、既存のバケットを削除

### エラー: "Region not available"

**原因**: 指定したリージョンが利用できない

**解決策**:

1. `terraform.tfvars` の `aws_region` を変更
2. 利用可能なリージョン: `ap-northeast-1`（東京）、`us-east-1`（バージニア）など

## 次のステップ

1. [アーキテクチャ設計書](architecture.md)を読んで設計を理解
2. [ADR](../adr/)を読んで設計決定を確認
3. モジュールをカスタマイズして機能を追加
4. CI/CD パイプラインを設定: [CI/CD ガイド](cicd-guide.md)
5. インフラ再構築の方法を確認: [再構築ガイド](rebuild-guide.md)
6. DNS管理を自動化する: [Cloudflare Terraform導入ガイド](cloudflare-terraform-guide.md)

## 参考リンク

- [AWS 料金計算ツール](https://calculator.aws/)
- [AWS 無料利用枠](https://aws.amazon.com/jp/free/)
- [Terraform AWS Provider ドキュメント](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
