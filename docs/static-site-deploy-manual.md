# 静的サイト S3/CDN ホスティング 操作 & 運用方針マニュアル

このマニュアルは、AWS S3 + CloudFront（+Cloudflare DNS）を利用した静的ウェブサイト公開・再公開（デプロイ）と、公開サブドメインのHTTPS運用設計方針を記録します。

---

## CloudFront + HTTPS/CDN 配信アーキテクチャ設計方針（2025年12月決定）

- S3のWebsiteエンドポイントはHTTPのみであり、HSTSやHTTPS強制下では直で公開できません。
- サブドメイン(例: note-app.kanare.dev)向け静的コンテンツHTTPS配信には、CloudFront + ACM証明書を必ず使用してください。
    - CloudFront オリジン: `S3静的Webサイトエンドポイント` (**バケットモード不可 / SPAやカスタムエラー時に必須**)
    - ACM証明書: サブドメイン用(例: note-app.kanare.dev), バージニア北部(us-east-1)リージョンで発行
    - CloudFrontディストリビューションへ ACMをアタッチ
    - Cloudflare DNS: サブドメイン(CNAME, DNS only) → CloudFront(例: dxxx.cloudfront.net)
- S3バケットのパブリックアクセスはCloudFront経由のみに限定することを推奨
- 詳細な意思決定 rationale/背景/トレードオフについては [`adr/0002-cloudfront-for-static-site.md`](../adr/0002-cloudfront-for-static-site.md) も参照

※以下は従来S3直公開時（HTTP時代）の参考情報。CloudFront移行後は原則として全サブドメインHTTPS配信とすること。

## 1. S3 バケットの新規作成（インフラ側）

1.1. `terraform/environments/dev`（または prod/staging）へ移動します。

```bash
cd terraform/environments/dev
terraform init   # 初回のみ
terraform plan   # 変更内容を確認
terraform apply  # 確認後apply（バケットが作成される）
```

- バケット名やエンドポイントは apply 後の出力や AWS マネジメントコンソールで確認。

---

## 2. 静的サイト（index.html 等）の S3 デプロイ

### 2.1 通常のデプロイ（push 時）

- `frontend/public/` 配下を main/master/develop ブランチへ push → GitHub Actions が自動で S3 へ同期します。
- 静的サイト更新時はこの方法が推奨です。

### 2.2 手動デプロイ（workflow_dispatch）

- S3 バケットを destroy→apply 後 "内容を更新していない" 場合などは、main/master/develop ブランチを push しても Actions が走りません。
- その場合、
  1. GitHub > Actions > Deploy Static Site to S3 を選択
  2. 右上の「Run workflow」ボタンをクリック
  3. これで `frontend/public/` の内容が S3 に再デプロイされます

### 2.3 ローカルから直接手動デプロイ

- aws-cli を設定済みであれば、

```bash
aws s3 sync frontend/public/ s3://（Terraform applyで作られたバケット名）/ --delete
```

- この方法でも即再デプロイできます。

---

## 3. その他の注意点・Tips

- **バケットが未作成・名前違いのときデプロイ Job は自動で SKIP されます。**
- **destroy→apply 後は、必ず上記「2.2 手動デプロイ」または「2.3 ローカル sync」でサイトを再公開してください。**
- 「index.html」だけでなく、 `public/` 配下の画像や css もまとめて同期・公開されます。

---

## よくあるトラブル

- 「AccessDenied」エラー: IAM 権限（s3:PutBucketPolicy 等）や S3 Block Public Access 設定を見直してください。
- バケットポリシー: modules/s3/main.tf 内 public/静的ホスティング設定の制御を確認。
- Website エンドポイント確認: apply 後の outputs、または AWS マネジメントコンソール > S3 > 対象バケット > プロパティ > 静的ウェブサイトホスティング

---

不明点・トラブルは README または docs 全般も参照してください。
