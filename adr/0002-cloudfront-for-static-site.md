# ADR-0002: S3静的サイトのHTTPS化にCloudFront+ACMを利用

## Status
| Proposed | Accepted | Deprecated | Superseded |
| -------- | -------- | ---------- | ---------- |
|          |   ☑︎     |            |            |

## Context
- 個人ドメイン(kanare.dev)をCloudflareでDNS管理している。
- ルートドメイン(kanare.dev)にHSTS(includeSubDomains)設定があるため、サブドメイン(note-app.kanare.dev)もHTTPS接続が強制されている。
- AWS S3静的ウェブサイトホスティングはHTTPのみ対応で、HTTPS(およびHSTS下での接続)に対応していない。
- そのため、note-app.kanare.devをS3 WebsiteEndpointにCNAME(DNS only)で向けても正常に表示できなかった（HTTPSアクセスを強制されるため）。

## Decision
- CloudFront(オリジン: S3 WebsiteEndpoint)を用いてnote-app.kanare.devのHTTPS公開を行う。
- ACMでnote-app.kanare.dev用SSL証明書(us-east-1)を発行し、CloudFrontディストリビューションに適用する。
- Cloudflare側DNS設定はnote-app.kanare.dev→CloudFrontエンドポイント(CNAME, DNS only)とする。
- S3バケットポリシーはCloudFront経由のみアクセス許可、直アクセス禁止推奨。
- "S3バケットをCloudFrontのオリジンとして "バケットモード" ではなく、"S3静的ウェブサイトエンドポイント" を指定することでSPA(Single Page Application)のルーティングやカスタムエラーページにも対応する。

## Consequences
### Positive
- サブドメイン含むHTTPS強制・HSTS下でも安定してSPAサイトを配信可能
- ACM+CloudFrontにより証明書自動更新・低コストなSSL運用
- S3静的公開のコストパフォーマンスを維持しつつ安全なHTTPS運用が可能

### Negative
- CloudFront, ACMの追加設定作業が必要
- HTTPS証明書発行のためus-east-1リージョンアクションが必要(AWS証明書管理の都合)
- S3→CloudFront間のパーミッション制御（直アクセス遮断）が若干複雑

### Neutral
- 今後カスタムエラーページやキャッシュ最適化などCloudFrontの高度な設定活用が可能となる

