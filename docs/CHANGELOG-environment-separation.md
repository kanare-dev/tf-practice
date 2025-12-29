# CHANGELOG: Dev/Prod環境分離

本ドキュメントは、Dev/Prod環境分離に関する変更履歴を記録します。

## [1.0.0] - 2025-12-28

### 🎉 初回リリース: Dev/Prod環境完全分離

#### Added

**インフラストラクチャ**
- ✅ `terraform/backend-setup/` - Terraform State管理用リソース（S3、DynamoDB）
- ✅ `terraform/environments/prod/` - 本番環境構成
- ✅ `terraform/environments/prod/backend.tf` - Prod環境のS3バックエンド設定
- ✅ `terraform/environments/dev/backend.tf` - Dev環境のS3バックエンド設定

**環境変数**
- ✅ `var.env` - 環境識別変数（prod/dev）
- ✅ `var.domain_name` - 環境ごとのドメイン名
- ✅ `var.api_domain_name` - 環境ごとのAPIドメイン名

**Lifecycle保護（Prod環境のみ）**
- ✅ CloudFront Distribution - `prevent_destroy = true`
- ✅ ACM証明書（2つ） - `prevent_destroy = true`
- ⚠️ S3バケット - Terraformの制限により`prevent_destroy`適用不可（代替保護策あり）
- ⚠️ DynamoDBテーブル - Terraformの制限により`prevent_destroy`適用不可（代替保護策あり）

**Terraformの制限**:
- `lifecycle`ブロック内では変数を使用できない
- モジュール経由のリソースには環境固有のlifecycle設定を適用不可
- 代替保護策: バージョニング、Point-in-time recovery、IAM権限制限

**ドキュメント**
- ✅ `terraform/MIGRATION_GUIDE.md` - 環境分離マイグレーションガイド
- ✅ `terraform/README.md` - Terraform構成の概要（更新）
- ✅ `terraform/backend-setup/README.md` - Backend setup詳細
- ✅ `terraform/environments/prod/README.md` - Prod環境ガイド
- ✅ `terraform/environments/dev/README.md` - Dev環境ガイド（更新）
- ✅ `adr/0005-dev-prod-environment-separation.md` - 環境分離のADR
- ✅ `README.md` - ルートREADME（更新）
- ✅ `docs/getting-started.md` - クイックスタートガイド（更新）
- ✅ `docs/deployment-guide.md` - デプロイガイド（更新）

#### Changed

**モジュール**
- ✅ `modules/s3/` - env変数追加、環境ごとのlifecycle設定
- ✅ `modules/dynamodb/` - env変数追加、環境ごとのlifecycle設定

**環境設定**
- ✅ Prod環境の設定を `environments/dev/` から `environments/prod/` に移動
- ✅ Dev環境の設定を新規ドメイン（dev.note-app.kanare.dev）に変更
- ✅ 全リソース名に環境接頭辞を追加（例: NotesTable-prod, NotesTable-dev）

**State管理**
- ✅ ローカルStateからS3バックエンドへ移行
- ✅ 環境ごとにStateを完全分離
  - Prod: `s3://kanare-terraform-state-bucket/prod/terraform.tfstate`
  - Dev: `s3://kanare-terraform-state-bucket/dev/terraform.tfstate`

**Cloudflare DNS**
- ✅ Prod環境のDNSレコード: `note-app`, `api.note-app`
- ✅ Dev環境のDNSレコード: `dev.note-app`, `api-dev.note-app`

#### Infrastructure

**リソース命名規則**

| リソース | Prod | Dev |
|---------|------|-----|
| ドメイン | note-app.kanare.dev | dev.note-app.kanare.dev |
| APIドメイン | api.note-app.kanare.dev | api-dev.note-app.kanare.dev |
| S3バケット | note-app.kanare.dev | dev.note-app.kanare.dev |
| DynamoDB | NotesTable-prod | NotesTable-dev |
| Lambda | note-api-handler-prod | note-api-handler-dev |
| API Gateway | note-api-gateway-prod | note-api-gateway-dev |
| Cognito | note-app-user-pool-prod | note-app-user-pool-dev |

**タグ規則**

すべてのリソースに以下のタグを設定：
- `Name`: `${env}-tfpractice-<リソース種別>`
- `Environment`: `prod` または `dev`
- `System`: `tfpractice`
- `ManagedBy`: `terraform`

#### Migration

**手順**

1. **Phase 1: Backend Setup**
   - `terraform/backend-setup` で State管理用リソースを作成
   - S3バケット: `kanare-terraform-state-bucket`
   - DynamoDBテーブル: `terraform-state-locks`

2. **Phase 2: Prod環境の準備**
   - 既存の `dev` ディレクトリを `prod` にコピー
   - Backend設定を追加
   - `terraform init -migrate-state` でStateを移行
   - `terraform plan` で差分なしを確認

3. **Phase 3: Dev環境の新規構築**
   - ドメイン、リソース名を変更
   - 新規Stateで `terraform apply`
   - 完全に新しいスタックを構築

**結果**
- ✅ Prod環境の既存リソースを無停止で維持
- ✅ Dev環境を完全に新規構築
- ✅ State完全分離
- ✅ 環境ごとの保護レベル設定

#### Security

**Prod環境の保護**
- 重要リソースに `prevent_destroy = true` を設定
- 誤操作による本番停止を防止
- Stateのバージョニングと暗号化

**機密情報の管理**
- `terraform.tfvars` を `.gitignore` で除外
- Cloudflare APIトークンなどの機密情報を保護

#### Benefits

**安全性**
- 本番環境への誤操作を防止
- Lifecycle保護による追加の安全策
- Stateのバックアップとバージョニング

**開発効率**
- Dev環境で自由にテスト可能
- 変更を本番適用前に検証
- 環境間の影響を完全に排除

**運用性**
- 環境の識別が容易
- コスト配分の明確化
- トラブルシューティングの簡素化

**チーム開発**
- State Lockによる競合防止
- S3による中央管理
- 環境ごとの責任範囲の明確化

#### Breaking Changes

⚠️ **重要**: この変更は既存のセットアップに影響します

**既存ユーザー向け**
- ローカルStateを使用している場合、S3バックエンドへの移行が必要
- 環境変数（env, domain_name, api_domain_name）の追加が必要
- `terraform.tfvars` の更新が必要

**新規ユーザー向け**
- Backend Setupの実行が必須
- 環境（dev/prod）の選択が必要

#### References

- [ADR 0005: Dev/Prod環境分離の実装](../adr/0005-dev-prod-environment-separation.md)
- [terraform/MIGRATION_GUIDE.md](../terraform/MIGRATION_GUIDE.md)
- [terraform/README.md](../terraform/README.md)

---

## 今後の予定

### v1.1.0（計画中）

**機能追加**
- [ ] Staging環境の追加
- [ ] 環境ごとのコスト追跡ダッシュボード
- [ ] CI/CDパイプラインの環境分離対応

**改善**
- [ ] モジュールのさらなる抽象化
- [ ] 環境変数の検証機能強化
- [ ] ドキュメントの多言語対応

**セキュリティ**
- [ ] State暗号化のKMSキー対応
- [ ] IAMロールの最小権限化
- [ ] セキュリティスキャンの自動化

---

## フィードバック

環境分離に関するフィードバックは、以下の方法でお寄せください：

- GitHubイシュー
- プルリクエスト
- ドキュメントの改善提案

---

**最終更新**: 2025-12-28
**バージョン**: 1.0.0
**担当者**: Infrastructure Team
