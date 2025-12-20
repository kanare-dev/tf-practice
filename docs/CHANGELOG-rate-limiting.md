# API Gatewayレート制限 - 変更サマリー

## 📝 実施した変更

### 1. モジュールの拡張

**ファイル**: `terraform/modules/api-gateway/`

#### `variables.tf`
- レート制限関連の変数を追加:
  - `enable_throttling`: レート制限の有効/無効
  - `throttle_burst_limit`: バースト時の最大リクエスト数（デフォルト: 100）
  - `throttle_rate_limit`: 1秒あたりの平均リクエスト数（デフォルト: 50）
  - `quota_limit`: 期間あたりの最大リクエスト数（デフォルト: 10,000）
  - `quota_period`: クォータ期間（デフォルト: DAY）

#### `main.tf`
- 以下のリソースを追加:
  - `aws_api_gateway_usage_plan`: レート制限とクォータ管理
  - `aws_api_gateway_api_key`: API Key（Usage Planに必要）
  - `aws_api_gateway_usage_plan_key`: Usage PlanとAPI Keyの関連付け

#### `outputs.tf`
- レート制限関連の出力を追加:
  - `usage_plan_id`: Usage Plan ID
  - `api_key_id`: API Key ID
  - `api_key_value`: API Key値（sensitive）

#### `README.md`
- モジュールの詳細なドキュメントを作成
- 使用例とトラブルシューティングを記載

### 2. Dev環境への適用

**ファイル**: `terraform/environments/dev/main.tf`

レート制限を有効化:
```hcl
enable_throttling     = true
throttle_burst_limit  = 100
throttle_rate_limit   = 50
quota_limit           = 10000
quota_period          = "DAY"
```

**ファイル**: `terraform/environments/dev/outputs.tf`

API Gateway関連の出力を追加:
- `api_gateway_url`
- `api_gateway_usage_plan_id`
- `api_key_value`
- `dynamodb_table_name`

### 3. ドキュメント

**ファイル**: `docs/rate-limiting-setup.md`

詳細な適用手順とトラブルシューティングガイドを作成

## 🚀 適用方法

### ステップ1: リポジトリのルートに移動

```bash
cd /Users/canale/Documents/tf-practice
```

### ステップ2: Dev環境ディレクトリに移動

```bash
cd terraform/environments/dev
```

### ステップ3: Terraformモジュールの再初期化

モジュールを変更したため、再初期化が必要です:

```bash
terraform init -upgrade
```

### ステップ4: 変更内容の確認

```bash
terraform plan
```

**期待される出力**:
```
Plan: 3 to add, 0 to change, 0 to destroy.

Terraform will perform the following actions:

  # module.api_gateway.aws_api_gateway_api_key.main[0] will be created
  + resource "aws_api_gateway_api_key" "main" {
      + enabled = true
      + name    = "note-api-gateway-dev-key"
      ...
    }

  # module.api_gateway.aws_api_gateway_usage_plan.main[0] will be created
  + resource "aws_api_gateway_usage_plan" "main" {
      + name = "note-api-gateway-dev-usage-plan"
      
      + quota_settings {
          + limit  = 10000
          + period = "DAY"
        }
      
      + throttle_settings {
          + burst_limit = 100
          + rate_limit  = 50
        }
      ...
    }

  # module.api_gateway.aws_api_gateway_usage_plan_key.main[0] will be created
  + resource "aws_api_gateway_usage_plan_key" "main" {
      ...
    }
```

### ステップ5: 変更の適用

```bash
terraform apply
```

確認プロンプトが表示されたら、内容を確認して `yes` と入力

### ステップ6: 結果の確認

```bash
# すべての出力を表示
terraform output

# API Keyを表示（必要な場合）
terraform output -raw api_key_value
```

## 📊 設定値の詳細

### レート制限の設定

| 設定項目 | 値 | 説明 |
|---------|-----|------|
| バースト上限 | 100 req | 短時間に許可される最大リクエスト数 |
| レート制限 | 50 req/sec | 1秒あたりの平均リクエスト数 |
| 日次クォータ | 10,000 req/day | 1日あたりの最大リクエスト数 |

### 想定されるコスト（10,000 req/日の場合）

- **API Gateway**: 約 $1.05/月
- **Lambda**: 約 $6/月
- **DynamoDB**: 約 $30-60/月
- **合計**: 約 $37-67/月

**レート制限なしの場合**: 無制限 → 潜在的に $100-1000/月以上

## 🧪 動作確認

### 1. 通常のリクエスト

```bash
curl https://api.note-app.kanare.dev/notes
```

**期待される結果**: 200 OK

### 2. レート制限のテスト

```bash
# 連続100リクエスト
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://api.note-app.kanare.dev/notes
done
```

**期待される結果**: 
- 最初: 200（成功）
- レート制限到達後: 429（Too Many Requests）

### 3. CloudWatchで確認

AWS Console → API Gateway → note-api-gateway-dev → Monitoring

確認項目:
- 4XX Errors（429含む）
- Request Count
- Latency

## ⚙️ カスタマイズ

設定を変更したい場合は、`terraform/environments/dev/main.tf` を編集:

```hcl
module "api_gateway" {
  # ...
  
  # より緩い設定（開発用）
  throttle_burst_limit  = 200
  throttle_rate_limit   = 100
  quota_limit           = 50000
  
  # または、より厳しい設定（本番用）
  throttle_burst_limit  = 50
  throttle_rate_limit   = 20
  quota_limit           = 5000
}
```

変更後、再度 `terraform apply` を実行

## 🔒 セキュリティ効果

### 追加された保護

✅ **DoS攻撃からの保護**
- 1秒あたり50リクエストに制限
- バースト時でも100リクエストまで

✅ **コスト爆発の防止**
- 1日10,000リクエストに制限
- 予測可能なコスト管理

✅ **異常なトラフィックの検出**
- 429エラーで異常アクセスを検知可能

### まだ対応が必要な項目

⚠️ **認証がない**
- 現在: `authorization_type = "NONE"`
- 推奨: Cognito認証の実装

⚠️ **ユーザー識別ができない**
- 誰がリクエストしているか不明
- データの所有権が不明確

## 📚 関連ドキュメント

- [API Gatewayモジュール README](../terraform/modules/api-gateway/README.md)
- [レート制限セットアップガイド](./rate-limiting-setup.md)
- [プロジェクト評価ドキュメント](./project-evaluation-20251220.md)

## 🎯 次のステップ

### 優先度: 高

1. **Cognito認証の実装**
   - より安全なAPI保護
   - ユーザーごとの制限が可能

2. **CloudWatch Alarmsの設定**
   - 異常なトラフィックを自動検知
   - メール/SNS通知

### 優先度: 中

3. **Lambda関数のDynamoDB実装**
   - 実際のデータ保存
   - エラーハンドリング

4. **テストの追加**
   - レート制限のテスト
   - API統合テスト

## ❓ FAQ

**Q: API Keyは必要ですか？**
A: 現在の設定では、API Keyなしでアクセス可能です。Usage Planはレート制限のみに使用されています。

**Q: レート制限を無効化できますか？**
A: はい、`enable_throttling = false` に設定して `terraform apply` を実行してください。

**Q: フロントエンドの変更は必要ですか？**
A: いいえ、現時点では不要です。レート制限はバックエンドで透過的に動作します。

**Q: 429エラーが出た場合どうすれば？**
A: 正常な動作です。クライアント側でリトライロジックを実装するか、レート制限を緩和してください。

---

**作成日**: 2025年12月20日
**最終更新**: 2025年12月20日

