# GitHub Actions - Terraform CI/CD設定ガイド

このガイドでは、GitHub ActionsでTerraform CI/CDを実行するための設定方法を説明します。

## 📋 必要なGitHub Secrets

以下のSecretsをGitHubリポジトリに設定する必要があります。

### 必須（AWS）

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `AWS_ACCESS_KEY_ID` | AWSアクセスキーID | IAMユーザーから取得 |
| `AWS_SECRET_ACCESS_KEY` | AWSシークレットアクセスキー | IAMユーザーから取得 |

### オプション（Cloudflare DNS自動管理）

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `ENABLE_CLOUDFLARE_DNS` | Cloudflare DNS管理を有効化（`true`/`false`） | - |
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン | [Cloudflare導入ガイド](cloudflare-terraform-guide.md)参照 |
| `CLOUDFLARE_ZONE_ID` | Cloudflare Zone ID | [Cloudflare導入ガイド](cloudflare-terraform-guide.md)参照 |

---

## 🔧 GitHub Secretsの設定方法

### ステップ1: リポジトリのSettings画面を開く

1. GitHubリポジトリにアクセス
2. **Settings**タブをクリック
3. 左メニューの**Secrets and variables** → **Actions**をクリック

### ステップ2: Secretsを追加

1. **New repository secret**ボタンをクリック
2. 以下のSecretsを1つずつ追加：

#### AWS認証情報（必須）

```
Name: AWS_ACCESS_KEY_ID
Secret: AKIA...（あなたのアクセスキーID）
```

```
Name: AWS_SECRET_ACCESS_KEY
Secret: （あなたのシークレットアクセスキー）
```

#### Cloudflare設定（オプション）

Cloudflare DNS自動管理を使用する場合のみ設定：

```
Name: ENABLE_CLOUDFLARE_DNS
Secret: true
```

```
Name: CLOUDFLARE_API_TOKEN
Secret: y_abcdefghijklmnopqrstuvwxyz1234567890...
```

```
Name: CLOUDFLARE_ZONE_ID
Secret: 1234567890abcdef1234567890abcdef
```

### ステップ3: 確認

Secretsが正しく設定されたか確認：

- **Settings** → **Secrets and variables** → **Actions**
- 設定したSecretsが表示される（値は隠される）

---

## 🚀 ワークフローの動作

### トリガー条件

以下の場合にワークフローが実行されます：

1. **Pull Request**: `main`または`develop`ブランチへのPR
2. **Push**: `main`または`develop`ブランチへの直接push
3. **対象ファイル**: 
   - `terraform/environments/**`
   - `terraform/modules/**`
   - `.github/workflows/**`

### ジョブの流れ

```
1. terraform-fmt
   ├─ Terraformコードのフォーマットチェック
   └─ terraform fmt -check

2. terraform-validate
   ├─ Terraform設定の構文チェック
   └─ terraform validate

3. terraform-plan（PRまたはmainブランチのみ）
   ├─ AWS認証
   ├─ Cloudflare環境変数の設定
   ├─ terraform plan
   └─ PR時はコメントに結果を投稿
```

---

## 🔒 セキュリティのベストプラクティス

### 1. IAMユーザーの権限

GitHub Actions用のIAMユーザーには、**必要最小限の権限**のみを付与してください。

#### 推奨ポリシー例

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "cloudfront:*",
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "acm:*",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PassRole"
      ],
      "Resource": "*"
    }
  ]
}
```

または、開発環境であれば：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "ap-northeast-1"
        }
      }
    }
  ]
}
```

### 2. Secretsの管理

✅ **やるべきこと**:
- Secretsは必ずGitHub Secretsで管理
- 定期的にトークンをローテーション（3-6ヶ月ごと）
- 使用しないSecretsは削除

❌ **やってはいけないこと**:
- コードにAPIトークンをハードコード
- PRコメントに機密情報を表示
- 公開リポジトリでSecretsを使用（Forkから悪用される可能性）

### 3. Cloudflare APIトークン

最小権限のトークンを作成してください：

**権限**:
- Zone / DNS / Edit
- Zone / Zone / Read

**対象Zone**:
- 特定のZone（kanare.dev）のみ

詳細: [Cloudflare Terraform導入ガイド](cloudflare-terraform-guide.md)

---

## 🧪 ローカルとCI/CDの設定の違い

### ローカル開発

