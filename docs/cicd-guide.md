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

## AWS CodePipeline / CodeBuild（参考・オプション）

> ※このプロジェクトでは **GitHub Actionsを推奨CI/CD** としています。CodeBuild運用は特殊な要件（例：会社方針やAWS上統一運用など）がある場合のみ参考にしてください。

### 参考: CodeBuild/CodePipeline を使いたい場合

- 独自にCodeBuild/CodePipeline構築したい場合には buildspec.yml テンプレートを参考にカスタマイズしてください。
- 通常の開発運用では不要です。
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

