# ADR 0005: Dev/Prod環境分離の実装

## ステータス

✅ **Accepted** (2025-12-28)

## コンテキスト

当初、このプロジェクトは単一の`terraform/environments/dev`ディレクトリでインフラを管理しており、実際には本番環境（note-app.kanare.dev）が稼働していました。この構成では以下の問題がありました：

### 問題点

1. **本番環境の脆弱性**: `terraform apply`の失敗や誤操作により本番サービスが停止するリスク
2. **テスト環境の欠如**: 新しい変更を安全にテストする環境がない
3. **State管理の問題**: ローカルStateファイルは単一障害点となり、チーム開発での競合リスクがある
4. **環境の混同**: devという名前だが実際には本番環境という混乱

### 要件

- 単一AWSアカウント内で実現（コスト削減）
- 本番環境の既存リソースを維持（destroy/recreate なし）
- 開発環境は自由に破壊・再構築可能
- Terraform Stateの安全な管理
- 環境間の完全な分離

## 決定事項

### 1. ディレクトリ構成による環境分離

Terraform Workspaceではなく、ディレクトリ構成による環境分離を採用：

```
terraform/
├── backend-setup/          # State管理用リソース（初回のみ）
├── environments/
│   ├── prod/              # 本番環境
│   └── dev/               # 開発環境
└── modules/               # 共有モジュール
```

**理由**:
- Workspaceは同じStateファイル内で環境を切り替えるため、誤操作のリスクがある
- ディレクトリ分離はState自体が完全に独立し、より安全
- 環境ごとに異なる設定（backend、変数など）を明示的に管理可能

### 2. S3バックエンドによるState管理

ローカルStateからS3バックエンドへ移行：

- **S3バケット**: `kanare-terraform-state-bucket`
- **Prod State**: `s3://.../prod/terraform.tfstate`
- **Dev State**: `s3://.../dev/terraform.tfstate`
- **DynamoDB Lock**: `terraform-state-locks`

**理由**:
- バージョニングによる自動バックアップ
- 暗号化による機密情報の保護
- DynamoDB Lockによる同時実行制御
- チーム開発への対応

### 3. 環境変数による命名規則

全リソースに環境変数（`var.env`）を導入：

| 環境 | ドメイン | DynamoDB | Lambda | タグ |
|------|----------|----------|--------|------|
| Prod | note-app.kanare.dev | NotesTable-prod | note-api-handler-prod | env=prod |
| Dev | dev.note-app.kanare.dev | NotesTable-dev | note-api-handler-dev | env=dev |

**理由**:
- リソース名の衝突を防止
- 環境の識別が容易
- コスト配分の明確化

### 4. Lifecycle保護（Prod環境のみ）

本番環境の重要リソースに`prevent_destroy = true`を設定：

- CloudFront Distribution
- ACM証明書（2つ）

**Terraformの制限により保護できないリソース**:
- S3バケット（モジュール経由）
- DynamoDBテーブル（モジュール経由）

**理由**:
- 誤操作による本番停止の防止
- データ損失のリスク軽減
- 開発環境は保護なしで自由に破壊可能

**制限への対応**:
- Terraformの`lifecycle`ブロックでは変数を使用できない
- モジュール経由のリソースには別の保護策を適用
  - S3: バージョニング、MFA Delete
  - DynamoDB: Point-in-time recovery、AWS Backup
  - IAMポリシーでの削除制限

### 5. モジュール設計

共有モジュールは環境間で統一：

**当初の計画**:
- モジュールに`env`変数を追加し、環境固有のlifecycle設定を適用

**実装時の制約**:
- Terraformの`lifecycle`ブロックでは変数を使用できない
- モジュール経由のリソースには環境固有のlifecycle設定を適用不可

**採用した設計**:
- モジュールは環境非依存に保つ
- 環境固有の保護は、直接定義するリソース（CloudFront、ACM証明書）のみに適用
- モジュール経由のリソースは、AWS側の機能（バージョニング、バックアップ等）で保護

**理由**:
- Terraformの仕様制限に対応
- モジュールの再利用性を維持
- 実用的な保護策を組み合わせ

## 実装詳細

### Backend Setup

初回のみ実行するセットアップディレクトリを作成：

```bash
cd terraform/backend-setup
terraform init
terraform apply
```

これにより以下が作成される：
- S3バケット（バージョニング、暗号化有効）
- DynamoDBテーブル（State Lock用）

### マイグレーション手順

1. **Backend Setupの実行**
2. **Prod環境の準備**
   - 既存の`dev`ディレクトリを`prod`にコピー
   - Backend設定を追加
   - `terraform init -migrate-state`でStateを移行
   - `terraform plan`で差分なしを確認
3. **Dev環境の新規構築**
   - ドメイン、リソース名を変更
   - 新規Stateで`terraform apply`

詳細: [terraform/MIGRATION_GUIDE.md](../terraform/MIGRATION_GUIDE.md)

## 結果

### 成功指標

✅ **達成済み**:
- Prod環境の既存リソースを無停止で維持
- Dev環境を完全に新規構築
- State完全分離（S3の異なるキー）
- 環境ごとの保護レベル設定

### メリット

1. **安全性の向上**
   - 本番環境への誤操作を防止
   - Lifecycle保護による追加の安全策
   - Stateのバックアップとバージョニング

2. **開発効率の向上**
   - Dev環境で自由にテスト可能
   - 変更を本番適用前に検証
   - 環境間の影響を完全に排除

3. **運用性の向上**
   - 環境の識別が容易
   - コスト配分の明確化
   - トラブルシューティングの簡素化

4. **チーム開発への対応**
   - State Lockによる競合防止
   - S3による中央管理
   - 環境ごとの責任範囲の明確化

### デメリットと対策

| デメリット | 対策 |
|-----------|------|
| 管理するリソースが2倍 | 共有モジュールで設定を統一 |
| 初期セットアップの複雑化 | MIGRATION_GUIDEで詳細な手順を提供 |
| State管理コストの増加 | S3とDynamoDBは低コスト（月数ドル） |
| 環境間の設定差分 | 環境変数で差分を最小化 |

## 代替案

### 1. Terraform Workspace

**却下理由**:
- 同じStateファイル内で環境を切り替え
- 誤って`terraform destroy`を実行するリスク
- 環境間の完全な分離が難しい

### 2. 複数AWSアカウント

**却下理由**:
- アカウント管理の複雑化
- コストの増加（リソース重複、データ転送費用）
- 学習プロジェクトには過剰

### 3. 環境変数のみで区別（単一ディレクトリ）

**却下理由**:
- State管理の観点で不十分
- 環境切り替え時のミスのリスク
- backend設定を環境ごとに変えられない

## 参考資料

- [Terraform Best Practices - Environment Separation](https://www.terraform-best-practices.com/environment-separation)
- [HashiCorp Terraform Backends](https://developer.hashicorp.com/terraform/language/settings/backends/s3)
- [AWS Well-Architected Framework - OPS08](https://docs.aws.amazon.com/wellarchitected/latest/framework/ops_dev_integ_multi_env.html)

## 関連ドキュメント

- [terraform/MIGRATION_GUIDE.md](../terraform/MIGRATION_GUIDE.md) - 詳細な移行手順
- [terraform/README.md](../terraform/README.md) - Terraform構成の概要
- [terraform/environments/prod/README.md](../terraform/environments/prod/README.md) - Prod環境ガイド
- [terraform/environments/dev/README.md](../terraform/environments/dev/README.md) - Dev環境ガイド

## 更新履歴

- 2025-12-28: ADR作成、Dev/Prod環境分離の実装完了