```hcl
# terraform.tfvars（.gitignoreで除外）
aws_region = "ap-northeast-1"
enable_cloudflare_dns = true
cloudflare_api_token  = "your-token"
cloudflare_zone_id    = "your-zone-id"
```

### GitHub Actions

```yaml
# .github/workflows/terraform.yml
env:
  TF_VAR_enable_cloudflare_dns: ${{ secrets.ENABLE_CLOUDFLARE_DNS }}
  TF_VAR_cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  TF_VAR_cloudflare_zone_id: ${{ secrets.CLOUDFLARE_ZONE_ID }}
```

Terraformは以下の優先順位で変数を読み込みます：

1. コマンドラインフラグ（`-var`）
2. **環境変数（`TF_VAR_xxx`）** ← GitHub Actionsで使用
3. `terraform.tfvars`ファイル ← ローカル開発で使用
4. `terraform.tfvars.json`ファイル
5. `*.auto.tfvars`ファイル
6. 変数定義のデフォルト値

---

## 🐛 トラブルシューティング

### エラー: "Error: No value for required variable"

**原因**: GitHub Secretsが設定されていない、または変数名が間違っている

**対処法**:
1. GitHub Settings → Secrets and variablesで設定を確認
2. Secret名が正しいか確認（大文字小文字を区別）
3. ワークフローファイルの環境変数名を確認

### エラー: "Error: Insufficient access rights"

**原因**: AWS IAMユーザーの権限が不足

**対処法**:
1. IAMユーザーのポリシーを確認
2. 必要な権限を追加（S3, CloudFront, Lambda, API Gateway, DynamoDB, ACM）

### エラー: "Error: authentication failure" (Cloudflare)

**原因**: Cloudflare APIトークンが無効または権限不足

**対処法**:
1. Cloudflare APIトークンが有効か確認
2. 権限（Zone DNS Edit）が付与されているか確認
3. 対象Zone（kanare.dev）が指定されているか確認

### ワークフローが実行されない

**原因**: トリガー条件に合致していない

**対処法**:
1. 変更したファイルのパスを確認
2. ブランチ名を確認（main/develop）
3. `.github/workflows/terraform.yml`のpathsを確認

---

## 📊 ワークフロー実行例

### 成功時

```
✓ terraform-fmt (10s)
✓ terraform-validate (15s)
✓ terraform-plan (45s)
  ├─ Configure AWS credentials
  ├─ Terraform Init
  ├─ Terraform Plan
  └─ Comment PR (PR時のみ)
```

### 失敗時

```
✗ terraform-fmt (10s)
  └─ Format check failed: main.tf needs formatting
```

または

```
✓ terraform-fmt (10s)
✓ terraform-validate (15s)
✗ terraform-plan (30s)
  └─ Error: No value for required variable "cloudflare_api_token"
```

---

## 🔄 Cloudflare DNS管理の切り替え

### DNS自動管理を有効にする

GitHub Secretsに以下を設定：

```
ENABLE_CLOUDFLARE_DNS: true
CLOUDFLARE_API_TOKEN: your-token
CLOUDFLARE_ZONE_ID: your-zone-id
```

### DNS手動管理に戻す

```
ENABLE_CLOUDFLARE_DNS: false
```

または、`ENABLE_CLOUDFLARE_DNS`を削除（デフォルトは`false`）

---

## 📚 関連ドキュメント

- [Cloudflare Terraform導入ガイド](cloudflare-terraform-guide.md) - APIトークンの取得方法
- [デプロイガイド](deployment-guide.md) - 初回デプロイの手順
- [再構築ガイド](rebuild-guide.md) - インフラ再構築の手順
- [GitHub Actions公式ドキュメント](https://docs.github.com/actions)
- [Terraform環境変数](https://developer.hashicorp.com/terraform/cli/config/environment-variables)

---

## ✅ チェックリスト

セットアップが完了したか確認：

- [ ] `AWS_ACCESS_KEY_ID`をGitHub Secretsに設定した
- [ ] `AWS_SECRET_ACCESS_KEY`をGitHub Secretsに設定した
- [ ] Cloudflare DNS自動管理を使用する場合、以下も設定した：
  - [ ] `ENABLE_CLOUDFLARE_DNS`
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ZONE_ID`
- [ ] IAMユーザーに適切な権限を付与した
- [ ] ローカルでテストし、正常に動作することを確認した
- [ ] PRを作成してワークフローが実行されることを確認した

---

**更新日**: 2025年12月21日  
**バージョン**: 1.0











