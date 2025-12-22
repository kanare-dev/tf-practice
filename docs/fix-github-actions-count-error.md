# GitHub Actions Count Error 修正ガイド

## 問題の概要

ローカルでは`terraform plan`が成功するのに、GitHub Actions では以下のエラーが発生していました：

```
Error: Invalid count argument

  on ../../modules/api-gateway/main.tf line 24, in resource "aws_api_gateway_authorizer" "cognito":
  24:   count = var.cognito_user_pool_arn != null ? 1 : 0

The "count" value depends on resource attributes that cannot be determined
until apply, so Terraform cannot predict how many instances will be
created.
```

## 原因

### 技術的な原因

`count`の条件式が、他のリソースから計算される値（computed value）に依存していたことが原因です：

```hcl
# 問題のあるコード
count = var.cognito_user_pool_arn != null ? 1 : 0
```

この`var.cognito_user_pool_arn`は以下のように設定されていました：

```hcl
# environments/dev/main.tf
module "api_gateway" {
  cognito_user_pool_arn = module.cognito.user_pool_arn  # 他のリソースの属性
}
```

### なぜローカルでは動作していたのか

- **ローカル環境**: 既存の Terraform state ファイルがあり、`module.cognito.user_pool_arn`の値が既知だった
- **GitHub Actions**: 新しい環境または初回実行時、state ファイルがないため値が未確定だった

Terraform は`count`を評価する際、plan 段階で値を決定する必要があります。しかし、`module.cognito.user_pool_arn`は`apply`を実行しないと確定しないため、エラーが発生していました。

## 解決策

### 変更内容

`count`を計算値ではなく、明示的なブール変数で制御するように変更しました。

#### 1. 新しい変数の追加

```hcl
# modules/api-gateway/variables.tf
variable "enable_cognito_authorizer" {
  description = "Cognito Authorizerを作成するか"
  type        = bool
  default     = false
}
```

#### 2. count の条件式を変更

```hcl
# modules/api-gateway/main.tf（変更前）
resource "aws_api_gateway_authorizer" "cognito" {
  count = var.cognito_user_pool_arn != null ? 1 : 0
  # ...
}

# modules/api-gateway/main.tf（変更後）
resource "aws_api_gateway_authorizer" "cognito" {
  count = var.enable_cognito_authorizer ? 1 : 0
  # ...
}
```

#### 3. authorizer_id の参照も更新

```hcl
# 変更前
authorizer_id = var.authorization_type == "COGNITO_USER_POOLS" && var.cognito_user_pool_arn != null ?
                aws_api_gateway_authorizer.cognito[0].id : var.authorizer_id

# 変更後
authorizer_id = var.authorization_type == "COGNITO_USER_POOLS" && var.enable_cognito_authorizer ?
                aws_api_gateway_authorizer.cognito[0].id : var.authorizer_id
```

#### 4. モジュール呼び出し側の更新

```hcl
# environments/dev/main.tf
module "api_gateway" {
  # ...
  authorization_type        = "COGNITO_USER_POOLS"
  enable_cognito_authorizer = true                    # 明示的に指定
  cognito_user_pool_arn     = module.cognito.user_pool_arn
  # ...
}
```

## 変更されたファイル

1. `terraform/modules/api-gateway/variables.tf`

   - `enable_cognito_authorizer`変数を追加

2. `terraform/modules/api-gateway/main.tf`

   - `aws_api_gateway_authorizer.cognito`の`count`を変更
   - `authorizer_id`の条件式を変更（2 箇所）

3. `terraform/environments/dev/main.tf`

   - `enable_cognito_authorizer = true`を追加

4. `terraform/modules/api-gateway/README.md`
   - 使用例と Inputs テーブルを更新

## 動作確認

### ローカルでの確認

```bash
cd terraform/environments/dev
terraform validate
```

**結果**: ✅ Success! The configuration is valid.

### GitHub Actions での確認

次回の push/PR で、以下のジョブが成功するはずです：

1. `terraform-fmt` - フォーマットチェック
2. `terraform-validate` - 構文検証
3. `terraform-plan` - プラン生成（エラーなし）

## 他の環境への適用

もし他の環境（prod, staging など）でも Cognito 認証を使用している場合、同様の変更が必要です：

```hcl
# terraform/environments/prod/main.tf など
module "api_gateway" {
  # ...
  authorization_type        = "COGNITO_USER_POOLS"
  enable_cognito_authorizer = true  # この行を追加
  cognito_user_pool_arn     = module.cognito.user_pool_arn
  # ...
}
```

## ベストプラクティス

### count 使用時の注意点

`count`や`for_each`を使用する際は、以下のルールに従ってください：

❌ **避けるべき**: 計算値（computed values）への依存

```hcl
count = var.some_arn != null ? 1 : 0  # some_arnが他のリソースから来る場合
```

✅ **推奨**: 明示的なブール変数

```hcl
count = var.enable_feature ? 1 : 0
```

### なぜこのアプローチが良いのか

1. **予測可能**: `terraform plan`時に必ず値が確定している
2. **明示的**: 設定を見ただけで何が作成されるか分かる
3. **ポータブル**: state の有無に関わらず動作する
4. **CI/CD 対応**: GitHub Actions などの自動化環境でも確実に動作

## 参考資料

- [Terraform: The "count" value depends on resource attributes](https://developer.hashicorp.com/terraform/language/meta-arguments/count#the-count-object)
- [Terraform Best Practices: Using count and for_each](https://www.terraform-best-practices.com/code-structure)

## トラブルシューティング

### もし別のモジュールで同様のエラーが出た場合

1. エラーメッセージから`count`が使われている場所を特定
2. `count`の条件式を確認
3. 計算値に依存していないか確認
4. 必要に応じて`enable_xxx`のようなブール変数を追加

### 既存のリソースへの影響

この変更は既存のリソースに影響を与えません：

- `enable_cognito_authorizer = true`を指定すれば、従来通り Authorizer が作成されます
- Terraform state は変わらず、既存リソースは維持されます

---

**作成日**: 2025-12-22  
**対象バージョン**: Terraform 1.5.0+  
**検証環境**: dev 環境（terraform/environments/dev）
