# CI/CDガイド

このドキュメントでは、プロジェクトのCI/CDパイプラインの運用方法と、GitHub Actionsワークフローの詳細を説明します。

## 目次

- [概要](#概要)
- [GitHub Secrets設定ガイド](#github-secrets設定ガイド)
- [ワークフロー一覧](#ワークフロー一覧)
- [Terraform CI/CDワークフロー](#terraform-cicdワークフロー)
- [静的サイトデプロイワークフロー](#静的サイトデプロイワークフロー)
- [環境別デプロイフロー](#環境別デプロイフロー)
- [運用ベストプラクティス](#運用ベストプラクティス)
- [トラブルシューティング](#トラブルシューティング)

---

## 概要

このプロジェクトでは、**GitHub Actions**を使用した完全自動化されたCI/CDパイプラインを実装しています。

### CI/CDアーキテクチャ

```
GitHub Repository
    │
    ├─ Pull Request
    │   ├─ Terraform: fmt / validate / plan（dev + prod）→ PRコメント
    │   └─ フロントエンド: ビルド → Dev環境へ自動デプロイ
    │
    ├─ Push to main（マージ）
    │   ├─ Terraform: fmt / validate / plan → apply dev（自動）
    │   │              → [GitHub Environment承認] → apply prod
    │   └─ フロントエンド: ビルド → Prod環境へ自動デプロイ
    │
    └─ Manual Dispatch → 任意の環境
        └─ 選択した環境へデプロイ
```

### 主要な特徴

- **GitOps**: PRとマージによるインフラ変更管理
- **環境分離**: Dev/Prod環境を完全に分離
- **自動化**: PR作成時とマージ時に自動実行
- **安全性**: Prod Terraform applyには手動承認が必要（GitHub Environment）
- **可視性**: PRコメントでplan差分・デプロイ結果を通知

---

## GitHub Secrets設定ガイド

### 必要なGitHub Secrets

#### 必須（AWS）

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `AWS_ACCESS_KEY_ID` | AWSアクセスキーID | IAMユーザーから取得 |
| `AWS_SECRET_ACCESS_KEY` | AWSシークレットアクセスキー | IAMユーザーから取得 |

#### オプション（Cloudflare DNS自動管理）

| Secret名 | 説明 | 取得方法 |
|---------|------|---------|
| `ENABLE_CLOUDFLARE_DNS` | Cloudflare DNS管理を有効化（`true`/`false`） | - |
| `CLOUDFLARE_API_TOKEN` | Cloudflare APIトークン | [Cloudflare導入ガイド](cloudflare-terraform-guide.md)参照 |
| `CLOUDFLARE_ZONE_ID` | Cloudflare Zone ID | [Cloudflare導入ガイド](cloudflare-terraform-guide.md)参照 |

### Secretsの設定手順

#### ステップ1: リポジトリのSettings画面を開く

1. GitHubリポジトリにアクセス
2. **Settings**タブをクリック
3. 左メニューの**Secrets and variables** → **Actions**をクリック

#### ステップ2: Secretsを追加

1. **New repository secret**ボタンをクリック
2. 以下のSecretsを1つずつ追加：

##### AWS認証情報（必須）

```
Name: AWS_ACCESS_KEY_ID
Secret: AKIA...（あなたのアクセスキーID）
```

```
Name: AWS_SECRET_ACCESS_KEY
Secret: （あなたのシークレットアクセスキー）
```

##### Cloudflare設定（オプション）

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

#### ステップ3: 確認

Secretsが正しく設定されたか確認：

- **Settings** → **Secrets and variables** → **Actions**
- 設定したSecretsが表示される（値は隠される）

### セットアップチェックリスト

**GitHub Secrets**
- [ ] `AWS_ACCESS_KEY_ID` を GitHub Secrets に設定した
- [ ] `AWS_SECRET_ACCESS_KEY` を GitHub Secrets に設定した
- [ ] Cloudflare DNS 自動管理を使用する場合、以下も設定した：
  - [ ] `ENABLE_CLOUDFLARE_DNS`
  - [ ] `CLOUDFLARE_API_TOKEN`
  - [ ] `CLOUDFLARE_ZONE_ID`

**GitHub Environment（prod apply の手動承認に必要）**
- [ ] GitHub リポジトリ → Settings → Environments → `production` を作成した
- [ ] Required reviewers に自分のアカウントを追加した

**IAM・動作確認**
- [ ] IAM ユーザーに適切な権限を付与した
- [ ] ローカルでテストし、正常に動作することを確認した
- [ ] PR を作成してワークフローが実行されることを確認した

---

## ワークフロー一覧

| ワークフロー | ファイル | 目的 | トリガー |
|------------|---------|------|---------|
| Terraform CI | `terraform.yml` | インフラコードの検証とプラン | PR/Push（terraform関連） |
| Static Site Deploy | `deploy-static-site.yml` | フロントエンドのビルドとデプロイ | PR/Push（frontend関連） |

### 初期セットアップ

GitHub Secretsの設定方法は[GitHub Secrets設定ガイド](#github-secrets設定ガイド)を参照してください。

---

## Terraform CI/CDワークフロー

### ファイル: `.github/workflows/terraform.yml`

インフラストラクチャコードの品質を保証し、変更内容を可視化するワークフローです。

### トリガー条件

```yaml
# 以下の条件で実行
on:
  push:
    branches: [main, develop]
    paths:
      - "terraform/environments/**"
      - "terraform/modules/**"
      - ".github/workflows/**"

  pull_request:
    branches: [main, develop]
    paths:
      - "terraform/environments/**"
      - "terraform/modules/**"
```

### ジョブの詳細

#### 1. terraform-fmt（フォーマットチェック）

```
目的: Terraformコードの整形ルールに準拠しているか確認
実行タイミング: 全てのPR/Push
実行内容: terraform fmt -check -recursive
```

**チェック内容**:
- インデント（2スペース）
- ブロックの並び順
- 引用符の統一

**失敗時の対処**:
```bash
# ローカルで修正
terraform fmt -recursive

# 修正をコミット
git add .
git commit -m "fix: Format Terraform files"
git push
```

#### 2. terraform-validate（構文検証）

```
目的: Terraform設定ファイルの構文エラーを検出
実行タイミング: 全てのPR/Push
対象環境: dev, prod（マトリックス並列実行）
実行内容: terraform init -backend=false && terraform validate
```

**チェック内容**:
- HCL構文エラー
- リソース定義の妥当性
- 変数参照の整合性
- モジュール呼び出しの正確性

**特徴**:
- バックエンド不要（`-backend=false`）
- ダミー変数で実行（AWS接続不要）
- 両環境を並列チェック

#### 3. terraform-plan（実行計画の生成）

```
目的: インフラ変更内容の可視化とレビュー
実行タイミング: PRまたはmainブランチへのPush
対象環境: dev, prod（マトリックス並列実行）
実行内容: terraform init && terraform plan
```

**実行フロー**:

```
1. AWS認証情報の設定
   ├─ AWS_ACCESS_KEY_ID
   └─ AWS_SECRET_ACCESS_KEY

2. Terraform初期化
   ├─ S3バックエンド接続
   ├─ プロバイダープラグインのダウンロード
   └─ 状態ファイルの取得

3. 環境変数の設定
   ├─ TF_VAR_env (dev/prod)
   ├─ TF_VAR_domain_name
   ├─ TF_VAR_api_domain_name
   └─ Cloudflare変数（オプション）

4. Planの実行
   ├─ 実行計画をplan_output.txtに保存（PRコメント用）
   └─ バイナリ形式のtfplanを-outオプションで保存

5. PRコメント投稿（PR時のみ）
   └─ 変更内容をコメントに表示

6. tfplanのアーティファクト保存（main push時のみ）
   └─ tfplan-dev / tfplan-prod としてアップロード（有効期限: 1日）
```

**PRコメント例**:

```markdown
#### Terraform Plan - `dev` environment

<details><summary>Show Plan</summary>

```terraform
Terraform will perform the following actions:

  # module.lambda_api_handler.aws_lambda_function.this will be updated in-place
  ~ resource "aws_lambda_function" "this" {
      ~ last_modified      = "2024-01-15T10:00:00.000+0000" -> (known after apply)
        # (12 unchanged attributes hidden)
    }

Plan: 0 to add, 1 to change, 0 to destroy.
```

</details>

*Environment: `dev`, Pusher: @canale, Workflow: `Terraform CI`*
```

### Apply ジョブ

#### 4. terraform-apply-dev（dev 自動 apply）

```
目的: mainマージ時にdev環境を自動適用
実行タイミング: mainへのpush時のみ（PRでは実行しない）
依存関係: terraform-plan（dev + prod 両方の成功が必要）
実行内容: terraform init → tfplanダウンロード → terraform apply tfplan
```

> **plan/apply の一貫性**: apply ジョブは plan ジョブで生成・保存した tfplan を
> アーティファクト経由でダウンロードし、そのまま適用する。
> これにより PR でレビューした plan と実際の apply が必ず一致する。

#### 5. terraform-apply-prod（prod 手動承認 apply）

```
目的: dev適用成功後、手動承認を経てprod環境に適用
実行タイミング: mainへのpush時、apply-dev成功後
承認: GitHub Environment "production" の Required Reviewers が承認
実行内容: terraform init → tfplanダウンロード → terraform apply tfplan
```

**GitHub Environment 承認フロー**:

```
apply-dev 完了
    ↓
GitHub Actions が "production" environment の保護ルールを確認
    ↓
Required Reviewers に通知（メール + GitHub UI）
    ↓
レビュアーが Actions 画面で "Approve and deploy" をクリック
    ↓
apply-prod 実行開始
```

**緊急時の手動 apply**（CI が壊れている場合のみ）:

```bash
cd terraform/environments/dev  # または prod
terraform init
terraform plan
terraform apply
```

---

## 静的サイトデプロイワークフロー

### ファイル: `.github/workflows/deploy-static-site.yml`

Reactフロントエンドをビルドし、S3にデプロイし、CloudFrontキャッシュを無効化するワークフローです。

### トリガー条件

```yaml
on:
  # 1. mainブランチへのPush → Prod環境
  push:
    branches: [main]
    paths:
      - "frontend/**"
      - ".github/workflows/deploy-static-site.yml"

  # 2. PRの作成・更新 → Dev環境
  pull_request:
    branches: [main]
    paths:
      - "frontend/**"
      - ".github/workflows/deploy-static-site.yml"

  # 3. 手動実行 → 任意の環境
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [dev, prod]
```

### デプロイフロー詳細

#### ステップ1: 環境の決定

```yaml
# トリガーに基づいて自動判定
workflow_dispatch → ユーザー選択
pull_request     → dev
push to main     → prod
```

#### ステップ2: 環境変数の設定

```bash
# Dev環境
bucket_name=dev.note-app.kanare.dev
domain_name=dev.note-app.kanare.dev
api_base_url=https://api-dev.note-app.kanare.dev

# Prod環境
bucket_name=note-app.kanare.dev
domain_name=note-app.kanare.dev
api_base_url=https://api.note-app.kanare.dev
```

#### ステップ3: S3バケットの存在確認

```bash
# バケットが存在しない場合はエラーで停止
aws s3 ls "s3://${bucket_name}"

# エラー時のメッセージ
❌ S3バケット dev.note-app.kanare.dev が存在しないため、デプロイをスキップします
💡 先にTerraformで dev 環境のインフラを構築してください
```

**目的**: Terraformでインフラ構築前のデプロイを防止

#### ステップ4: Cognito設定の取得

**優先順位**:

```
1. Terraform Outputs（推奨）
   └─ terraform output -raw cognito_user_pool_id

2. GitHub Secrets（フォールバック）
   ├─ Prod: VITE_USER_POOL_ID
   └─ Dev: VITE_USER_POOL_ID_DEV
```

**Terraform Outputsからの取得処理**:

```bash
# 1. Terraform初期化
terraform init

# 2. Outputsから値を取得（エラー出力をフィルタ）
USER_POOL_ID=$(terraform output -raw cognito_user_pool_id 2>&1 | grep -v "╷" | grep -v "│" | grep -v "╵" | head -n1)

# 3. 形式検証（AWS User Pool IDの形式）
if [[ "$USER_POOL_ID" =~ ^[a-z]+-[a-z]+-[0-9]+_[a-zA-Z0-9]+$ ]]; then
  echo "✅ Terraform outputsからCognito設定を取得しました"
else
  echo "⚠️ Validation failed. Using Secrets..."
fi
```

**なぜTerraform Outputsを優先するのか？**

- **信頼できる情報源**: Terraformが管理する実際のリソース情報
- **手動更新不要**: Secretsの手動更新を省略
- **環境整合性**: デプロイ時点の最新状態を反映

#### ステップ5: フロントエンドのビルド

```bash
cd frontend
npm ci

# 環境変数を設定してビルド
npm run build
```

**ビルド時の環境変数**:

```bash
VITE_API_BASE_URL=https://api-dev.note-app.kanare.dev
VITE_AWS_REGION=ap-northeast-1
VITE_USER_POOL_ID=ap-northeast-1_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
```

**ビルド成果物**: `frontend/dist/`

#### ステップ6: S3への同期

```bash
# --deleteオプションで削除済みファイルも反映
aws s3 sync frontend/dist/ s3://dev.note-app.kanare.dev/ --delete

# 出力例
upload: frontend/dist/index.html to s3://dev.note-app.kanare.dev/index.html
upload: frontend/dist/assets/index-abc123.js to s3://...
✅ デプロイ完了: https://dev.note-app.kanare.dev
```

#### ステップ7: CloudFront Distribution IDの取得

```bash
# エイリアス（ドメイン名）からDistribution IDを取得
aws cloudfront list-distributions \
  --query "DistributionList.Items[?Aliases.Items[?contains(@, 'dev.note-app.kanare.dev')]].Id | [0]" \
  --output text

# 出力例: E1234567890ABC
```

#### ステップ8: CloudFrontキャッシュの無効化

```bash
# 全てのパスのキャッシュを無効化
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# 出力
✅ CloudFrontキャッシュを無効化しました
```

**なぜキャッシュ無効化が必要か？**

- CloudFrontはデフォルトで24時間キャッシュ
- S3更新だけでは古いコンテンツが配信される
- 即座に最新版を反映するため

#### ステップ9: PRコメント投稿（PR時のみ）

```markdown
### 🚀 Static Site Deployed to **dev** environment

**Preview URL**: https://dev.note-app.kanare.dev

**Environment Details**:
- S3 Bucket: `dev.note-app.kanare.dev`
- API URL: `https://api-dev.note-app.kanare.dev`
- CloudFront: ✅ Cache invalidated

*Deployed by: @canale*
```

---

## 環境別デプロイフロー

### Dev環境へのデプロイ

#### シナリオ1: PR作成時（自動）

```
1. フィーチャーブランチで開発
   └─ git checkout -b feature/add-new-feature

2. コードを変更してPush
   └─ git push origin feature/add-new-feature

3. PRを作成
   └─ GitHub上でPRを作成

4. 自動デプロイ開始
   ├─ deploy-static-site.ymlが実行
   ├─ Dev環境を自動判定
   ├─ フロントエンドビルド
   └─ Dev環境へデプロイ

5. PRコメントで確認
   └─ https://dev.note-app.kanare.dev でプレビュー

6. レビュー後、必要に応じて再Push
   └─ 自動的に再デプロイ
```

#### シナリオ2: 手動デプロイ

```bash
# GitHub ActionsのUI操作
1. Actionsタブを開く
2. "Deploy Static Site to S3"を選択
3. "Run workflow"をクリック
4. Environment: dev を選択
5. "Run workflow"ボタンをクリック
```

### Prod環境へのデプロイ

#### 標準フロー（推奨）

```
1. Dev環境でテスト
   └─ https://dev.note-app.kanare.dev で動作確認

2. PRをmainにマージ
   └─ GitHub上で"Merge pull request"

3. 自動デプロイ開始
   ├─ deploy-static-site.ymlが実行
   ├─ Prod環境を自動判定
   ├─ フロントエンドビルド
   └─ Prod環境へデプロイ

4. 本番確認
   └─ https://note-app.kanare.dev でリリース確認
```

#### 緊急ホットフィックス

```bash
# 1. mainブランチから直接修正
git checkout main
git pull origin main

# 2. 修正してPush（PRなし）
git add .
git commit -m "hotfix: Fix critical bug"
git push origin main

# 3. 自動的にProd環境へデプロイ
```

### Terraform インフラ変更の標準フロー（GitOps）

```
1. ブランチを作成
   └─ git checkout -b feature/your-change

2. Terraform コードを変更
   └─ terraform/environments/dev/ または terraform/modules/

3. PR を作成
   ├─ GitHub Actions が自動で fmt / validate / plan を実行
   └─ PR コメントに dev + prod の plan 差分が表示される

4. Plan 差分をレビューしてマージ
   └─ 「意図した変更のみか」「破壊的変更がないか」を確認

5. マージ後、dev に自動 apply
   └─ terraform-apply-dev ジョブが自動実行

6. dev 動作確認後、prod への承認
   └─ GitHub Actions の terraform-apply-prod ジョブで "Approve and deploy" をクリック
```

> **注意**: `terraform apply` をローカルで直接実行するのは緊急時のみにしてください。
> 通常の変更はすべて PR 経由で行い、CI/CD パイプラインを通じて適用します。

---

## 運用ベストプラクティス

### 1. ブランチ戦略

```
main（保護ブランチ）
  ├─ 本番環境にデプロイ
  ├─ PRレビュー必須
  └─ CI/CD全て通過必須

develop（オプション）
  ├─ 開発統合ブランチ
  └─ Terraform検証に利用

feature/*（フィーチャーブランチ）
  ├─ 個別機能開発
  └─ PRでDev環境にデプロイ
```

### 2. GitHub Branch Protection設定

```
Settings → Branches → Branch protection rules

mainブランチに対して:
☑ Require a pull request before merging
  ☑ Require approvals (1人以上)
☑ Require status checks to pass before merging
  ☑ terraform-fmt
  ☑ terraform-validate
  ☑ deploy / deploy
☑ Require conversation resolution before merging
☑ Do not allow bypassing the above settings
```

### 3. デプロイ前チェックリスト

#### フロントエンド変更時

- [ ] ローカルで`npm run build`が成功する
- [ ] ローカルで`npm run lint`が通る
- [ ] Dev環境でUI/UX動作確認
- [ ] 認証フローが正常動作
- [ ] API連携が正常動作

#### Terraform変更時

- [ ] `terraform fmt`でフォーマット済み
- [ ] `terraform validate`が成功
- [ ] `terraform plan`で意図した変更のみ
- [ ] 破壊的変更（削除/再作成）がないか確認
- [ ] Dev環境で先に適用済み
- [ ] 状態ファイルのバックアップ取得済み

### 4. セキュリティ対策

#### AWS IAMユーザー

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket",
        "s3:DeleteObject",
        "cloudfront:CreateInvalidation",
        "cloudfront:ListDistributions"
      ],
      "Resource": [
        "arn:aws:s3:::dev.note-app.kanare.dev/*",
        "arn:aws:s3:::note-app.kanare.dev/*",
        "arn:aws:cloudfront::*:distribution/*"
      ]
    }
  ]
}
```

**原則**: デプロイに必要な最小限の権限のみ

#### Terraform管理用IAMポリシー（推奨）

GitHub Actions用のIAMユーザーには、**必要最小限の権限**のみを付与してください。

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

または、開発環境向けに特定リージョンに制限する場合：

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

#### GitHub Secrets管理

```
定期的なローテーション（推奨）:
- AWS認証情報: 3ヶ月ごと
- Cloudflare APIトークン: 6ヶ月ごと

アクセス制限:
- 公開リポジトリでは使用しない
- Fork PRからは実行できない設定
- 必要なワークフローのみに権限付与
```

✅ **やるべきこと**:
- Secretsは必ずGitHub Secretsで管理
- 定期的にトークンをローテーション（3-6ヶ月ごと）
- 使用しないSecretsは削除

❌ **やってはいけないこと**:
- コードにAPIトークンをハードコード
- PRコメントに機密情報を表示
- 公開リポジトリでSecretsを使用（Forkから悪用される可能性）

#### Cloudflare APIトークン

最小権限のトークンを作成してください：

**権限**:
- Zone / DNS / Edit
- Zone / Zone / Read

**対象Zone**:
- 特定のZone（kanare.dev）のみ

詳細: [Cloudflare Terraform導入ガイド](cloudflare-terraform-guide.md)

### 5. モニタリングとロギング

#### デプロイ状況の確認

```bash
# GitHub ActionsのUI
https://github.com/Canale0107/tf-practice/actions

# 最新のワークフロー実行状態
gh run list --workflow=deploy-static-site.yml --limit 5

# 特定のワークフロー詳細
gh run view <RUN_ID>
```

#### CloudFrontアクセスログ

```hcl
# terraform/modules/cloudfront/main.tf
logging_config {
  include_cookies = false
  bucket          = aws_s3_bucket.logs.bucket_domain_name
  prefix          = "cloudfront/"
}
```

#### デプロイ履歴の追跡

```bash
# S3バケットのバージョニング有効化
aws s3api get-bucket-versioning --bucket note-app.kanare.dev

# 過去バージョンの確認
aws s3api list-object-versions --bucket note-app.kanare.dev --prefix index.html
```

### 6. ロールバック手順

#### フロントエンドのロールバック

```bash
# 方法1: 前回のコミットに戻す
git revert HEAD
git push origin main
# → 自動的に再デプロイ

# 方法2: S3バージョニングから復元
aws s3api list-object-versions \
  --bucket note-app.kanare.dev \
  --prefix index.html

aws s3api copy-object \
  --copy-source note-app.kanare.dev/index.html?versionId=<VERSION_ID> \
  --bucket note-app.kanare.dev \
  --key index.html

# CloudFrontキャッシュ無効化
aws cloudfront create-invalidation \
  --distribution-id <DIST_ID> \
  --paths "/*"
```

#### Terraformのロールバック

```bash
# 方法1: Terraform状態から復元
cd terraform/environments/prod

# 前回のapply内容を確認
terraform show

# 特定リソースを再作成
terraform taint aws_lambda_function.api_handler
terraform apply

# 方法2: Git履歴から復元
git log --oneline terraform/environments/prod/
git checkout <COMMIT_HASH> -- terraform/environments/prod/main.tf
terraform plan
terraform apply
```

---

## トラブルシューティング

### Terraform関連

#### エラー: "Error: No value for required variable"

**症状**:
```
Error: No value for required variable
  on variables.tf line 10:
  10: variable "cloudflare_api_token" {
```

**原因**: GitHub Secretsが設定されていない

**対処法**:
```bash
# 1. 必要なSecretsを確認
Settings → Secrets and variables → Actions

# 2. 不足しているSecretを追加
CLOUDFLARE_API_TOKEN: your-token-here

# 3. ワークフローを再実行
```

#### エラー: "Error: Error acquiring the state lock"

**症状**:
```
Error: Error acquiring the state lock

Lock Info:
  ID:        12345678-1234-1234-1234-123456789abc
  Path:      kanare-terraform-state-bucket/dev/terraform.tfstate
  Operation: OperationTypePlan
  Who:       github-actions@github-actions
```

**原因**: 前回のワークフロー実行が異常終了してロックが残っている

**対処法**:
```bash
# ローカルで強制アンロック
cd terraform/environments/dev
terraform force-unlock 12345678-1234-1234-1234-123456789abc
```

#### エラー: "Error: error creating CloudFront Distribution"

**症状**:
```
Error: error creating CloudFront Distribution: InvalidViewerCertificate:
The specified SSL certificate doesn't exist, isn't in us-east-1 region,
isn't valid, or doesn't include a valid certificate chain.
```

**原因**: ACM証明書が未作成または検証未完了

**対処法**:
```bash
# 1. 証明書の状態確認
aws acm list-certificates --region us-east-1

# 2. DNS検証レコードの確認
cd terraform/environments/dev
terraform output acm_validation_records

# 3. Cloudflare DNSに手動追加（またはenable_cloudflare_dns = true）
```

### Secrets・IAM設定関連

#### エラー: "Error: No value for required variable"（Secrets未設定）

**原因**: GitHub Secretsが設定されていない、または変数名が間違っている

**対処法**:
1. GitHub Settings → Secrets and variablesで設定を確認
2. Secret名が正しいか確認（大文字小文字を区別）
3. ワークフローファイルの環境変数名を確認

#### エラー: "Error: Insufficient access rights"

**原因**: AWS IAMユーザーの権限が不足

**対処法**:
1. IAMユーザーのポリシーを確認
2. 必要な権限を追加（S3, CloudFront, Lambda, API Gateway, DynamoDB, ACM）

#### エラー: "Error: authentication failure"（Cloudflare）

**原因**: Cloudflare APIトークンが無効または権限不足

**対処法**:
1. Cloudflare APIトークンが有効か確認
2. 権限（Zone DNS Edit）が付与されているか確認
3. 対象Zone（kanare.dev）が指定されているか確認

### 静的サイトデプロイ関連

#### エラー: "S3バケットが存在しない"

**症状**:
```
❌ S3バケット dev.note-app.kanare.dev が存在しないため、デプロイをスキップします
💡 先にTerraformで dev 環境のインフラを構築してください
```

**原因**: Terraformでインフラ構築前にデプロイを実行

**対処法**:
```bash
# 1. Terraformでインフラ構築
cd terraform/environments/dev
terraform init
terraform apply

# 2. ワークフローを再実行
```

#### エラー: "npm ERR! code ELIFECYCLE"

**症状**:
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
npm ERR! frontend@0.1.0 build: `vite build`
```

**原因**: ビルド時のTypeScriptエラーまたは環境変数不足

**対処法**:
```bash
# 1. ローカルで再現
cd frontend
npm ci
npm run build

# 2. エラーメッセージを確認
npm run lint

# 3. 環境変数が設定されているか確認
echo $VITE_API_BASE_URL
echo $VITE_USER_POOL_ID
```

#### エラー: "Access Denied" (S3同期時)

**症状**:
```
upload failed: frontend/dist/index.html to s3://note-app.kanare.dev/index.html
An error occurred (AccessDenied) when calling the PutObject operation: Access Denied
```

**原因**: IAMユーザーの権限不足

**対処法**:
```bash
# 1. IAMポリシーを確認
aws iam list-attached-user-policies --user-name github-actions

# 2. S3書き込み権限を追加
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:DeleteObject"
  ],
  "Resource": "arn:aws:s3:::note-app.kanare.dev/*"
}

# 3. GitHub Secretsの認証情報を更新（必要に応じて）
```

#### 警告: "CloudFront distributionが見つかりませんでした"

**症状**:
```
⚠️ CloudFront distributionが見つかりませんでした
```

**影響**: S3へのデプロイは成功するが、キャッシュ無効化がスキップされる

**対処法**:
```bash
# 1. CloudFront Distributionの存在確認
aws cloudfront list-distributions \
  --query "DistributionList.Items[*].[Id,Aliases.Items[0]]"

# 2. エイリアスが正しく設定されているか確認
cd terraform/environments/dev
terraform state show module.cloudfront_static_site.aws_cloudfront_distribution.this

# 3. Terraformで再作成（必要に応じて）
terraform taint module.cloudfront_static_site.aws_cloudfront_distribution.this
terraform apply
```

### Cognito設定取得の問題

#### 警告: "Terraform outputs validation failed"

**症状**:
```
⚠️ Terraform outputs validation failed. Using Secrets...
```

**原因**: Terraform Outputsの値が期待した形式でない

**対処法**:
```bash
# 1. Terraform Outputsを手動確認
cd terraform/environments/dev
terraform output cognito_user_pool_id
terraform output cognito_user_pool_client_id

# 2. Secretsを手動設定（フォールバック）
Settings → Secrets → Actions
VITE_USER_POOL_ID_DEV: ap-northeast-1_XXXXXXXXX
VITE_USER_POOL_CLIENT_ID_DEV: XXXXXXXXXXXXXXXXXXXXXXXXXX

# 3. ワークフローを再実行
```

### ワークフローが実行されない

#### 症状: PRを作成してもワークフローが開始しない

**原因チェックリスト**:

1. **パスフィルターに合致していない**
```yaml
# deploy-static-site.ymlの場合
paths:
  - "frontend/**"  # ← この配下のファイルのみトリガー
  - ".github/workflows/deploy-static-site.yml"
```

対処: 確認コマンド
```bash
git diff --name-only origin/main
# frontend/配下のファイルが含まれているか確認
```

2. **ブランチ名が異なる**
```yaml
branches: [main]  # ← mainブランチへのPRのみ
```

対処: ターゲットブランチを確認
```bash
gh pr view --json baseRefName
```

3. **ワークフローファイル自体に構文エラー**

対処: YAML検証
```bash
# GitHub CLIで検証
gh workflow view deploy-static-site.yml

# オンラインツールで検証
https://www.yamllint.com/
```

### GitHub Actions実行制限

#### エラー: "Workflow run was cancelled because the quota limit was reached"

**原因**: GitHub Actionsの無料枠を超過

**確認方法**:
```
Settings → Billing → Plans and usage
Actions: 2,000 minutes/month (無料プラン)
```

**対処法**:

1. **不要なワークフロー実行を停止**
```bash
# 実行中のワークフローをキャンセル
gh run cancel <RUN_ID>

# 全ての実行中ワークフローをキャンセル
gh run list --status in_progress --json databaseId -q '.[].databaseId' | xargs -I {} gh run cancel {}
```

2. **パスフィルターを最適化**
```yaml
# 必要なファイルのみをトリガー
paths:
  - "frontend/src/**"  # より限定的に
```

3. **有料プランへアップグレード**
- GitHub Pro: 3,000分/月 ($4/月)
- GitHub Team: 3,000分/月 + 並列実行増加

---

## 関連ドキュメント

- [Cloudflare Terraform導入ガイド](cloudflare-terraform-guide.md) - DNS自動管理の設定
- [デプロイガイド](deployment-guide.md) - 初回デプロイの完全な手順
- [再構築ガイド](rebuild-guide.md) - インフラの再構築方法

---

## まとめ

### CI/CDパイプラインの主要な特徴

1. **GitOps**: PR / マージによるインフラ変更管理（手動 apply 不要）
2. **環境分離**: Dev/Prod を完全に分離
3. **安全性**: Prod apply には GitHub Environment による手動承認が必要
4. **可視性**: PR コメントで plan 差分・デプロイ結果を通知
5. **フォールバック**: 複数の設定取得方法

### 推奨される運用フロー

```
開発 → PR作成 → [plan差分確認] → マージ
  → dev自動apply → [動作確認] → prod承認 → prod apply
```

### セキュリティのベストプラクティス

- IAM最小権限の原則
- Secretsの定期的なローテーション
- ブランチ保護ルールの設定
- 本番環境への変更は必ずレビュー

---

**更新日**: 2026年2月24日
**バージョン**: 3.0
**変更内容**: GitOps化（PR→plan、mainマージ→apply）、GitHub Environmentによるprod承認ゲート追加
