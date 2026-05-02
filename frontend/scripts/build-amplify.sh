#!/bin/bash
set -e

# standaloneビルド出力からAmplify Hosting用の.amplify-hosting構造を生成する

NEXT_DIR=".next"
STANDALONE_DIR=".next/standalone"
STATIC_DIR=".next/static"
OUTPUT_DIR=".amplify-hosting"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/compute/default"
mkdir -p "$OUTPUT_DIR/static/_next/static"

# standaloneサーバーをcompute/defaultにコピー
cp -r "$STANDALONE_DIR/." "$OUTPUT_DIR/compute/default/"

# 静的ファイルをstaticにコピー
cp -r "$STATIC_DIR/." "$OUTPUT_DIR/static/_next/static/"

# publicディレクトリがあればコピー
if [ -d "public" ]; then
  cp -r public/. "$OUTPUT_DIR/static/"
fi

# deploy-manifest.json を生成
cat > "$OUTPUT_DIR/deploy-manifest.json" <<EOF
{
  "version": 1,
  "routes": [
    {
      "path": "/_next/static/<*>",
      "target": {
        "kind": "Static"
      },
      "fallback": null
    },
    {
      "path": "/favicon.ico",
      "target": {
        "kind": "Static"
      },
      "fallback": null
    },
    {
      "path": "/<*>",
      "target": {
        "kind": "Compute",
        "src": "default"
      },
      "fallback": null
    }
  ],
  "computeResources": [
    {
      "name": "default",
      "runtime": "nodejs20.x",
      "entrypoint": "server.js"
    }
  ],
  "framework": {
    "name": "next",
    "version": "$(node -e "console.log(require('./node_modules/next/package.json').version)")"
  }
}
EOF

echo ".amplify-hosting structure created successfully"
ls -la "$OUTPUT_DIR"
