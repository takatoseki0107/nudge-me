#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/backend"

echo "Building Lambda binary..."
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bootstrap ./lambda/main.go

echo "Creating deployment zip..."
zip bootstrap.zip bootstrap

echo "Cleaning up binary..."
rm bootstrap

echo "Done: backend/bootstrap.zip"
