# Draw.io ダイアグラム

このディレクトリには、アーキテクチャ設計図を Draw.io 形式で保存します。

## ダイアグラム一覧

### 1. MVP Architecture (mvp-architecture.drawio)

MVP のアーキテクチャ図。

**作成手順:**

1. [draw.io](https://app.diagrams.net/) または Draw.io Desktop を開く
2. 新規ファイルを作成
3. 以下の AWS アイコンを使用して図を描画：
   - S3: ストレージアイコン
   - API Gateway: API ゲートウェイアイコン
   - Lambda: Lambda 関数アイコン
   - DynamoDB: データベースアイコン
   - Cognito: 認証アイコン

**構成要素:**

- Web Browser → S3 Bucket (静的ファイル)
- Web Browser → API Gateway → Lambda → DynamoDB
- Web Browser → Cognito User Pool

### 2. Data Flow Diagram (data-flow.drawio)

データフロー図。

### 3. CI/CD Pipeline (cicd-pipeline.drawio)

将来の CI/CD パイプライン図（CodePipeline, CodeBuild）。

## Draw.io での AWS アイコンの取得方法

1. Draw.io を開く
2. 左側のパネルで「More Shapes」をクリック
3. 「AWS19」または「AWS18」を選択
4. 必要な AWS サービスのアイコンが利用可能になります

## 推奨設定

- テンプレート: Blank Diagram
- 形式: XML 形式（.drawio）で保存
- エクスポート: PNG または SVG 形式でもエクスポート可能
