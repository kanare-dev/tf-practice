# cicd.note.md

cicd.drawio および cicd.png 用の設計メモ・意図説明です。

---

## 目的

本ファイルは `cicd.drawio` で作成した「CI/CD パイプライン構成図」の設計メモです。
GitHub Actions による GitOps フロー（PR → plan、main マージ → apply）を図解しています。

---

## 図の構成

図は上下 2 つのフローで構成されています。

### 上段：PR 時のフロー

```
Developer
  | PR 作成
  v
GitHub
  |
  v
GitHub Actions
  |
  v
Terraform（fmt → validate → plan）
  |
  | comment
  v
GitHub（PR コメントに差分を表示）
```

- PR を作成すると GitHub Actions が自動で起動
- `fmt`（フォーマットチェック）→ `validate`（構文検証）→ `plan`（変更計画）を順に実行
- plan の結果は PR コメントとして自動投稿され、レビュアーが差分を確認できる
- dev / prod 両環境の plan を並列実行し、両方の差分がコメントに表示される

### 下段：main マージ時のフロー

```
Developer
  | Merge
  v
GitHub
  |
  v
GitHub Actions
  |
  v
Terraform（fmt → validate → plan）
  |
  +──────────────────────→ Terraform apply ──→ AWS Cloud / dev
  |                         （自動）             └── Lambda
  |                                              └── DynamoDB
  |                                              └── CloudFront
  v
手動承認（GitHub Environment: production）
  |
  v
Terraform apply ──→ AWS Cloud / prod
（承認後）            └── Lambda
                      └── DynamoDB
                      └── CloudFront
```

- main マージ後、plan が成功すると dev 環境へ自動 apply
- dev の apply 完了後、GitHub Environment の Required Reviewers に承認通知が届く
- 承認者が GitHub Actions 画面で "Approve and deploy" をクリックすると prod への apply が実行される
- prod への apply は必ず人間の承認を経るため、意図しない本番変更を防止できる

---

## 設計上のポイント

### dev → prod の順序保証

CI/CD パイプラインは `apply-dev` → `apply-prod` の依存関係を持つよう設定されており、
dev の apply が成功しない限り prod の承認フローは開始されない。

### plan を apply 直前に再実行する理由

PR 時の plan 結果を使い回さず、apply ジョブ内で改めて `terraform apply -auto-approve` を実行している。
これは PR レビュー中に他の変更が main にマージされた場合のドリフトを防ぐためである。

### GitHub Environment による承認ゲート

`environment: production` を GitHub Actions ジョブに設定することで、
GitHub の Environment Protection Rules（Required Reviewers）が自動的に適用される。
承認者には GitHub UI とメールで通知が届き、Actions 画面から承認 / 拒否が可能。

---

## 図で使用しているアイコン

| アイコン | 意味 |
|----------|------|
| GitHub ロゴ | GitHub リポジトリ / PR / Actions トリガー |
| GitHub Actions ロゴ | CI/CD ジョブの実行環境 |
| Terraform ロゴ | fmt / validate / plan / apply の実行 |
| 人物アイコン | Developer（操作者）または手動承認者 |
| Lambda アイコン | AWS Lambda 関数 |
| DynamoDB アイコン | Amazon DynamoDB テーブル |
| CloudFront アイコン | Amazon CloudFront ディストリビューション |
| AWS Cloud 枠 | AWS 上のリソース群（dev / prod を点線で分離） |
