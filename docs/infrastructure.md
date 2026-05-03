# インフラ構成 — NudgeMe

## 構成概要

| レイヤー | サービス | 詳細 |
|----------|----------|------|
| フロントエンド | AWS Amplify | Next.js 15 SSR（WEB_COMPUTE） |
| バックエンド | AWS Lambda | Go + Echo（algnhsa経由） |
| API | AWS API Gateway | HTTP API |
| DB | Amazon DynamoDB | 3テーブル（users / decisions / personality-questions） |
| インフラ管理 | Terraform | terraform/ ディレクトリで管理 |

---

## 本番環境 URL

| リソース | URL / ARN |
|----------|-----------|
| フロントエンド（Amplify） | https://main.d2t4un0fj1m2x8.amplifyapp.com |
| API Gateway エンドポイント | https://40ywx4zpy8.execute-api.ap-northeast-1.amazonaws.com |
| Lambda 関数 | nudge-me-prod-api |
| Amplify アプリID | d2t4un0fj1m2x8 |

---

## アーキテクチャ図

```
ブラウザ
    │
    ▼
AWS Amplify（Next.js 15 SSR / WEB_COMPUTE）
    │  Next.js rewrites: /api/v1/* → API Gateway
    ▼
AWS API Gateway（HTTP API）
    │
    ▼
AWS Lambda（Go + Echo / algnhsa）
    │
    ├──→ Amazon DynamoDB（nudge-me-prod-users）
    ├──→ Amazon DynamoDB（nudge-me-prod-decisions）
    ├──→ Amazon DynamoDB（nudge-me-prod-personality-questions）
    │
    └──→ Anthropic API（claude-haiku-4-5）
```

---

## DynamoDB テーブル

| テーブル名 | パーティションキー | 用途 |
|-----------|------------------|------|
| nudge-me-prod-users | id (String) | ユーザー情報・性格タイプ |
| nudge-me-prod-decisions | id (String) | 意思決定履歴 |
| nudge-me-prod-personality-questions | id (String) | 性格診断問題（固定6問） |

---

## Terraform 管理リソース

`terraform/` ディレクトリで以下を管理:

- DynamoDB テーブル（3テーブル）
- Lambda 関数 + IAM ロール
- API Gateway HTTP API

### デプロイ手順

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars に ANTHROPIC_API_KEY・JWT_SECRET を設定

terraform init
terraform plan
terraform apply
```

---

## バックエンド（Lambda）ビルド・デプロイ手順

```bash
# Linux向けクロスコンパイル → zip
cd backend
GOOS=linux GOARCH=amd64 go build -o bootstrap ./lambda/main.go
zip lambda.zip bootstrap

# Terraform経由でデプロイ（推奨）
cd ../terraform
terraform apply -target=aws_lambda_function.api

# または AWS CLI で直接更新
aws lambda update-function-code \
  --function-name nudge-me-prod-api \
  --zip-file fileb://../backend/lambda.zip \
  --region ap-northeast-1
```

---

## フロントエンド（Amplify）デプロイ手順

main ブランチへのマージで自動デプロイ。

手動でデプロイする場合:

```bash
aws amplify start-job \
  --app-id d2t4un0fj1m2x8 \
  --branch-name main \
  --job-type RELEASE \
  --region ap-northeast-1
```

### Amplify 環境変数

| 変数名 | 値 |
|--------|-----|
| `NEXT_PUBLIC_API_URL` | `https://40ywx4zpy8.execute-api.ap-northeast-1.amazonaws.com` |

---

## Lambda 環境変数

| 変数名 | 説明 |
|--------|------|
| `JWT_SECRET` | JWT署名秘密鍵（32文字以上） |
| `ANTHROPIC_API_KEY` | Claude APIキー |
| `FRONTEND_URL` | AmplifyのURL（CORS用） |
| `DYNAMO_USERS_TABLE` | nudge-me-prod-users |
| `DYNAMO_DECISIONS_TABLE` | nudge-me-prod-decisions |
| `DYNAMO_PERSONALITY_TABLE` | nudge-me-prod-personality-questions |

---

## ローカル開発手順

### バックエンド

```bash
cd backend
cp .env.example .env
# .env に各値を設定（DBはローカルDynamoDB or 本番DynamoDBを使用）
go run main.go
```

`http://localhost:8080` で起動。

### フロントエンド

```bash
cd frontend
npm install
cp .env.example .env.local
# .env.local に NEXT_PUBLIC_API_URL=http://localhost:8080 を設定
npm run dev
```

`http://localhost:3000` で起動。

---

## 運用コマンド

```bash
# Amplifyデプロイ状況確認
aws amplify list-jobs --app-id d2t4un0fj1m2x8 --branch-name main --region ap-northeast-1

# Lambda関数のログ確認
aws logs tail /aws/lambda/nudge-me-prod-api --follow --region ap-northeast-1

# DynamoDBテーブルのアイテム数確認
aws dynamodb scan --table-name nudge-me-prod-users --select COUNT --region ap-northeast-1
```
