# API Gateway レート制限の適用手順

このガイドでは、既存の API Gateway にレート制限を追加する手順を説明します。

## 📋 変更内容

### 追加された機能

1. **スロットリング（レート制限）**
   - バースト時の最大リクエスト数: 100
   - 1 秒あたりの平均リクエスト数: 50
2. **リクエストクォータ**

   - 1 日あたりの最大リクエスト数: 10,000

3. **自動生成されるリソース**
   - Usage Plan
   - API Key

### セキュリティ効果

- ✅ DoS 攻撃からの保護
- ✅ 予測可能なコスト管理
- ✅ 異常なトラフィックの検出

## 🚀 適用手順

### ステップ 1: 変更内容の確認

現在のディレクトリを確認：

```bash
pwd
# /Users/canale/Documents/tf-practice
```

### ステップ 2: Terraform の初期化（必要な場合）

```bash
cd terraform/environments/dev
terraform init
```

### ステップ 3: 変更内容のプレビュー

```bash
terraform plan
```

**確認ポイント**:

```
Plan: 3 to add, 0 to change, 0 to destroy.

# 以下のリソースが追加される:
+ aws_api_gateway_usage_plan.main[0]
+ aws_api_gateway_api_key.main[0]
+ aws_api_gateway_usage_plan_key.main[0]
```

### ステップ 4: 変更の適用

```bash
terraform apply
```

確認メッセージが表示されたら `yes` と入力します。

**適用時間**: 約 1-2 分

### ステップ 5: 設定の確認

```bash
# API Keyを確認（フロントエンドで使用する場合）
terraform output -raw api_key_value

# すべての出力を確認
terraform output
```

**出力例**:

```
api_gateway_url = "https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/dev"
api_gateway_usage_plan_id = "xxxxxx"
api_key_value = <sensitive>
```

## 🧪 動作確認

### 1. 通常のリクエスト（制限内）

```bash
# APIエンドポイントを変数に設定
API_URL="https://api.note-app.kanare.dev"

# 通常のリクエスト（成功するはず）
curl $API_URL/notes
```

**期待される結果**: 200 OK

### 2. レート制限のテスト（大量リクエスト）

```bash
# 連続で100リクエスト送信
for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code}\n" $API_URL/notes
  sleep 0.01
done
```

**期待される結果**:

- 最初の数十リクエスト: 200
- レート制限到達後: 429 (Too Many Requests)

### 3. 1 日のクォータ確認

AWS Console で確認:

1. API Gateway コンソールを開く
2. 「Usage Plans」をクリック
3. 「note-api-gateway-dev-usage-plan」を選択
4. 現在の使用状況を確認

## ⚙️ 設定のカスタマイズ

### レート制限を緩和する場合

`terraform/environments/dev/main.tf` を編集：

```hcl
module "api_gateway" {
  # ...

  # より緩い設定
  throttle_burst_limit  = 200   # 100 → 200に変更
  throttle_rate_limit   = 100   # 50 → 100に変更
  quota_limit           = 50000 # 10000 → 50000に変更
}
```

その後、再度 `terraform apply`

### レート制限を厳しくする場合

```hcl
module "api_gateway" {
  # ...

  # より厳しい設定
  throttle_burst_limit  = 50    # 100 → 50に変更
  throttle_rate_limit   = 20    # 50 → 20に変更
  quota_limit           = 5000  # 10000 → 5000に変更
}
```

### レート制限を一時的に無効化する場合

```hcl
module "api_gateway" {
  # ...
  enable_throttling = false  # true → false に変更
}
```

⚠️ **注意**: 無効化すると保護がなくなります

## 🔍 監視とアラート

### CloudWatch で監視すべきメトリクス

1. **API Gateway コンソール**で確認:

   - `4XXError`: レート制限エラー（429 含む）の回数
   - `5XXError`: サーバーエラーの回数
   - `Count`: 総リクエスト数

2. **CloudWatch ダッシュボード**を作成（推奨）:

```bash
# AWS CLIでメトリクスを確認
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=note-api-gateway-dev \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

### アラートの設定（推奨）

今後、以下のアラートを設定することを推奨：

1. **429 エラーが多発した場合**

   - レート制限が厳しすぎる可能性
   - 異常なトラフィックの可能性

2. **クォータの 80%到達時**

   - 制限の見直しが必要

3. **予算アラート**
   - AWS Budgets で$10/月を設定

## 📊 コストへの影響

### レート制限追加によるコスト変化

- **Usage Plan**: 無料
- **API Key**: 無料
- **リクエスト制限による削減**: 潜在的に大幅なコスト削減

### 想定コスト（10,000 req/日の場合）

| サービス    | 月間コスト          |
| ----------- | ------------------- |
| API Gateway | $1.05 (300,000 req) |
| Lambda      | $6 (300,000 実行)   |
| DynamoDB    | $30-60 (read/write) |
| **合計**    | **$37-67/月**       |

**レート制限なしの場合**: 無制限の可能性 → $100-1000/月

## ❗ トラブルシューティング

### エラー: "Error creating API Gateway Usage Plan"

**原因**: API Gateway のデプロイメントが完了していない

**対処法**:

```bash
terraform apply -refresh=true
```

### エラー: "429 Too Many Requests" が頻発

**原因**: レート制限が厳しすぎる

**対処法**:

1. 使用パターンを確認
2. `throttle_rate_limit` を増やす
3. フロントエンドにリトライロジックを追加

### フロントエンドが API を呼び出せない

**原因**: CORS 設定または API Key 未設定

**対処法**:
現在の Lambda 関数は API Key を要求しません（Usage Plan は制限のみ）。
CORS 設定を確認してください。

## 🔄 ロールバック手順

問題が発生した場合、レート制限を無効化：

```bash
cd terraform/environments/dev

# main.tf を編集
# enable_throttling = false に変更

terraform apply
```

または、以前の状態に戻す：

```bash
terraform state list
terraform show

# 必要に応じて
git checkout terraform/environments/dev/main.tf
terraform apply
```

## ✅ 完了チェックリスト

- [ ] `terraform plan` で変更内容を確認した
- [ ] `terraform apply` で変更を適用した
- [ ] API Key を確認した（必要な場合）
- [ ] 通常のリクエストが成功することを確認した
- [ ] レート制限が機能していることを確認した
- [ ] CloudWatch で監視設定を確認した
- [ ] コストが予算内であることを確認した

## 📚 次のステップ

1. **Cognito 認証の追加** (優先度: 高)

   - より安全な API 保護
   - ユーザーごとのレート制限

2. **CloudWatch Alarms の設定** (優先度: 中)

   - 異常なトラフィックの検知
   - 自動通知

3. **WAF の導入** (優先度: 低)
   - より高度な DDoS 対策
   - IP ベースのブロック

## 📞 サポート

問題が発生した場合:

1. エラーメッセージを確認
2. CloudWatch Logs を確認
3. このドキュメントのトラブルシューティングセクションを参照
4. 必要に応じてロールバック

---

**更新日**: 2025 年 12 月 20 日  
**バージョン**: 1.0
