# インフラ再構築ガイド

このガイドは、`terraform destroy` → `terraform apply` でインフラを再構築する際の完全な手順を説明します。

## 📋 目次

1. [再構築が必要になるケース](#再構築が必要になるケース)
2. [再構築の流れ](#再構築の流れ)
3. [手動設定が必要なもの](#手動設定が必要なもの)
4. [完全自動化する方法](#完全自動化する方法cloudflare-terraform-provider)
5. [トラブルシューティング](#トラブルシューティング)

---

## 再構築が必要になるケース

以下のような状況で、インフラの再構築が必要になることがあります：

- 開発環境のコスト削減のため、一時的にリソースを削除
- Terraformコードの大幅な変更をテストする前のクリーンな状態への復帰
- 別のAWSアカウントやリージョンへの移行
- 設定ミスによる環境の破損からの復旧

---

## 再構築の流れ

### ステップ 1: 現在のインフラを削除

```bash
cd terraform/environments/dev
terraform destroy
```

確認を求められたら `yes` を入力します。

**⚠️ 警告**: このコマンドで以下のリソースが削除されます：
- S3バケット（静的サイトのコンテンツも削除）
- CloudFrontディストリビューション
- API Gateway
- Lambda関数
- DynamoDBテーブル（データも削除）
- ACM証明書

### ステップ 2: Terraformで新しいインフラを構築

```bash
terraform apply
```

確認を求められたら `yes` を入力します。

**所要時間**: 約5-10分（CloudFrontの配布に時間がかかります）

### ステップ 3: Terraform出力を確認

```bash
terraform output
```

**重要な出力項目**:

```
acm_dns_validation_options = [
  {
    resource_record_name = "_1909b08b1f7c8d17ab01d42e1f2847df.note-app.kanare.dev"
    resource_record_value = "_d52409e0db82d3bf23e662767807a171.jkddzztszm.acm-validations.aws."
    # ...
  }
]
cloudfront_domain_name = "d375egkukfoz0c.cloudfront.net"
api_custom_domain_target = "dttzz4rq2asbs.cloudfront.net"
```

これらの値を次のステップで使用します。

---

## 手動設定が必要なもの

### 1. Cloudflare DNSレコードの再設定（必須）

`terraform destroy` → `terraform apply` を実行すると、以下の値が変わる可能性があります：
- ACM証明書の検証トークン
- CloudFrontのドメイン名
- API Gatewayのカスタムドメイン

#### 必要なDNSレコード

Cloudflareダッシュボード（https://dash.cloudflare.com）にログインして、以下のCNAMEレコードを設定：

##### 📌 ACM証明書検証（note-app用）

```bash
# Terraform出力から値を取得
terraform output -json acm_dns_validation_options | jq '.[0]'
```

**設定内容**:
- **Type**: CNAME
- **Name**: `_1909b08b1f7c8d17ab01d42e1f2847df.note-app` （出力から確認）
- **Target**: `_d52409e0db82d3bf23e662767807a171.jkddzztszm.acm-validations.aws` （出力から確認）
- **Proxy status**: DNS only（灰色の雲）
- **TTL**: Auto

##### 📌 ACM証明書検証（api.note-app用）

API Gateway用の証明書も同様に設定します。

**Terraform出力の確認**:
```bash
terraform output -json | jq '.api_custom_domain_target'
```

**設定内容**:
- **Type**: CNAME
- **Name**: `_3f0866a96a4e3dba7a67572afa6e8a96.api.note-app` （新しい値を確認）
- **Target**: `_e24dabb24edd0176fcf62fc817d6300d.jkddzztszm.acm-validations.aws` （新しい値を確認）
- **Proxy status**: DNS only
- **TTL**: Auto

##### 📌 CloudFront（静的サイト）

```bash
terraform output -raw cloudfront_domain_name
```

**設定内容**:
- **Type**: CNAME
- **Name**: `note-app`
- **Target**: `d375egkukfoz0c.cloudfront.net` （上記コマンドで取得）
- **Proxy status**: DNS only
- **TTL**: Auto

##### 📌 API Gatewayカスタムドメイン

```bash
terraform output -raw api_custom_domain_target
```

**設定内容**:
- **Type**: CNAME
- **Name**: `api.note-app`
- **Target**: `dttzz4rq2asbs.cloudfront.net` （上記コマンドで取得）
- **Proxy status**: DNS only
- **TTL**: Auto

#### DNS設定の確認

```bash
# 設定が反映されたか確認（数分かかる場合があります）
dig note-app.kanare.dev CNAME
dig api.note-app.kanare.dev CNAME
```

### 2. 静的サイトのコンテンツを再アップロード（必須）

S3バケットが空の状態で作成されるため、フロントエンドのビルド成果物を再アップロードする必要があります。

#### Option A: GitHub Actionsで自動デプロイ（推奨）

1. GitHubリポジトリにアクセス
2. **Actions** タブをクリック
3. **Deploy Static Site to S3** ワークフローを選択
4. **Run workflow** ボタンをクリック
5. ブランチを選択（通常は `main`）
6. **Run workflow** をクリック

#### Option B: ローカルから手動アップロード

```bash
# フロントエンドのビルド（まだの場合）
cd frontend
npm install
npm run build

# S3にアップロード
cd ..
aws s3 sync frontend/dist/ s3://note-app.kanare.dev/ --delete
```

**確認**:
```bash
curl -I https://note-app.kanare.dev/
# HTTP/2 200 が返ってくればOK
```

### 3. ACM証明書の検証待ち

CloudflareにDNSレコードを設定した後、ACM証明書の検証が完了するまで待ちます。

**確認方法**:
```bash
# AWS CLIで証明書のステータスを確認
aws acm list-certificates --region us-east-1

# または、マネジメントコンソールで確認
# Certificate Manager > リージョン: us-east-1 > 証明書一覧
```

**ステータス**:
- `PENDING_VALIDATION`: DNS設定待ち（Cloudflareで設定してください）
- `ISSUED`: 検証完了（使用可能）

通常、DNSレコード設定後**5-30分**で検証が完了します。

---

## 完全自動化する方法（Cloudflare Terraform Provider）

手動でのDNS設定を避け、完全に自動化するには**Cloudflare Terraform Provider**を使用します。

詳細は **[Cloudflare Terraform導入ガイド](cloudflare-terraform-guide.md)** を参照してください。

### 簡易手順

1. Cloudflare APIトークンを取得
2. `terraform.tfvars`に設定を追加
3. `terraform apply`で自動的にDNSレコードが設定される

**メリット**:
- ✅ `terraform destroy` → `terraform apply` で完全復元
- ✅ DNSレコードのバージョン管理
- ✅ 人為的ミスの防止

---

## トラブルシューティング

### エラー: "Certificate validation timeout"

**原因**: ACM証明書の検証が完了していない

**対処法**:
1. CloudflareのDNSレコードが正しく設定されているか確認
2. DNSの伝播を待つ（最大30分）
3. Cloudflareで "Proxy status" が **DNS only** になっているか確認

### エラー: "CloudFront distribution not accessible"

**原因**: CloudFrontディストリビューションがまだ配布中

**対処法**:
```bash
# CloudFrontのステータスを確認
aws cloudfront list-distributions --query "DistributionList.Items[].{Id:Id,Status:Status}"
```

ステータスが `Deployed` になるまで待ちます（5-15分）。

### エラー: "S3 bucket is empty"

**原因**: 静的サイトのコンテンツが再アップロードされていない

**対処法**:
```bash
# GitHub Actionsで再デプロイ
# または
aws s3 sync frontend/dist/ s3://note-app.kanare.dev/ --delete
```

### エラー: "API Gateway returns 403 Forbidden"

**原因**: カスタムドメインのマッピングが完了していない、またはDNS設定が未完了

**対処法**:
1. API Gatewayカスタムドメインが作成されているか確認
2. CloudflareのDNSレコード（`api.note-app`）が正しく設定されているか確認
3. DNS伝播を待つ

---

## ✅ 再構築完了チェックリスト

再構築が完全に完了したか確認するためのチェックリスト：

- [ ] `terraform apply` が成功した
- [ ] CloudflareにACM証明書検証用CNAMEレコードを設定した（2つ）
- [ ] Cloudflareに`note-app`のCNAMEレコードを設定した
- [ ] Cloudflareに`api.note-app`のCNAMEレコードを設定した
- [ ] ACM証明書のステータスが `ISSUED` になった
- [ ] 静的サイトのコンテンツをS3に再アップロードした
- [ ] `https://note-app.kanare.dev/` にアクセスできる
- [ ] `https://api.note-app.kanare.dev/notes` が応答する
- [ ] DynamoDBテーブルが作成されている
- [ ] Lambda関数が正常に動作する

---

## 📊 再構築の所要時間（目安）

| ステップ | 所要時間 |
|---------|---------|
| `terraform destroy` | 5-10分 |
| `terraform apply` | 5-10分 |
| Cloudflare DNS設定（手動） | 5分 |
| ACM証明書検証完了待ち | 5-30分 |
| CloudFront配布完了待ち | 5-15分 |
| 静的サイト再デプロイ | 2-5分 |
| **合計** | **30-75分** |

**Cloudflare Terraform Providerを使用する場合**:
- DNS設定が自動化されるため、**20-40分**に短縮可能

---

## 🔄 定期的な再構築の推奨

開発環境では、以下の目的で定期的に再構築することを推奨します：

1. **コスト管理**: 夜間や週末にリソースを削除してコストを削減
2. **Terraformコードの検証**: インフラのコード化が正しく動作するか確認
3. **クリーンな環境**: 不要なリソースや設定が蓄積しないようにする

---

## 📚 関連ドキュメント

- [Cloudflare Terraform導入ガイド](cloudflare-terraform-guide.md) - DNS設定の完全自動化
- [デプロイガイド](deployment-guide.md) - 初回デプロイの手順
- [静的サイトデプロイマニュアル](static-site-deploy-manual.md) - S3へのファイルアップロード方法

---

**更新日**: 2025年12月20日  
**バージョン**: 1.0











