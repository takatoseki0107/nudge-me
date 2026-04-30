#!/bin/bash
# NudgeMe デプロイスクリプト (Ubuntu 22.04 LTS)
# 使い方: ./deploy.sh
# 前提: /opt/nudge-me に git clone 済み、/opt/nudge-me/backend/.env 設定済み

set -euo pipefail

APP_DIR="/opt/nudge-me"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
DATA_DIR="$APP_DIR/data"
APP_USER="ubuntu"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

# ──────────────────────────────────────────
# 1. コードの更新
# ──────────────────────────────────────────
log "コードを更新しています..."
cd "$APP_DIR"
git pull origin main

# ──────────────────────────────────────────
# 2. バックエンドビルド
# ──────────────────────────────────────────
log "バックエンドをビルドしています..."
cd "$BACKEND_DIR"
CGO_ENABLED=0 go build -o nudge-me-server .
log "バックエンドビルド完了"

# ──────────────────────────────────────────
# 3. フロントエンドビルド
# ──────────────────────────────────────────
log "フロントエンドをビルドしています..."
cd "$FRONTEND_DIR"
npm ci

NEXT_PUBLIC_API_URL="http://localhost:8080" npm run build

# standalone モードのビルド成果物に static/public を配置
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true
log "フロントエンドビルド完了"

# ──────────────────────────────────────────
# 4. データディレクトリ確認
# ──────────────────────────────────────────
mkdir -p "$DATA_DIR"

# ──────────────────────────────────────────
# 5. Nginx 設定 (Ubuntu: sites-available/sites-enabled)
# ──────────────────────────────────────────
log "Nginx を設定しています..."
sudo tee /etc/nginx/sites-available/nudge-me > /dev/null <<'NGINX'
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
NGINX

sudo ln -sf /etc/nginx/sites-available/nudge-me /etc/nginx/sites-enabled/nudge-me
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
log "Nginx 設定完了"

# ──────────────────────────────────────────
# 6. systemd サービス設定
# ──────────────────────────────────────────
log "systemd サービスを設定しています..."

sudo tee /etc/systemd/system/nudge-me-backend.service > /dev/null <<SERVICE
[Unit]
Description=NudgeMe Backend (Go/Echo)
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$BACKEND_DIR
EnvironmentFile=$BACKEND_DIR/.env
ExecStart=$BACKEND_DIR/nudge-me-server
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE

sudo tee /etc/systemd/system/nudge-me-frontend.service > /dev/null <<SERVICE
[Unit]
Description=NudgeMe Frontend (Next.js)
After=network.target nudge-me-backend.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$FRONTEND_DIR
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=NEXT_PUBLIC_API_URL=http://localhost:8080
ExecStart=/usr/bin/node $FRONTEND_DIR/.next/standalone/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICE

sudo systemctl daemon-reload

# ──────────────────────────────────────────
# 7. サービス起動・再起動
# ──────────────────────────────────────────
log "サービスを起動しています..."
sudo systemctl enable nudge-me-backend nudge-me-frontend
sudo systemctl restart nudge-me-backend
sudo systemctl restart nudge-me-frontend

sleep 2
sudo systemctl is-active nudge-me-backend && log "バックエンド: 起動中"
sudo systemctl is-active nudge-me-frontend && log "フロントエンド: 起動中"

log "デプロイ完了"
