# NudgeMe

優柔不断な人を AI がナッジして意思決定を助ける Web アプリ。

> **Nudge（ナッジ）とは？**
> 行動経済学の概念で、強制せず自然な形で人の行動を望ましい方向へ誘導する仕掛けのこと。
> リチャード・セイラーによって提唱され、2017年のノーベル経済学賞を受賞した理論。

---

## What is NudgeMe?

「どっちにしようかな…」と迷ったとき、NudgeMe があなたの性格タイプを分析し、
AI キャラクターが背中を押してくれます。

- 問題と選択肢を入力する
- あなたの性格タイプに合った AI キャラクター（厳しい / 優しい / スポーティ）が選択する
- 理由付きで決断を提示してくれる
- 過去の決断を振り返り、「後悔した / しなかった」のフィードバックも記録できる

---

## 機能一覧

### MVP
- ユーザー登録・ログイン（JWT認証）
- 性格診断クイズ（初回のみ）
- 問題・選択肢の入力
- AIキャラクター選択（厳しい / 優しい / スポーティ）
- AIによる決断 + 理由の表示
- 決断履歴の保存・閲覧

### 拡張機能（MVP後）
- 後悔フィードバック（後悔した / しなかった）
- 「みんなはどっちを選んだ？」統計
- ランダム決断ボタン
- 性格再診断
- 結果を X（Twitter）にシェア

---

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| バックエンド | Go 1.22+ / Echo v4 |
| フロントエンド | Next.js 15 / TypeScript / Tailwind CSS v4 |
| DB | SQLite（GORM） |
| AI | Claude API（claude-haiku-4-5） |
| 認証 | JWT（HS256） |
| インフラ | AWS EC2 + Nginx + systemd |

---

## アーキテクチャ

```
ブラウザ (Next.js App Router :3000)
    │  /api/v1/* → Next.js rewrites → localhost:8080
    ▼
バックエンド (Go + Echo :8080)
    │  GORM
    ▼
SQLite (nudge.db)

バックエンド ──────────────────→ Anthropic API (claude-haiku-4-5)
```

---

## セットアップ

### 前提条件

- Go 1.22 以上
- Node.js 20 以上
- Anthropic API キー

### 1. バックエンド起動

```bash
cd backend
cp .env.example .env
# .env を編集して ANTHROPIC_API_KEY と JWT_SECRET を設定
go mod tidy
go run main.go
```

### 2. フロントエンド起動

```bash
cd frontend
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

---

## スクリーンショット

*（Coming soon）*

---

## ドキュメント

- [要件定義書](docs/requirements.md)
- [API仕様書](docs/api-spec.md)
- [画面設計書](docs/screen-design.md)
- [インフラ構成](docs/infrastructure.md)
