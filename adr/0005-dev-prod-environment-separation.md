# ADR-0005: Dev/Prod 環境分離の実装

## Status

| Proposed | Accepted | Deprecated | Superseded |
| -------- | -------- | ---------- | ---------- |
|          | ☑︎       |            |            |

Date: 2025-12-28

## Context

当初、このプロジェクトは単一の `terraform/environments/dev` ディレクトリでインフラを管理しており、実際には本番環境（note-app.kanare.dev）が稼働していました。

### 問題点

1. **本番環境の脆弱性**: `terraform apply` の失敗や誤操作により本番サービスが停止するリスク
2. **テスト環境の欠如**: 新しい変更を安全にテストする環境がない
3. **State 管理の問題**: ローカル State ファイルは単一障害点となり、チーム開発での競合リスクがある
4. **環境の混同**: dev という名前だが実際には本番環境という混乱

### 要件

- 単一 AWS アカウント内で実現（コスト削減）
- 本番環境の既存リソースを維持（destroy/recreate なし）
- 開発環境は自由に破壊・再構築可能
- Terraform State の安全な管理
- 環境間の完全な分離

### 検討した代替案

1. **Terraform Workspace**: 同じ State ファイル内で環境を切り替え → 誤操作リスクが高い
2. **複数 AWS アカウント**: アカウント管理の複雑化、コストの増加 → 学習プロジェクトには過剰
3. **環境変数のみで区別（単一ディレクトリ）**: State 管理の観点で不十分、backend 設定を環境ごとに変えられない

## Decision

**ディレクトリ構成による環境分離**と **S3 バックエンドによる State 管理**を採用します。

### ディレクトリ構成

```
terraform/
├── backend-setup/          # State管理用リソース（初回のみ）
├── environments/
│   ├── prod/              # 本番環境
│   └── dev/               # 開発環境
└── modules/               # 共有モジュール
```

各環境（`dev`/`prod`）は独立した設定を持ち、State も完全に分離されます。

### 環境変数による命名規則

全リソースに環境変数（`var.env`）を導入し、リソース名の衝突を防止：

| 環境 | ドメイン | DynamoDB | Lambda | タグ |
|------|----------|----------|--------|------|
| Prod | note-app.kanare.dev | NotesTable-prod | note-api-handler-prod | env=prod |
| Dev | dev.note-app.kanare.dev | NotesTable-dev | note-api-handler-dev | env=dev |

### S3 バックエンドによる State 管理

- **S3 バケット**: `kanare-terraform-state-bucket`
- **Prod State**: `s3://.../prod/terraform.tfstate`
- **Dev State**: `s3://.../dev/terraform.tfstate`
- **DynamoDB Lock**: `terraform-state-locks`

バージョニング、暗号化、DynamoDB Lock による同時実行制御を実装。

### Lifecycle 保護（Prod 環境のみ）

本番環境の重要リソースに `prevent_destroy = true` を設定：
- CloudFront Distribution
- ACM 証明書（2つ）

**Terraform の制限により保護できないリソース**（モジュール経由）：
- S3 バケット → バージョニング、MFA Delete で対応
- DynamoDB テーブル → Point-in-time recovery、AWS Backup で対応

### モジュール設計

モジュールは環境非依存に保ち、再利用性を維持します。環境固有の保護は、直接定義するリソース（CloudFront、ACM 証明書）のみに適用し、モジュール経由のリソースは AWS 側の機能（バージョニング、バックアップ等）で保護します。

## Consequences

### Positive

- **安全性の向上**: 本番環境への誤操作を防止、Lifecycle 保護、State のバックアップとバージョニング
- **開発効率の向上**: Dev 環境で自由にテスト可能、変更を本番適用前に検証、環境間の影響を完全に排除
- **運用性の向上**: 環境の識別が容易、コスト配分の明確化、トラブルシューティングの簡素化
- **チーム開発への対応**: State Lock による競合防止、S3 による中央管理

### Negative

- 管理するリソースが2倍になる
  - 対策: 共有モジュールで設定を統一
- 初期セットアップの複雑化
  - 対策: `terraform/MIGRATION_GUIDE.md` で詳細な手順を提供
- State 管理コストの増加
  - 対策: S3 と DynamoDB は低コスト（月数ドル）

### Neutral

- 詳細な移行手順は `terraform/MIGRATION_GUIDE.md` を参照
- Terraform の `lifecycle` ブロックでは変数を使用できないため、モジュール経由のリソースには別の保護策を適用
- 環境間の設定差分は環境変数で最小化

### 参考資料

- [Terraform Best Practices - Environment Separation](https://www.terraform-best-practices.com/environment-separation)
- [HashiCorp Terraform Backends](https://developer.hashicorp.com/terraform/language/settings/backends/s3)
- [AWS Well-Architected Framework - OPS08](https://docs.aws.amazon.com/wellarchitected/latest/framework/ops_dev_integ_multi_env.html)

### 関連ドキュメント

- [terraform/MIGRATION_GUIDE.md](../terraform/MIGRATION_GUIDE.md) - 詳細な移行手順
- [terraform/README.md](../terraform/README.md) - Terraform 構成の概要
