# db.note.md

db.drawio, db.svg 用のデータモデル設計メモです。

---

## 目的

本ファイルは `db.drawio` で作成する DynamoDB（NoteTable）などのデータモデル図の設計意図・主な項目・設計上の留意点を記録する専用メモです。

---

## NoteTable スキーマ例

- userId (PK, Hash Key) : Cognito ユーザー ID (sub)
- noteId (SK, Range Key) : UUID
- title : タイトル
- content : 本文(マークダウン)
- createdAt, updatedAt : タイムスタンプ
- tags : タグ配列

---

## 図ラフ構成例

```
+-----------------------------+
| NoteTable                  |
+---------------------+------+
| userId (PK, Hash)  | S    |
| noteId (SK,Range)  | S    |
| title              | S    |
| content            | S    |
| createdAt          | S    |
| updatedAt          | S    |
| tags (optional)    | List |
+----------------------------+
```

---

## 補足・Phase2 以降

- GSI 設計、検索用フィールド、添付ファイル紐付け等の将来拡張アイディア
- 性能設計・アクセスパターンの工夫はこのメモに随時
