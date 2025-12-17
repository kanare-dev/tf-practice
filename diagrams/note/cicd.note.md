# cicd.note.md

cicd.drawio, cicd.svg 用の設計意図・補足説明メモです。

---

## 目的

本ファイルは `cicd.drawio` で作成する CI/CD フロー図の設計意図、構成要素、補足説明・注意点を書くためのメモです。

---

## 図の内容案

- Developer → GitHub → GitHub Actions
  - terraform fmt, validate, plan までは自動
  - 手動で terraform apply → AWS リソース反映（安全運用）
- CI/CD 全体フローのパス・分岐や、参照する他のスクリプト(config,workflow)の説明
- Phase2 以降 CodePipeline/CodeBuild, PR ブランチ運用の追加なども注記

---

## リンク

- `ci-cd/.github/workflows/terraform.yml` ... GitHub Actions 定義
- `ci-cd/aws/buildspec.yml` ... CodeBuild 用定義

---

## 補足

- Apply 前の承認・本番適用/検証環境の違いなども将来記載予定
