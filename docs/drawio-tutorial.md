# Draw.ioでAWSアーキテクチャ図を作成するチュートリアル

このガイドでは、Draw.ioを使用してAWSアーキテクチャ図を作成する方法を説明します。

## Draw.ioの準備

### オンライン版を使用する場合

1. [draw.io](https://app.diagrams.net/) にアクセス
2. 「Create New Diagram」を選択
3. テンプレートとして「Blank Diagram」を選択

### デスクトップ版を使用する場合

1. [Draw.io Desktop](https://github.com/jgraph/drawio-desktop/releases) をダウンロード・インストール
2. アプリケーションを起動

## AWSアイコンの有効化

1. 左側のパネルで「More Shapes」をクリック
2. 検索ボックスに「AWS」と入力
3. 「AWS19」または「AWS18」をチェック
4. 「Apply」をクリック

これで、左側のパネルにAWSサービスのアイコンが表示されます。

## MVPアーキテクチャ図の作成

### 1. 基本的なレイアウト

以下の順序で図を作成します：

1. **Web Browser**（左側）
   - 一般的な図形 > 四角形を使用
   - 「Web Browser」とラベルを付ける

2. **S3 Bucket**（上部）
   - AWS19 > Storage > Amazon S3 アイコンを使用

3. **API Gateway**（中央）
   - AWS19 > Networking & Content Delivery > Amazon API Gateway アイコンを使用

4. **Lambda**（API Gatewayの右側）
   - AWS19 > Compute > AWS Lambda アイコンを使用

5. **DynamoDB**（Lambdaの下）
   - AWS19 > Database > Amazon DynamoDB アイコンを使用

6. **Cognito**（下部）
   - AWS19 > Security, Identity & Compliance > Amazon Cognito アイコンを使用

### 2. 接続線の追加

- **Web Browser → S3**: 静的ファイルの提供を表す矢印
- **Web Browser → API Gateway**: APIリクエストを表す矢印
- **API Gateway → Lambda**: Lambda統合を表す矢印
- **Lambda → DynamoDB**: データアクセスを表す矢印
- **Web Browser → Cognito**: 認証フローを表す矢印

接続線の追加方法：
1. 図形をクリック
2. 表示される矢印をドラッグして接続先にドロップ
3. 接続線を選択してラベルを追加（オプション）

### 3. ラベルと注釈

- 各図形に適切なラベルを追加
- 接続線に説明を追加（例：「REST API」「Read/Write」）
- グループ化を使用して関連コンポーネントをまとめる

### 4. スタイリング

- 色分け：関連するサービスを同じ色でグループ化
- フォントサイズを統一
- 図のタイトルを追加

## 保存とエクスポート

### Draw.io形式で保存

1. File > Save As
2. ファイル名: `mvp-architecture.drawio`
3. 保存先: `diagrams/` ディレクトリ

### 画像としてエクスポート

1. File > Export As > PNG（または SVG）
2. 解像度を設定（推奨: 300 DPI）
3. ファイル名: `mvp-architecture.png`
4. 保存先: `diagrams/` ディレクトリ

## ベストプラクティス

1. **一貫性**: 同じ図内で同じスタイルを使用
2. **簡潔さ**: 必要最小限の情報を表示
3. **明確さ**: データフローが分かりやすく
4. **更新**: アーキテクチャが変更されたら図も更新

## 参考

- [AWS Architecture Icons](https://aws.amazon.com/architecture/icons/)
- [Draw.io Documentation](https://drawio-app.com/doc/)
- プロジェクトのアーキテクチャ設計: [docs/architecture.md](../docs/architecture.md)

