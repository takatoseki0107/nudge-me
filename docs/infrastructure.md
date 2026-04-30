# インフラ構成 — NudgeMe

## 構成図

```
インターネット
    │
    │ HTTP:80 / HTTPS:443 / SSH:22
    ▼
┌────────────────────────────────────────────┐
│  AWS EC2 (t2.micro / Amazon Linux 2023)    │
│  ap-northeast-1 (東京)                     │
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

### 1. インスタンス作成

AWS コンソールまたは CLI で以下の設定でインスタンスを起動する。

| 項目 | 値 |
|------|-----|
| AMI | Amazon Linux 2023 (最新) |
| インスタンスタイプ | t2.micro (無料枠) |
| ストレージ | 20GB gp3 |
| セキュリティグループ | SSH(22), HTTP(80), HTTPS(443) をインバウンド許可 |
| キーペア | 任意の名前で作成・保存 |

### 2. EC2 初期セットアップ

```bash
# SSHで接続
ssh -i ~/.ssh/your-key.pem ec2-user@<EC2_PUBLIC_IP>

# パッケージ更新
sudo dnf update -y

# Git インストール
sudo dnf install -y git

# アプリディレクトリ作成
sudo mkdir -p /opt/nudge-me/data
sudo chown ec2-user:ec2-user /opt/nudge-me
```

### 3. Go のインストール

```bash
# Go 1.22 インストール
wget https://go.dev/dl/go1.22.5.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz
rm go1.22.5.linux-amd64.tar.gz

# PATHに追加
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc

# 確認
go version
```

### 4. Node.js のインストール

```bash
# Node.js 20.x インストール
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 確認
node -v
npm -v
```

### 5. Nginx のインストール

```bash
sudo dnf install -y nginx
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
vi /opt/nudge-me/backend/.env
```

`.env` に以下を設定する（`.env.example` 参照）:

| 変数名 | 説明 |
|--------|------|
| `PORT` | `8080` 固定 |
| `JWT_SECRET` | 32文字以上のランダム文字列（`openssl rand -base64 32` で生成） |
| `DB_PATH` | `/opt/nudge-me/data/nudge.db` |
| `ANTHROPIC_API_KEY` | Anthropic Console で取得したAPIキー |
| `FRONTEND_URL` | `http://<EC2_PUBLIC_IP>` または `https://<your-domain>` |

### 8. デプロイスクリプトの実行

```bash
cd /opt/nudge-me
chmod +x deploy.sh
./deploy.sh
```

---

## Nginx 設定

`/etc/nginx/conf.d/nudge-me.conf`:

```nginx
server {
    listen 80;
    server_name _;

    # Next.js フロントエンド
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

    # Go バックエンド API
    location /api/v1/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
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
User=ec2-user
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
User=ec2-user
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

ドメインを取得後、Certbot で SSL 証明書を取得する。

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

## SQLite バックアップ

```bash
# crontab に追加 (毎日 3:00 AM)
crontab -e
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

# コードの更新・再デプロイ
cd /opt/nudge-me
git pull origin main
./deploy.sh
```
