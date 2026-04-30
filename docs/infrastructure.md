# インフラ構成 — NudgeMe

## EC2 インスタンス情報

| 項目 | 値 |
|------|-----|
| インスタンスID | i-0ea38ff687cb35cfc |
| パブリックIP | 52.193.6.70 |
| リージョン | ap-northeast-1 (東京) |
| セキュリティグループ | sg-0e4f96e34e3c7c62b (nudge-me-sg) |
| キーペア | takatoseki |

SSH接続:

```bash
ssh -i ~/.ssh/takatoseki.pem ubuntu@52.193.6.70
```

---

## 構成図

```
インターネット
    │
    │ HTTP:80 / HTTPS:443 / SSH:22
    ▼
┌────────────────────────────────────────────┐
│  AWS EC2 (t2.micro)  ap-northeast-1 (東京) │
│  Ubuntu 22.04 LTS                          │
│                                            │
│  Nginx :80 / :443                          │
│    ├── /           → Next.js :3000         │
│    └── /api/v1/*   → Go/Echo :8080         │
│                                            │
│  Go/Echo :8080 (systemd管理)               │
│    └── /opt/nudge-me/data/nudge.db (SQLite)│
│                                            │
│  Next.js :3000 (systemd管理)               │
└────────────────────────────────────────────┘
```

---

## EC2 インスタンス起動手順

### 1. インスタンス設定

| 項目 | 値 |
|------|-----|
| AMI | Ubuntu 22.04 LTS |
| インスタンスタイプ | t2.micro（無料枠） |
| ストレージ | 20GB gp3 |
| セキュリティグループ | SSH(22), HTTP(80), HTTPS(443) |
| キーペア | 任意の名前で作成・保存 |

### 2. EC2 初期セットアップ

```bash
# SSHで接続
ssh -i ~/.ssh/your-key.pem ubuntu@<EC2_PUBLIC_IP>

# パッケージ更新
sudo apt update && sudo apt upgrade -y

# Git インストール
sudo apt install -y git

# アプリディレクトリ作成
sudo mkdir -p /opt/nudge-me/data
sudo chown ubuntu:ubuntu /opt/nudge-me
```

### 3. Node.js のインストール

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v && npm -v
```

### 5. Nginx のインストール

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 6. リポジトリのクローン

```bash
cd /opt/nudge-me
git clone https://github.com/takatoseki0107/nudge-me.git .
```

### 7. 環境変数の設定

```bash
cp /opt/nudge-me/backend/.env.example /opt/nudge-me/backend/.env
nano /opt/nudge-me/backend/.env
```

| 変数名 | 説明 |
|--------|------|
| `PORT` | `8080` 固定 |
| `JWT_SECRET` | 32文字以上のランダム文字列（`openssl rand -base64 32` で生成） |
| `DB_PATH` | `/opt/nudge-me/data/nudge.db` |
| `ANTHROPIC_API_KEY` | Anthropic Console で取得したAPIキー |
| `FRONTEND_URL` | `http://<EC2_PUBLIC_IP>` または `https://<your-domain>` |

### 8. デプロイ手順

バックエンドはローカルでクロスコンパイルし、SCPで転送します。フロントエンドはEC2上でビルドします。

#### バックエンド（クロスコンパイル → SCP転送）

ローカルマシンで実行:

```bash
# Linux/amd64 向けにクロスコンパイル
cd backend
GOOS=linux GOARCH=amd64 go build -o nudge-me-server main.go

# EC2へバイナリを転送
scp -i ~/.ssh/takatoseki.pem nudge-me-server ubuntu@52.193.6.70:/opt/nudge-me/backend/nudge-me-server

# バックエンドサービスを再起動
ssh -i ~/.ssh/takatoseki.pem ubuntu@52.193.6.70 "sudo systemctl restart nudge-me-backend"
```

#### フロントエンド（EC2上でビルド）

EC2上で実行:

```bash
cd /opt/nudge-me/frontend
git pull origin main
npm install
npm run build
sudo systemctl restart nudge-me-frontend
```

---

## Nginx 設定

`/etc/nginx/sites-available/nudge-me`:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/v1/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

有効化:

```bash
sudo ln -sf /etc/nginx/sites-available/nudge-me /etc/nginx/sites-enabled/nudge-me
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## systemd サービス設定

### バックエンド (`/etc/systemd/system/nudge-me-backend.service`)

```ini
[Unit]
Description=NudgeMe Backend (Go/Echo)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/nudge-me/backend
EnvironmentFile=/opt/nudge-me/backend/.env
ExecStart=/opt/nudge-me/backend/nudge-me-server
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### フロントエンド (`/etc/systemd/system/nudge-me-frontend.service`)

```ini
[Unit]
Description=NudgeMe Frontend (Next.js)
After=network.target nudge-me-backend.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/nudge-me/frontend
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NEXT_PUBLIC_API_URL=http://localhost:8080
ExecStart=/usr/bin/node /opt/nudge-me/frontend/.next/standalone/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

ログ確認:

```bash
sudo journalctl -u nudge-me-backend -f
sudo journalctl -u nudge-me-frontend -f
```

---

## HTTPS 対応 (Let's Encrypt)

ドメイン取得後:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

## SQLite バックアップ

```bash
# crontab -e で追加（毎日 3:00 AM）
0 3 * * * aws s3 cp /opt/nudge-me/data/nudge.db s3://your-bucket/backups/nudge-$(date +\%Y\%m\%d).db
```

---

## 運用コマンド集

```bash
# サービス再起動
sudo systemctl restart nudge-me-backend
sudo systemctl restart nudge-me-frontend

# ステータス確認
sudo systemctl status nudge-me-backend
sudo systemctl status nudge-me-frontend

# バックエンド更新（ローカルから）
cd backend
GOOS=linux GOARCH=amd64 go build -o nudge-me-server main.go
scp -i ~/.ssh/takatoseki.pem nudge-me-server ubuntu@52.193.6.70:/opt/nudge-me/backend/nudge-me-server
ssh -i ~/.ssh/takatoseki.pem ubuntu@52.193.6.70 "sudo systemctl restart nudge-me-backend"

# フロントエンド更新（EC2上で）
cd /opt/nudge-me/frontend && git pull origin main && npm install && npm run build && sudo systemctl restart nudge-me-frontend
```
