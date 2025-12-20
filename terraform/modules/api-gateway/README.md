# API Gateway モジュール

このモジュールは、AWS API GatewayとLambda関数を統合し、REST APIを構築します。
レート制限機能を含む、本番環境に対応した設定が可能です。

## 機能

- REST API の作成
- Lambda統合（プロキシ統合）
- Cognito認証対応
- レート制限（スロットリング）
- リクエストクォータ管理
- CloudWatch メトリクス・ログ
- カスタムドメイン対応（別途設定）

## 使用例

### 基本的な使用（認証なし、レート制限なし）

```hcl
module "api_gateway" {
  source               = "../../modules/api-gateway"
  api_name             = "my-api"
  api_description      = "My REST API"
  lambda_invoke_arn    = module.lambda.function_invoke_arn
  lambda_function_name = module.lambda.function_name
  authorization_type   = "NONE"
  
  tags = {
    Environment = "dev"
  }
}
```

### レート制限を有効化

```hcl
module "api_gateway" {
  source               = "../../modules/api-gateway"
  api_name             = "my-api"
  lambda_invoke_arn    = module.lambda.function_invoke_arn
  lambda_function_name = module.lambda.function_name
  
  # レート制限を有効化
  enable_throttling     = true
  throttle_burst_limit  = 100   # バースト時の最大リクエスト数
  throttle_rate_limit   = 50    # 1秒あたりの平均リクエスト数
  quota_limit           = 10000 # 期間あたりの最大リクエスト数
  quota_period          = "DAY" # DAY, WEEK, MONTH
  
  tags = {
    Environment = "dev"
  }
}
```

### Cognito認証を有効化

```hcl
module "api_gateway" {
  source               = "../../modules/api-gateway"
  api_name             = "my-api"
  lambda_invoke_arn    = module.lambda.function_invoke_arn
  lambda_function_name = module.lambda.function_name
  
  # Cognito認証
  authorization_type = "COGNITO_USER_POOLS"
  authorizer_id      = module.cognito.authorizer_id
  
  # レート制限
  enable_throttling = true
  
  tags = {
    Environment = "prod"
  }
}
```

## レート制限について

### スロットリング設定

- **burst_limit**: 短時間に許可される最大リクエスト数
  - デフォルト: 100
  - 推奨値（開発環境）: 50-100
  - 推奨値（本番環境）: 500-1000

- **rate_limit**: 1秒あたりの平均リクエスト数
  - デフォルト: 50 req/sec
  - 推奨値（開発環境）: 10-50 req/sec
  - 推奨値（本番環境）: 100-500 req/sec

### クォータ設定

- **quota_limit**: 期間あたりの最大リクエスト数
  - デフォルト: 10,000
  - 0で無制限（非推奨）
  
- **quota_period**: クォータ期間
  - `DAY`: 1日あたり
  - `WEEK`: 1週間あたり
  - `MONTH`: 1ヶ月あたり

### レート制限が有効な場合の動作

1. APIキーが自動生成される
2. Usage Planにより制限が適用される
3. 制限を超えた場合、`429 Too Many Requests` が返される
4. API Key は outputs から取得可能（sensitive）

```bash
# API Keyの取得方法
terraform output -raw api_key_value
```

## 料金への影響

### レート制限なしの場合

- 悪意あるリクエストで料金が急増する可能性
- Lambda実行回数に応じて課金
- DynamoDBアクセスに応じて課金

**想定リスク**: 無制限のリクエストで $100-1000/日 の可能性

### レート制限ありの場合

- リクエスト数が制限される
- 予測可能なコスト
- DoS攻撃からの保護

**想定コスト**（10,000 req/日の場合）:
- API Gateway: $0.035
- Lambda: $0.20
- DynamoDB: $1-2
- **合計**: 約 $2-3/日

## セキュリティ考慮事項

### レート制限のみ（`authorization_type = "NONE"`）

⚠️ **警告**: 誰でもAPIにアクセス可能

**リスク**:
- データの不正操作
- コスト増加
- サービス停止攻撃

**推奨**: 開発・テスト環境のみ使用

### Cognito認証 + レート制限（推奨）

✅ **推奨**: 本番環境での設定

**メリット**:
- 認証されたユーザーのみアクセス可能
- レート制限で異常なトラフィックを防止
- セキュアな運用

## トラブルシューティング

### 429 Too Many Requests エラー

**原因**: レート制限に達した

**対処法**:
1. `throttle_rate_limit` を増やす
2. `throttle_burst_limit` を増やす
3. クライアント側でリトライロジックを実装

### API Keyが必要なエラー

**原因**: レート制限有効時、API Keyが必要

**対処法**:
```bash
# API Keyを取得
terraform output -raw api_key_value

# リクエスト時にヘッダーに追加
curl -H "x-api-key: YOUR_API_KEY" https://api.example.com/notes
```

### レート制限を無効化したい

```hcl
module "api_gateway" {
  # ...
  enable_throttling = false  # レート制限を無効化
}
```

その後、`terraform apply` を実行

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| api_name | API Gateway名 | `string` | n/a | yes |
| api_description | API Gatewayの説明 | `string` | `""` | no |
| lambda_invoke_arn | Lambda関数の呼び出しARN | `string` | n/a | yes |
| lambda_function_name | Lambda関数名 | `string` | n/a | yes |
| authorization_type | 認証タイプ（NONE, COGNITO_USER_POOLS） | `string` | `"NONE"` | no |
| enable_throttling | レート制限を有効化 | `bool` | `false` | no |
| throttle_burst_limit | バースト時の最大リクエスト数 | `number` | `100` | no |
| throttle_rate_limit | 1秒あたりの平均リクエスト数 | `number` | `50` | no |
| quota_limit | 期間あたりの最大リクエスト数 | `number` | `10000` | no |
| quota_period | クォータ期間（DAY, WEEK, MONTH） | `string` | `"DAY"` | no |
| tags | リソースに付与するタグ | `map(string)` | `{}` | no |

## Outputs

| Name | Description |
|------|-------------|
| api_id | API Gateway ID |
| api_arn | API Gateway ARN |
| invoke_url | API Gatewayの呼び出しURL |
| execution_arn | API Gatewayの実行ARN |
| usage_plan_id | Usage Plan ID（レート制限有効時） |
| api_key_id | API Key ID（レート制限有効時） |
| api_key_value | API Key値（レート制限有効時、sensitive） |

## 参考リンク

- [API Gateway スロットリング](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html)
- [API Gateway Usage Plans](https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-usage-plans.html)
- [API Gateway 料金](https://aws.amazon.com/jp/api-gateway/pricing/)

