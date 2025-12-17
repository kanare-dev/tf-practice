# diagrams/ （システム構成図ディレクトリ）

このフォルダはシステム全体・CI/CD・データモデル等の各種図面とその設計メモを管理します。

## サブディレクトリ構成

- drawio/ ... 元データ(drawio形式)編集用
- svg/ ... 公開/埋込/配布用のSVG形式
- note/ ... 各図ファイルの設計意図・メモ(md)
- README.md ... 一覧・運用ルール・各図用途まとめ

## 管理例

| 図の種類      | 編集元          | 公開用         | メモ                                     |
|:------------- |:--------------- |:--------------|:----------------------------------------- |
| システム全体  | drawio/overview.drawio  | svg/overview.svg  | note/overview.note.md  |
| CI/CD         | drawio/cicd.drawio      | svg/cicd.svg       | note/cicd.note.md       |
| DB/データ構造 | drawio/db.drawio        | svg/db.svg         | note/db.note.md         |

- 図を追加・更新の場合は必ず該当するメモも同期・記述してください。

---

## 命名・運用ガイド
- 編集は drawio/* → SVG書出し(svg/*)・意図や設計note(各note/*)の順がおすすめ
- メンバー・保守担当者はまずREADMEとメモから意図・使い方・凡例を確認
