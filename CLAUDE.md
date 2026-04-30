# CLAUDE.md — NudgeMe プロジェクト作業ルール

このファイルは Claude Code がこのリポジトリで作業する際に必ず従うルールを定義します。

---

## プロジェクト概要

NudgeMe は優柔不断な人を AI（Claude Haiku）がナッジして意思決定を助ける Web アプリ。
行動経済学の「ナッジ（Nudge）」概念に基づき、ユーザーの性格タイプに合わせた AI キャラクターが
選択肢から最適な決断を提示する。

---

## 技術スタック

| レイヤー | 技術 |
|----------|------|
| バックエンド | Go + Echo フレームワーク |
| フロントエンド | Next.js 15 (TypeScript, App Router) |
| DB | SQLite（GORM 経由） |
| AI | Claude API（claude-haiku-4-5） |
| 認証 | JWT（HS256） |
| インフラ | AWS EC2 + Nginx + systemd |

---

## ディレクトリ構成

```
nudge-me/
├── backend/
│   ├── main.go
│   ├── go.mod
│   ├── go.sum
│   ├── .env.example
│   └── internal/
│       ├── handler/      # Echoハンドラー（HTTP層）
│       ├── model/        # GORMモデル・DTOリクエスト/レスポンス型
│       ├── repository/   # DBアクセス層
│       ├── service/      # ビジネスロジック層
│       └── middleware/   # JWT認証ミドルウェアなど
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   └── src/
│       ├── app/          # Next.js App Router ページ
│       ├── components/   # 共通UIコンポーネント
│       ├── lib/          # APIクライアント・ユーティリティ
│       └── types/        # TypeScript型定義
├── docs/
│   ├── requirements.md
│   ├── api-spec.md
│   ├── screen-design.md
│   └── infrastructure.md
├── .github/
│   ├── workflows/
│   │   ├── ci-backend.yml
│   │   └── ci-frontend.yml
│   └── ISSUE_TEMPLATE/
├── CLAUDE.md
├── .gitignore
└── README.md
```

---

## 絶対ルール（例外なし）

### 1. 作業開始前に必ず GitHub Issue を作成する

いかなる作業（機能追加・バグ修正・リファクタリング・ドキュメント更新）も、
GitHub Issue を作成してから着手する。Issue なしでコードを書いてはならない。

```bash
gh issue create --title "タイトル" --body "概要" --label "feature"
```

Issue 番号を必ず控える。以降のブランチ名・コミット・PR すべてに使用する。

### 2. 実装開始前に必ず Issue 対応ブランチを切る

Issue を作成したら、コードを一行も書く前に必ずブランチを作成する。
ブランチなしで `main` 上に直接コミットしてはならない。

```bash
git switch main
git pull origin main
git switch -c feature/#<Issue番号>-<機能名>
```

### 3. ブランチ命名規則

必ず `main` から派生させ、以下の形式で命名する:

```
<種別>/#<Issue番号>-<短い説明>
```

| 種別 | 形式 | 例 |
|------|------|----|
| 機能追加 | `feature/#{番号}-{概要}` | `feature/#1-add-auth` |
| バグ修正 | `fix/#{番号}-{概要}` | `fix/#5-jwt-null-error` |
| ドキュメント | `docs/#{番号}-{概要}` | `docs/#8-update-api-spec` |
| 雑務・設定 | `chore/#{番号}-{概要}` | `chore/#3-setup-ci` |

概要部分は英小文字・ハイフン区切り・最大30文字。

```bash
git switch main
git pull origin main
git switch -c feature/#1-add-auth
```

### 4. `main` への直接プッシュ禁止

`git push origin main` は絶対に実行しない。
`git push --force` / `git push -f` も禁止。
必ずブランチを作成し、Pull Request 経由でマージする。

### 5. コミットメッセージ規則（Conventional Commits）

形式: `<type>(<scope>): <概要（日本語）>`

- **概要は必ず日本語で書く**
- `type` は英語（以下から選択）、概要のみ日本語

`type` は以下から選択:
- `feat` — 新機能
- `fix` — バグ修正
- `docs` — ドキュメントのみの変更
- `style` — コードの意味に影響しない変更（フォーマット等）
- `refactor` — バグ修正でも機能追加でもないコード変更
- `test` — テストの追加・修正
- `chore` — ビルドプロセス・補助ツールの変更

`scope` は変更対象（`backend`, `frontend`, `db`, `ci`, `docs` 等）

```
# 良い例
feat(backend): JWTログインAPIを追加
feat(frontend): 性格診断クイズ画面を実装
fix(backend): AI応答のJSONパースエラーを修正
docs(readme): セットアップ手順を更新
chore(ci): GitHub Actions バックエンドCIを追加
```

### 6. ポート競合時の対処ルール

| サーバー | ポート | 確認・停止コマンド |
|----------|--------|-------------------|
| バックエンド（Go/Echo） | 8080 | `lsof -ti:8080 \| xargs kill` |
| フロントエンド（Next.js） | 3000 | `lsof -ti:3000 \| xargs kill` |

別ポートでの起動は禁止（Next.js rewrites 設定が崩れる）。

### 7. Pull Request のルール

- PR タイトル: コミットメッセージと同じ形式
- PR 本文: 必ず `Closes #<Issue番号>` または `Fixes #<Issue番号>` を含める
- PR テンプレートをすべて埋める（省略不可）
- CI が通過するまでマージしない

---

## サーバー起動手順

### バックエンド

```bash
cd backend
cp .env.example .env    # 初回のみ
# .env に各値を設定する
go run main.go
```

`http://localhost:8080` で起動。

### フロントエンド

```bash
cd frontend
npm install             # 初回のみ
npm run dev
```

`http://localhost:3000` で起動。

---

## 環境変数一覧

| 変数名 | 必須 | 説明 | 例 |
|--------|------|------|----|
| `PORT` | 任意 | バックエンドポート（デフォルト: 8080） | `8080` |
| `JWT_SECRET` | 必須 | JWT署名秘密鍵（32文字以上） | `your-super-secret-key-here` |
| `DB_PATH` | 任意 | SQLiteファイルパス（デフォルト: ./nudge.db） | `./nudge.db` |
| `ANTHROPIC_API_KEY` | 必須 | Claude APIキー | `sk-ant-...` |
| `FRONTEND_URL` | 必須 | フロントエンドURL（CORS用） | `http://localhost:3000` |

---

## 本番デプロイ手順

### バックエンド（クロスコンパイル → SCP転送）

ローカルマシンで実行:

```bash
cd backend
GOOS=linux GOARCH=amd64 go build -o nudge-me-server main.go
scp -i ~/.ssh/takatoseki.pem nudge-me-server ubuntu@52.193.6.70:/opt/nudge-me/backend/nudge-me-server
ssh -i ~/.ssh/takatoseki.pem ubuntu@52.193.6.70 "sudo systemctl restart nudge-me-backend"
```

### フロントエンド（EC2上でビルド）

EC2上で実行:

```bash
cd /opt/nudge-me/frontend
git pull origin main
npm install
npm run build
sudo systemctl restart nudge-me-frontend
```

---

## やってはいけないこと（禁止事項）

- `git push origin main` — 直接プッシュ禁止
- `git push --force` / `git push -f` — 強制プッシュ禁止
- `git reset --hard` — 作業履歴の破壊禁止
- Issue なしでブランチを作る — Issue First 原則
- テンプレートを空のままで PR を作る — テンプレート記入必須
- CI が赤いままでマージを提案する — CI グリーン必須
