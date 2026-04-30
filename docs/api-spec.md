# API仕様書 — NudgeMe

## 概要

| 項目 | 値 |
|------|-----|
| ベースURL | `http://localhost:8080` |
| フロントエンドからのアクセス | `/api/v1/*`（Next.js rewrites経由） |
| データ形式 | JSON（`Content-Type: application/json`） |
| 認証方式 | JWT Bearer Token（HS256） |

---

## エンドポイント一覧

### 認証（認証不要）

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/api/v1/auth/register` | ユーザー登録 |
| POST | `/api/v1/auth/login` | ログイン |
| POST | `/api/v1/auth/logout` | ログアウト |

#### POST /api/v1/auth/register
```json
// Request
{ "email": "user@example.com", "password": "password123" }

// Response 201
{ "token": "eyJ...", "user": { "id": 1, "email": "user@example.com", ... } }
```

#### POST /api/v1/auth/login
```json
// Request
{ "email": "user@example.com", "password": "password123" }

// Response 200
{ "token": "eyJ...", "user": { "id": 1, "email": "user@example.com", ... } }
```

#### POST /api/v1/auth/logout
```json
// Request
// Authorization: Bearer <token>
// Body: なし

// Response 200
{ "message": "ログアウトしました" }

// Response 401（トークンなし or 無効）
{ "message": "認証エラー" }
```

---

### 性格診断（要認証）

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/v1/personality/questions` | 診断質問一覧取得 |
| POST | `/api/v1/personality/result` | 診断結果を保存 |

#### GET /api/v1/personality/questions
```json
// Response 200
{
  "questions": [
    { "id": 1, "question": "急な予定変更があったとき、どちらが近い？", "options": ["すぐ対応できる", "少し戸惑う"] }
  ]
}
```

#### POST /api/v1/personality/result
```json
// Request
{ "answers": [1, 0, 1, 1] }

// Response 200
{ "personality_type": "analytical" }
```

---

### 意思決定（要認証）

| メソッド | パス | 説明 |
|----------|------|------|
| POST | `/api/v1/decisions` | AI決断リクエスト |
| POST | `/api/v1/decisions/random` | ランダム決断 |
| GET | `/api/v1/decisions` | 履歴一覧取得 |
| GET | `/api/v1/decisions/:id` | 履歴詳細取得 |
| PATCH | `/api/v1/decisions/:id/regret` | 後悔フィードバック更新 |

#### POST /api/v1/decisions
```json
// Request
{
  "question": "転職すべきか続けるべきか？",
  "options": ["転職する", "続ける"],
  "character": "kind"
}

// Response 201
{
  "decision": {
    "id": 1,
    "question": "転職すべきか続けるべきか？",
    "options": ["転職する", "続ける"],
    "ai_choice": "転職する",
    "ai_reason": "あなたの気持ちを大切に...",
    "is_random": false,
    "regret": null,
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### PATCH /api/v1/decisions/:id/regret
```json
// Request
{ "regret": true }

// Response 200
{ "decision": { "id": 1, "regret": true, ... } }
```

---

### 統計（要認証）

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/v1/stats/options` | 選択肢別選択統計 |

#### GET /api/v1/stats/options
```json
// Response 200
{
  "stats": [
    {
      "option": "転職する",
      "count": 42
    },
    {
      "option": "続ける",
      "count": 18
    }
  ]
}
```

---

### ユーザー（要認証）

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/v1/users/me` | 自分のプロフィール取得 |
| PATCH | `/api/v1/users/me/character` | AIキャラクター変更 |
| PATCH | `/api/v1/users/me/personality` | 性格タイプ更新 |

#### PATCH /api/v1/users/me/character
```json
// Request
{ "ai_character": "sarcastic" }

// Response 200
{ "user": { "id": 1, "ai_character": "sarcastic", ... } }
```

#### PATCH /api/v1/users/me/personality
```json
// Request
{ "personality_type": "analytical" }

// Response 200
{ "user": { "id": 1, "personality_type": "analytical", ... } }
```

---

## エラーレスポンス形式

```json
{ "message": "エラーの説明" }
```

| ステータスコード | 説明 |
|-----------------|------|
| 400 | リクエストが不正 |
| 401 | 認証エラー（トークンなし or 無効） |
| 404 | リソースが見つからない |
| 500 | サーバー内部エラー |
