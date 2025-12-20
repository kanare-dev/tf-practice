# ADR 0004: Cloudflare Terraform ProviderによるDNS管理の自動化

**Status**: Accepted  
**Date**: 2025-12-20  
**Deciders**: Development Team  
**Technical Story**: インフラ再構築時の手動DNS設定作業の自動化

---

## Context and Problem Statement

現在のシステムでは、`terraform destroy` → `terraform apply` でインフラを再構築する際、以下の手動作業が必要：

1. **ACM証明書検証用のCNAMEレコード設定**（2つ）
   - note-app.kanare.dev 用
   - api.note-app.kanare.dev 用
2. **CloudFront向けCNAMEレコード設定**
3. **API Gateway向けCNAMEレコード設定**

これらの設定は：
- 手動でCloudflareダッシュボードにアクセスして設定する必要がある
- 値が変わる可能性があるため、毎回`terraform output`で確認が必要
- タイポや設定漏れのリスクがある
- 再構築に30-75分かかる（DNS設定待ちを含む）

**問題**: 理想的なCI/CDでは、`destroy` → `apply` だけで完全に復元できるべきだが、現状は手動作業が残っている。

---

## Decision Drivers

- **自動化**: 手動作業を減らし、人為的ミスを防止したい
- **再現性**: 同じコードから同じ環境を確実に構築できるべき
- **時間効率**: 再構築にかかる時間を短縮したい
- **バージョン管理**: DNSレコードもGitで管理し、変更履歴を追跡したい
- **柔軟性**: 必要に応じて手動管理に戻せるようにしたい

---

## Considered Options

### Option 1: 現状維持（手動でCloudflare DNS設定）

**メリット**:
- 追加の学習コストなし
- 既存の運用フローを変更しない
- Cloudflare APIトークンの管理が不要

**デメリット**:
- 毎回手動設定が必要（5つのDNSレコード）
- タイポや設定漏れのリスク
- 再構築に30-75分かかる
- DNSレコードの変更履歴がGitで追跡できない

### Option 2: Cloudflare Terraform Providerを導入（推奨）

**メリット**:
- 完全自動化（`terraform apply`だけで完結）
- DNSレコードもコード管理、バージョン管理可能
- 人為的ミスの防止
- 再構築時間が20-40分に短縮
- 複数環境（dev/staging/prod）の管理が容易

**デメリット**:
- Cloudflare APIトークンの管理が必要
- 初期セットアップに30分程度かかる
- Cloudflare Providerの学習が必要

### Option 3: AWS Route53に移行

**メリット**:
- AWS内で完結
- Terraform管理が容易

**デメリット**:
- Cloudflareから移行するコストが高い
- Cloudflareの機能（CDN、DDoS保護など）が使えなくなる
- ドメイン移管が必要な場合がある

---

## Decision Outcome

**Chosen option**: **Option 2 - Cloudflare Terraform Providerを導入**

**理由**:
- 完全自動化により、理想的なCI/CD環境を実現できる
- DNSレコードのコード管理により、インフラの完全なIaC化を達成
- 人為的ミスのリスクを大幅に削減
- 初期セットアップのコストは一度だけで、長期的には時間効率が向上

**ただし、柔軟性を保つため**:
- `enable_cloudflare_dns` フラグで有効/無効を切り替え可能にする
- デフォルトは `false`（手動管理）とし、オプトイン方式で導入
- 既存の手動運用フローも維持可能にする

---

## Implementation

### 1. Terraform設定の追加

```hcl
terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
```

### 2. 変数定義

```hcl
variable "enable_cloudflare_dns" {
  description = "Enable Cloudflare DNS management via Terraform"
  type        = bool
  default     = false
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for kanare.dev"
  type        = string
  default     = ""
}
```

### 3. DNSレコードのリソース定義

以下のDNSレコードをTerraformで管理：
- ACM証明書検証用CNAMEレコード（note-app用）
- ACM証明書検証用CNAMEレコード（api.note-app用）
- CloudFront向けCNAMEレコード（note-app）
- API Gateway向けCNAMEレコード（api.note-app）

すべて `count = var.enable_cloudflare_dns ? 1 : 0` で制御し、オプショナルにする。

### 4. ドキュメント整備

- `docs/cloudflare-terraform-guide.md`: 導入ガイド
- `docs/rebuild-guide.md`: 再構築手順（手動・自動両対応）
- `terraform/environments/dev/terraform.tfvars.example`: 設定例

---

## Consequences

### Positive

- ✅ インフラの完全なIaC化を達成
- ✅ `terraform destroy` → `terraform apply` で完全復元が可能
- ✅ DNSレコードの変更履歴をGitで管理
- ✅ 人為的ミスのリスクを大幅削減
- ✅ 再構築時間が短縮（30-75分 → 20-40分）
- ✅ 複数環境の管理が容易

### Negative

- ⚠️ Cloudflare APIトークンの管理が必要
  - 対策: `.gitignore`で`*.tfvars`を除外、環境変数での管理を推奨
- ⚠️ State fileにAPIトークンが保存される
  - 対策: S3バックエンドで暗号化+アクセス制御を推奨
- ⚠️ 初期セットアップの手間
  - 対策: 詳細なドキュメントを整備

### Risks and Mitigations

| リスク | 影響 | 対策 |
|--------|------|------|
| APIトークンの漏洩 | 高 | `.gitignore`で除外、環境変数での管理、最小権限の原則 |
| Cloudflare APIの変更 | 中 | Providerのバージョン固定、定期的な更新確認 |
| 既存DNSレコードとの競合 | 中 | `terraform import`での移行、またはフラグでの段階的導入 |

---

## Alternatives Not Chosen

### Option 1（現状維持）を採用しなかった理由

- 手動作業が残ることで、理想的なCI/CDを実現できない
- 長期的には非効率

### Option 3（Route53移行）を採用しなかった理由

- Cloudflareの既存機能（CDN、DDoS保護など）を失う
- 移行コストが高すぎる
- Cloudflare Providerで十分に対応可能

---

## Related Decisions

- [ADR-0002: CloudFrontによる静的サイト配信](0002-cloudfront-for-static-site.md) - ACM証明書の必要性
- [ADR-0003: CloudFront/API Gateway WAF/レート制限ポリシー](0003-cloudfront-api-gateway-policy.md) - セキュリティ設計

---

## References

- [Cloudflare Terraform Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest)
- [Terraform Best Practices - Secrets Management](https://developer.hashicorp.com/terraform/tutorials/configuration-language/sensitive-variables)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)

---

## Notes

- デフォルトで無効（`enable_cloudflare_dns = false`）とし、段階的な導入を可能にする
- 既存の手動運用フローは `docs/rebuild-guide.md` で引き続きサポート
- CI/CD環境では環境変数（`TF_VAR_cloudflare_api_token`）での設定を推奨

