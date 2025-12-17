# ADR（Architecture Decision Records）ガイド

## ADRとは

ADR（Architecture Decision Records）は、重要なアーキテクチャ設計決定を記録するためのドキュメントです。
将来、なぜその設計決定をしたのかを理解するのに役立ちます。

## ADRの構成

各ADRは以下の構成で記録します：

1. **Status**: 決定の状態（Proposed, Accepted, Deprecated, Superseded）
2. **Context**: 決定が必要になった背景・状況
3. **Decision**: 決定した内容
4. **Consequences**: 決定による影響（Positive, Negative, Neutral）

## ADRの作成タイミング

以下のような重要な決定をした際にADRを作成します：

- 新しい技術スタックの採用
- アーキテクチャパターンの選択
- セキュリティ方針の決定
- コスト最適化の戦略
- スケーラビリティの設計
- データストレージの選択

## ADRテンプレート

新しいADRを作成する際は、`adr/0001-template.md`をコピーして使用してください。

```bash
cp adr/0001-template.md adr/00XX-your-decision-title.md
```

## 既存のADR

- **ADR-0001**: ADR Template
- **ADR-0002**: MVP Architecture - Serverless Web Application

## ベストプラクティス

1. **簡潔に**: 重要なポイントだけを記録
2. **文脈を明確に**: なぜその決定をしたのかを説明
3. **トレードオフを記録**: 選択しなかった代替案とその理由
4. **定期的に見直し**: 状況が変わったらADRを更新

