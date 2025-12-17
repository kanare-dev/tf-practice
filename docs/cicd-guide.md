# CI/CDガイド

このプロジェクトでは、GitOpsによるCI/CDパイプラインを設定できます。

## GitHub Actions（推奨）

### 設定方法

1. GitHubリポジトリを作成
2. リポジトリのSettings > Secrets and variables > Actions で以下を設定：
   - `AWS_ACCESS_KEY_ID`: AWSアクセスキーID
   - `AWS_SECRET_ACCESS_KEY`: AWSシークレットアクセスキー

3. `.github/workflows/terraform.yml`が自動的に実行されます

### ワークフロー

- **terraform-fmt**: Terraformコードのフォーマットチェック
- **terraform-validate**: Terraformコードの検証
- **terraform-plan**: プルリクエスト時に実行計画を表示
- **terraform-apply**: mainブランチへのマージ時に自動適用

## AWS CodePipeline / CodeBuild

### 設定方法

1. CodePipelineコンソールで新しいパイプラインを作成
2. ソース: GitHub（接続が必要）
3. ビルド: CodeBuild
4. デプロイ: （必要に応じて追加）

### Buildspecファイル

`ci-cd/aws/buildspec.yml`を使用してCodeBuildを設定します。

### 手動セットアップ

```bash
# CodeBuildプロジェクトの作成（Terraformで管理することも可能）
aws codebuild create-project \
  --name terraform-build \
  --source type=GITHUB,location=https://github.com/your-org/tf-practice \
  --buildspec ci-cd/aws/buildspec.yml \
  --service-role arn:aws:iam::account-id:role/codebuild-service-role
```

## セキュリティ考慮事項

- AWS認証情報はSecrets Managerまたは環境変数で管理
- IAMロールの最小権限の原則を適用
- 状態ファイルの暗号化
- 監査ログの有効化

## 推奨設定

- ブランチ保護ルールの設定
- プルリクエストの必須レビュー
- 自動テストの必須通過
- 状態ファイルのロック（DynamoDB）

