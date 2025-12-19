# ADR-0002: S3 静的サイトの HTTPS 化に CloudFront+ACM を利用

## Status

| Proposed | Accepted | Deprecated | Superseded |
| -------- | -------- | ---------- | ---------- |
|          | ☑︎       |            |            |

## Context

- 個人ドメイン(kanare.dev)を Cloudflare で DNS 管理している。
- ルートドメイン(kanare.dev)に HSTS(includeSubDomains)設定があるため、サブドメイン(note-app.kanare.dev)も HTTPS 接続が強制されている。
- AWS S3 静的ウェブサイトホスティングは HTTP のみ対応で、HTTPS(および HSTS 下での接続)に対応していない。
- そのため、note-app.kanare.dev を S3 WebsiteEndpoint に CNAME(DNS only)で向けても正常に表示できなかった（HTTPS アクセスを強制されるため）。

## Decision

- CloudFront(オリジン: S3 WebsiteEndpoint)を用いて note-app.kanare.dev の HTTPS 公開を行う。
- ACM で note-app.kanare.dev 用 SSL 証明書(us-east-1)を発行し、CloudFront ディストリビューションに適用する。
- Cloudflare 側 DNS 設定は note-app.kanare.dev→CloudFront エンドポイント(CNAME, DNS only)とする。
- S3 バケットポリシーは CloudFront 経由のみアクセス許可、直アクセス禁止推奨。
- "S3 バケットを CloudFront のオリジンとして "バケットモード" ではなく、"S3 静的ウェブサイトエンドポイント" を指定することで SPA(Single Page Application)のルーティングやカスタムエラーページにも対応する。

## Consequences

### Positive

- サブドメイン含む HTTPS 強制・HSTS 下でも安定して SPA サイトを配信可能
- ACM+CloudFront により証明書自動更新・低コストな SSL 運用
- S3 静的公開のコストパフォーマンスを維持しつつ安全な HTTPS 運用が可能

### Negative

- CloudFront, ACM の追加設定作業が必要
- HTTPS 証明書発行のため us-east-1 リージョンアクションが必要(AWS 証明書管理の都合)
- S3→CloudFront 間のパーミッション制御（直アクセス遮断）が若干複雑

### Neutral

- 今後カスタムエラーページやキャッシュ最適化など CloudFront の高度な設定活用が可能となる
