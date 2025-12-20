# サーバーレス開発：ステップバイステップ構築ガイド

> このドキュメントは「パーソナルノート/メモアプリ」を AWS サーバーレスで段階的に開発する際の“分かりやすい進め方”をまとめたものです。

---

## 推奨ステップと理由

### 1. S3（静的ウェブホスティング）

- **目的:** UI 入口を構築。「Web ページが公開されている」実感・体験を得る
- **やること:** S3 バケット作成・ホスティング有効化、index.html アップロード、ポリシー設定
- **学べること:** クラウドストレージの基礎・公開権限・outputs の活用

### 2. API Gateway + Lambda

- **目的:** サーバーレス API の基本連携。「バックエンド（API）が動く」体験
- **やること:** REST エンドポイント公開、Lambda 関数実装・Terraform 連携
- **学べること:** API 化、Gateway/Lambda の繋がり、event/response 構造

### 3. DynamoDB

- **目的:** データの保存・取得。「ノートが永続化される」仕組み理解
- **やること:** テーブル定義・CRUD 用 IAM 権限設定、Lambda との連携
- **学べること:** NoSQL 設計、ロール/ポリシー思想

### 4. Cognito（認証）

- **目的:** 認証付きサービス。「ユーザーログイン＝自分だけのノート体験」
- **やること:** ユーザープール作成、API Gateway&Lambda 統合（Cognito 認証トークン経由）
- **学べること:** サーバーレス認証・JWT・認可フロー

---

## 進行順のポイント

- “見える化”を優先：「まず実体験 →API→ データ → 認証」の段階で挫折しにくい
- 拡張も自由：MVP 後にタグ検索やファイル添付もこの手順に自然に追加できる
- それぞれの章で「どんな Terraform リソースを書くか」記録・サンプルも添付していくとさらに有用

---

## 次にやるべきこと（現状進捗・ステータス管理）

現状（2025/12/20 時点）：

- S3（静的ホスティング）＋ CloudFront ＋ ACM（HTTPS 配信）は構築済み
- ドキュメントやコードベースと状態は整合がとれています

今後の推奨進行順：

**1. API Gateway + Lambda サーバレス API 追加**

- Terraform の modules/api-gateway, modules/lambda を使い
- Lambda 関数（例: lambda-functions/api-handler.py）をノート CRUD（／notes エンドポイント）用に実装
- API Gateway/Lambda 公開。apply 後 outputs で URL 確認

**2. DynamoDB テーブル新設・Lambda 統合**

- modules/dynamodb でテーブルを定義、Lambda 側の IAM 権限を調整
- Lambda から DynamoDB への CRUD 実装／テスト

**3. 認証（Cognito User Pool）**

- modules/cognito を使い Cognito ユーザープール作成
- API Gateway へ Cognito 認可設定、Lambda/API と連携

**4. フロントから API 連携・認証 UI**

- frontend/public/ もしくは src/ から API Gateway エンドポイントへのアクセス実装
- 認証トークン管理・セッション制御含む

**5. CI/CD・タグ・Secrets 管理・本番対応など運用強化**

このステップで進めていくことを推奨します。

---

## API Gateway + Lambda 疎通テスト例

Terraform apply 後、以下のような curl コマンドで API の動作を確認できます（エンドポイント URL は outputs や AWS コンソールから取得）。

```bash
# ノート一覧取得
curl https://api.note-app.kanare.dev/notes

# ノート新規作成
curl -X POST https://api.note-app.kanare.dev/notes \
  -H "Content-Type: application/json" \
  -d '{"title":"test note","content":"内容"}'

# ノート詳細取得
curl https://api.note-app.kanare.dev/notes/abc123

# ノート更新
curl -X PUT https://api.note-app.kanare.dev/notes/abc123 \
  -H "Content-Type: application/json" \
  -d '{"title":"更新タイトル","content":"更新内容"}'

# ノート削除
curl -X DELETE https://api.note-app.kanare.dev/notes/abc123
```

> ※ <your-api-id> は実際の API Gateway の ID または terraform output で確認した URL に読み替えてください。

## 実践 Tips

- 1 ステップ進めたごとに AWS 管理コンソールで挙動を直接確認・失敗したら原因究明
- “VPC（ネットワーク）”は**不要**。サーバーレスの良さを最初に 100%活かす
- 構成図・各サービスの役割もこの進め方通り docs/diagrams/…で順次追記していくと理解が深まる

---

> 詳細例・サンプルコードや Terraform 記述例は、各章や README、図解（diagrams/）も併用して参照してください。
