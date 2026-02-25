# Cloudflare Terraform Provider 導入ガイド

このガイドでは、Cloudflare Terraform Providerを使用してDNSレコードを自動管理する方法を説明します。

## 📋 目次

1. [Cloudflare Terraform Providerとは](#cloudflare-terraform-providerとは)
2. [メリットとデメリット](#メリットとデメリット)
3. [前提条件](#前提条件)
4. [セットアップ手順](#セットアップ手順)
5. [使用方法](#使用方法)
6. [トラブルシューティング](#トラブルシューティング)

---

## Cloudflare Terraform Providerとは

Cloudflare Terraform Providerは、CloudflareのDNSレコードやその他の設定をTerraformコードで管理できるようにするプラグインです。

### 何ができるのか

- **DNSレコードの自動作成・更新・削除**
  - ACM証明書検証用のCNAMEレコード
  - CloudFront向けのCNAMEレコード
  - API Gateway向けのCNAMEレコード
- **インフラのコード化**
  - DNSレコードもGitで管理
  - レビュー可能、履歴管理可能
- **完全自動復元**
  - `terraform destroy` → `terraform apply` だけで完全復元

---

## メリットとデメリット

### ✅ メリット

1. **完全自動化**
   - 手動でのDNS設定が不要
   - `terraform apply` 一発で全て完了

2. **人為的ミスの防止**
   - タイポや設定漏れがない
   - コードレビューで事前にチェック可能

3. **再現性**
   - 同じコードから同じ環境を構築可能
   - 複数環境（dev/staging/prod）の管理が容易

4. **バージョン管理**
   - DNSレコードの変更履歴をGitで追跡
   - 問題があれば過去の状態に戻せる

5. **ドキュメント化**
   - Terraformコード自体がドキュメント
   - 「何を設定したか」が明確

### ⚠️ デメリット

1. **追加の学習コスト**
   - Cloudflare Providerの使い方を学ぶ必要がある
   - APIトークンの管理が必要

2. **APIトークンの管理**
   - セキュリティリスクが増える（適切に管理すれば問題なし）
   - トークンの漏洩に注意が必要

3. **Cloudflareアカウント必須**
   - 他のDNSプロバイダを使っている場合は使えない

4. **初期設定の手間**
   - 最初の設定に30分程度かかる

---

## 前提条件

### 必要なもの

- Cloudflareアカウント（無料プランでOK）
- `kanare.dev` ドメインがCloudflareで管理されていること
- Terraform >= 1.0
- AWS認証情報（既存の設定）

### 確認方法

```bash
# Cloudflareダッシュボードにログイン
# https://dash.cloudflare.com/

# ドメイン一覧に kanare.dev が表示されればOK
```

---

## セットアップ手順

### ステップ 1: Cloudflare APIトークンの作成

#### 1.1 Cloudflareダッシュボードにアクセス

https://dash.cloudflare.com/ にログイン

#### 1.2 APIトークンページに移動

1. 右上のプロフィールアイコンをクリック
2. **My Profile** を選択
3. 左メニューの **API Tokens** をクリック
4. **Create Token** ボタンをクリック

#### 1.3 テンプレートから作成

1. **Edit zone DNS** テンプレートの **Use template** をクリック

または、カスタムトークンを作成する場合：

1. **Create Custom Token** をクリック
2. Token name: `terraform-dns-management`
3. Permissions:
   - **Zone** → **DNS** → **Edit**
   - **Zone** → **Zone** → **Read**
4. Zone Resources:
   - **Include** → **Specific zone** → `kanare.dev` を選択
5. **Continue to summary** をクリック
6. **Create Token** をクリック

#### 1.4 トークンをコピー

作成されたAPIトークンを**安全な場所にコピー**してください。

⚠️ **重要**: このトークンは一度しか表示されません！

**例**:
```
y_abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ
```

---

### ステップ 2: Cloudflare Zone IDの取得

#### 2.1 ドメイン詳細ページに移動

1. Cloudflareダッシュボードに戻る
2. `kanare.dev` ドメインをクリック

#### 2.2 Zone IDをコピー

右側のサイドバーに **Zone ID** が表示されます。

**例**:
```
1234567890abcdef1234567890abcdef
```

これをコピーしてください。

---

### ステップ 3: Terraform変数ファイルの設定

#### 3.1 terraform.tfvarsファイルを編集

```bash
cd terraform/environments/dev
```

`terraform.tfvars`ファイルを作成または編集：

```hcl
# AWS設定
aws_region = "ap-northeast-1"

# Cloudflare DNS管理を有効化
enable_cloudflare_dns = true

# Cloudflare APIトークン（ステップ1で取得）
cloudflare_api_token = "y_abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"

# Cloudflare Zone ID（ステップ2で取得）
cloudflare_zone_id = "1234567890abcdef1234567890abcdef"
```

⚠️ **セキュリティ注意**:
- `terraform.tfvars` は `.gitignore` に含まれています
- **Gitにコミットしないでください**
- APIトークンは絶対に公開しないでください

#### 3.2 環境変数での設定（推奨：CI/CD向け）

本番環境やCI/CDでは、環境変数を使用することを推奨します：

```bash
export TF_VAR_cloudflare_api_token="your-api-token-here"
export TF_VAR_cloudflare_zone_id="your-zone-id-here"
export TF_VAR_enable_cloudflare_dns=true
```

GitHub Actionsの場合：

```yaml
env:
  TF_VAR_cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
  TF_VAR_cloudflare_zone_id: ${{ secrets.CLOUDFLARE_ZONE_ID }}
  TF_VAR_enable_cloudflare_dns: true
```

---

### ステップ 4: Terraformの初期化

```bash
cd terraform/environments/dev
terraform init
```

Cloudflare Providerがダウンロードされます：

```
Initializing provider plugins...
- Finding cloudflare/cloudflare versions matching "~> 4.0"...
- Installing cloudflare/cloudflare v4.x.x...
```

---

### ステップ 5: 既存のDNSレコードをTerraform管理に移行（初回のみ）

⚠️ **重要**: すでにCloudflareに手動でDNSレコードを設定している場合、Terraformにインポートする必要があります。

#### 5.1 既存のDNSレコードを確認

Cloudflareダッシュボードで現在のDNSレコードを確認します。

#### 5.2 Terraformにインポート（オプション）

既存のレコードがある場合、以下のコマンドでインポートできます：

```bash
# 例：note-app.kanare.dev のCNAMEレコードをインポート
terraform import 'cloudflare_record.note_app[0]' <zone-id>/<record-id>
```

**または**、手動で一度削除してから `terraform apply` で再作成する方が簡単です：

1. Cloudflareダッシュボードで既存のDNSレコードを削除
2. `terraform apply` で新しく作成

---

### ステップ 6: Terraform Apply

```bash
terraform plan
```

確認：以下のリソースが追加されるはずです：

```
Plan: 4 to add, 0 to change, 0 to destroy.

# 以下のリソースが作成される:
+ cloudflare_record.acm_validation_note_app[0]
+ cloudflare_record.acm_validation_api[0]
+ cloudflare_record.note_app[0]
+ cloudflare_record.api_note_app[0]
```

問題なければ適用：

```bash
terraform apply
```

`yes` を入力して実行します。

---

## 使用方法

### 通常の運用

Cloudflare Terraform Providerを有効化すると、以下が自動化されます：

#### 1. 初回デプロイ

```bash
terraform apply
```

- AWSリソース作成
- Cloudflare DNSレコード自動作成
- ACM証明書の検証が自動完了

#### 2. インフラ再構築

```bash
terraform destroy
terraform apply
```

- DNSレコードも含めて完全に再作成
- 手動設定は**一切不要**

#### 3. DNSレコードの変更

Terraformコードを編集して `terraform apply` するだけ：

```hcl
resource "cloudflare_record" "note_app" {
  # ...
  name    = "note-app-v2"  # 変更例
  # ...
}
```

### Cloudflare管理を無効化する場合

一時的に手動管理に戻したい場合：

```hcl
# terraform.tfvars
enable_cloudflare_dns = false
```

```bash
terraform apply
```

Cloudflare関連のリソースが削除されます（DNSレコード自体は残ります）。

---

## トラブルシューティング

### エラー: "Error creating DNS record: authentication failure"

**原因**: APIトークンが無効、または権限が不足

**対処法**:
1. Cloudflare APIトークンが正しくコピーされているか確認
2. トークンの権限を確認（Zone DNS Editが必要）
3. トークンが有効期限切れでないか確認

### エラー: "Zone not found"

**原因**: Zone IDが間違っている

**対処法**:
1. Cloudflareダッシュボードで正しいZone IDを確認
2. `terraform.tfvars` の `cloudflare_zone_id` を修正

### エラー: "Record already exists"

**原因**: Cloudflareに同じ名前のDNSレコードが既に存在

**対処法**:

**Option A**: 既存レコードを削除してから再度apply

```bash
# Cloudflareダッシュボードで手動削除
terraform apply
```

**Option B**: Terraformにインポート

```bash
# レコードIDを確認（Cloudflare APIまたはダッシュボード）
terraform import 'cloudflare_record.note_app[0]' <zone-id>/<record-id>
```

### エラー: "Provider configuration not present"

**原因**: `terraform init` が実行されていない

**対処法**:
```bash
terraform init
```

---

## 🔒 セキュリティのベストプラクティス

### 1. APIトークンの管理

✅ **推奨**:
- 環境変数で管理（`TF_VAR_cloudflare_api_token`）
- CI/CDではSecretsに保存（GitHub Secrets等）
- 必要最小限の権限のみ付与

❌ **避けるべき**:
- Gitリポジトリにコミット
- 共有チャットやメールで送信
- 管理者権限のトークンを使用

### 2. terraform.tfvarsの管理

`terraform.tfvars` には機密情報が含まれるため：

```bash
# .gitignoreに含まれていることを確認
cat .gitignore | grep terraform.tfvars
```

出力例：
```
*.tfvars
```

### 3. State fileの管理

Terraform State fileにもAPIトークンが保存されます：

**推奨**: S3バックエンドで管理（暗号化+アクセス制御）

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

---

## 📊 コスト

Cloudflare Terraform Provider自体は**無料**です。

- Cloudflare Free Planで使用可能
- APIリクエストも無料
- 追加コストなし

---

## 🎯 まとめ

### Before（手動管理）

```
terraform apply
↓
Cloudflareで手動設定（5つのCNAMEレコード）
↓
ACM証明書検証待ち
↓
完了（30-75分）
```

### After（Terraform管理）

```
terraform apply
↓
完了（20-40分、全自動）
```

---

## 📚 関連ドキュメント

- [Cloudflare Terraform Provider公式ドキュメント](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [デプロイガイド](deployment-guide.md) - 初回デプロイの手順

---

## 🔗 参考リンク

- [Cloudflare API Tokens](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [Terraform Cloudflare Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest)
- [Cloudflare DNS Records API](https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records)

---

**更新日**: 2026年2月23日
**バージョン**: 1.0











