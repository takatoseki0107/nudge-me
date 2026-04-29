# インフラ構成 — NudgeMe

## 構成図

```
インターネット
    │
    │ HTTP:80 / HTTPS:443 / SSH:22
    ▼
┌────────────────────────────────────────┐
│  AWS EC2 (t2.micro)  ap-northeast-1   │
│                                        │
│  Nginx :80 / :443                      │
│    ├── /           → Next.js静的ビルド  │
│    └── /api/v1/*   → :8080            │
│                                        │
│  Go/Echo :8080（内部のみ）             │
│    └── nudge.db（SQLiteファイル）      │
└────────────────────────────────────────┘
```

---

## 本番デプロイ手順（概要）

### 1. EC2 セットアップ

```bash
# Go のインストール
wget https://go.dev/dl/go1.22.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc

# Node.js のインストール（ビルド用）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx のインストール
sudo apt install -y nginx
```

### 2. バックエンドビルド & デプロイ

```bash
cd /opt/nudge-me/backend
go build -o nudge-me-server .
```

### 3. フロントエンドビルド & デプロイ

```bash
cd /opt/nudge-me/frontend
npm ci
NEXT_PUBLIC_API_URL=https://your-domain.com npm run build
# Next.js スタンドアロン出力 or Nginx で静的配信
```

---

## Nginx 設定例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # フロントエンド（Next.js ビルド成果物）
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # バックエンド API
    location /api/v1/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## systemd サービス設定

### バックエンド（`/etc/systemd/system/nudge-me-backend.service`）

```ini
[Unit]
Description=NudgeMe Backend
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/nudge-me/backend
EnvironmentFile=/opt/nudge-me/backend/.env
ExecStart=/opt/nudge-me/backend/nudge-me-server
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable nudge-me-backend
sudo systemctl start nudge-me-backend
sudo systemctl status nudge-me-backend
```

---

## 本番環境変数

EC2 上の `/opt/nudge-me/backend/.env` に以下を設定:

| 変数名 | 説明 |
|--------|------|
| `PORT` | Goサーバーポート（8080） |
| `JWT_SECRET` | JWT署名秘密鍵（32文字以上のランダム文字列） |
| `DB_PATH` | SQLiteファイルパス（例: `/opt/nudge-me/data/nudge.db`） |
| `ANTHROPIC_API_KEY` | Claude APIキー |
| `FRONTEND_URL` | EC2のパブリックURL or カスタムドメイン |

---

## バックアップ

SQLite は単一ファイルのため、定期的に S3 へコピーするのが推奨:

```bash
# crontab に追加
0 3 * * * aws s3 cp /opt/nudge-me/data/nudge.db s3://your-bucket/backups/nudge-$(date +\%Y\%m\%d).db
```
