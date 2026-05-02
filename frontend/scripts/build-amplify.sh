#!/bin/bash
set -e

STANDALONE_DIR=".next/standalone"
STATIC_DIR=".next/static"
OUTPUT_DIR=".amplify-hosting"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR/compute/default"
mkdir -p "$OUTPUT_DIR/static/_next/static"

cp -r "$STANDALONE_DIR/." "$OUTPUT_DIR/compute/default/"
cp -r "$STATIC_DIR/." "$OUTPUT_DIR/static/_next/static/"

if [ -d "public" ]; then
  cp -r public/. "$OUTPUT_DIR/static/"
fi

NEXT_VERSION=$(node -e "console.log(require('./node_modules/next/package.json').version)")

cat > "$OUTPUT_DIR/deploy-manifest.json" <<EOF
{
  "version": 1,
  "routes": [
    {
      "path": "/_next/static/*",
      "target": {
        "kind": "Static",
        "cacheControl": "public, max-age=31536000, immutable"
      }
    },
    {
      "path": "/*.*",
      "target": { "kind": "Static" },
      "fallback": { "kind": "Compute", "src": "default" }
    },
    {
      "path": "/*",
      "target": { "kind": "Compute", "src": "default" }
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
    "version": "${NEXT_VERSION}"
  }
}
EOF

echo ".amplify-hosting structure created successfully"
ls -la "$OUTPUT_DIR"
