# ADR-0004: Cloudflare Terraform Provider による DNS 管理の自動化

## Status

| Proposed | Accepted | Deprecated | Superseded |
| -------- | -------- | ---------- | ---------- |
|          | ☑︎       |            |            |

Date: 2025-12-20

## Context

現在のシステムでは、`terraform destroy` → `terraform apply` でインフラを再構築する際、以下の手動作業が必要でした：

1. **ACM 証明書検証用の CNAME レコード設定**（2つ）
   - note-app.kanare.dev 用
   - api.note-app.kanare.dev 用
2. **CloudFront 向け CNAME レコード設定**
3. **API Gateway 向け CNAME レコード設定**

### 問題点

- 手動で Cloudflare ダッシュボードにアクセスして設定する必要がある
- 値が変わる可能性があるため、毎回 `terraform output` で確認が必要
- タイポや設定漏れのリスクがある
- 再構築に 30-75 分かかる（DNS 設定待ちを含む）
- DNSレコードの変更履歴がGitで追跡できない

### 検討した選択肢

1. **現状維持**（手動で Cloudflare DNS 設定）
2. **Cloudflare Terraform Provider を導入**（推奨）
3. **AWS Route53 に移行**

## Decision

**Cloudflare Terraform Provider を導入**し、DNS レコード管理を完全に自動化します。

### 採用理由

- 完全自動化により、理想的な CI/CD 環境を実現できる
- DNS レコードのコード管理により、インフラの完全な IaC 化を達成
- 人為的ミスのリスクを大幅に削減
- 初期セットアップのコストは一度だけで、長期的には時間効率が向上

### 柔軟性の確保

- `enable_cloudflare_dns` フラグで有効/無効を切り替え可能
- デフォルトは `false`（手動管理）とし、オプトイン方式で導入
- 既存の手動運用フローも維持可能

### 主な実装内容

**管理する DNS レコード：**
- ACM 証明書検証用 CNAME レコード（note-app 用）
- ACM 証明書検証用 CNAME レコード（api.note-app 用）
- CloudFront 向け CNAME レコード（note-app）
- API Gateway 向け CNAME レコード（api.note-app）

**必要な変数：**
- `cloudflare_api_token`: Cloudflare API トークン
- `cloudflare_zone_id`: kanare.dev の Zone ID
- `enable_cloudflare_dns`: DNS 管理の有効/無効

すべてのリソースは `count = var.enable_cloudflare_dns ? 1 : 0` で制御し、オプショナルにします。

## Consequences

### Positive

- インフラの完全な IaC 化を達成
- `terraform destroy` → `terraform apply` で完全復元が可能
- DNS レコードの変更履歴を Git で管理
- 人為的ミスのリスクを大幅削減
- 再構築時間が短縮（30-75 分 → 20-40 分）
- 複数環境の管理が容易

### Negative

- Cloudflare API トークンの管理が必要
  - 対策: `.gitignore` で `*.tfvars` を除外、環境変数での管理を推奨
- State file に API トークンが保存される
  - 対策: S3 バックエンドで暗号化+アクセス制御を推奨
- 初期セットアップに 30 分程度かかる
  - 対策: 詳細なドキュメント（`docs/cloudflare-terraform-guide.md`）を整備

### Neutral

- デフォルトで無効（`enable_cloudflare_dns = false`）とし、段階的な導入を可能にする
- CI/CD 環境では環境変数（`TF_VAR_cloudflare_api_token`）での設定を推奨
- AWS Route53 への移行は、Cloudflare の既存機能（CDN、DDoS 保護など）を失うため採用しない

### 参考資料

- [Cloudflare Terraform Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest)
- [Terraform Best Practices - Secrets Management](https://developer.hashicorp.com/terraform/tutorials/configuration-language/sensitive-variables)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)

### 関連決定

- [ADR-0002: CloudFront による静的サイト配信](0002-cloudfront-for-static-site.md) - ACM 証明書の必要性
- [ADR-0003: CloudFront と API Gateway の設計方針](0003-cloudfront-api-gateway-policy.md) - アーキテクチャ設計
