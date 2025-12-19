# frontend ディレクトリについて

このディレクトリは、サーバーレス・メモアプリのフロントエンド（静的 HTML/JS/CSS や SPA フレームワークなど含む）を格納します。

## デプロイ運用ポリシー（ベストプラクティス）

- S3 Web サイトバケットは Terraform（手動 apply）で管理します。
- サイトの HTML/JS/CSS 等は、**GitHub Actions CI/CD で main や develop への push 時、および手動実行（workflow_dispatch）時にも自動デプロイ（S3 sync）されます。**
- S3 バケットが存在しない場合は、CI 側が Fail しないように deploy-job を**スキップ**する設計です。
- S3 バケットを削除 → 再 apply した場合も、「手動トリガー」で Actions から再デプロイが可能です。

### typical structure

```
frontend/
├── public/      # S3へアップロードする静的ファイル (index.html, style.cssなど)
├── src/         # (必要に応じて) SPAソース(React, Vue, etc)
└── build/       # (ビルド自動生成物。通常git管理は不要)
```

- サンプルや手順は[docs/step-by-step-serverless-dev.md](../docs/step-by-step-serverless-dev.md)も参照。
