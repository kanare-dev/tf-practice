# overview.note.md

overview.drawio および overview.svg 用の設計メモ・意図説明です。

---

## 目的

本ファイルは `overview.drawio` で作成する「システム全体アーキテクチャ図（MVP~Phase2 対応）」の設計メモ・意図説明を補助するためのメモです。

---

## 図の内容案

- User (Browser) → S3 Static Web → Cognito → API Gateway (REST, Cognito Authorizer) → Lambda → DynamoDB (NoteTable)
- （Phase2 で S3 ファイル添付, 共有, 検索, etc を注釈や点線枠で追加）
- AWS 公式アイコン推奨 / レイヤーごと色分け / 流れの矢印明確化

---

## 補足ポイント

- Phase2 以降の拡張は図ではグレー/点線で表現
- DynamoDB など各要素の詳細図は専用 drawio/db 図で表現
- README や docs/architecture.md 等への掲載・貼付も想定

---

## 図ラフ例

```
[ User (Browser) ]
        |
        v
[ S3 Static Website ]
        |
        v
[ Amazon Cognito ]
        |
        v
[ API Gateway (REST, Cognito Authorizer) ]
        |
        v
[ AWS Lambda ]
        |
        v
[ DynamoDB (NoteTable) ]
```

---

## TODO/アイディア

- Phase2 以降拡張も順次追記
- drawio の配置アドバイス例もこのメモに溜めて OK
